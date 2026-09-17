import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { repository } from "@/lib/db/schema";
import { getInstallationOctokit } from "@/lib/github/app";

export type RepoListItem = {
  id: string | null; // null if not yet synced into our DB
  githubRepoId: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  isMonitored: boolean;
};

/**
 * Fetches all repositories accessible to a GitHub App installation
 * (paginated) and merges them with our local monitoring state. This
 * is the source of truth for "what repos can this user see" — GitHub
 * itself, not just what we've previously synced.
 */
export async function listInstallationRepositories(
  installationDbId: string,
  installationId: number
): Promise<RepoListItem[]> {
  const octokit = getInstallationOctokit(installationId);

  const githubRepos = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 }
  );

  const localRepos = await db.query.repository.findMany({
    where: eq(repository.installationId, installationDbId),
  });
  const localByGithubId = new Map(localRepos.map((r) => [r.githubRepoId, r]));

  return githubRepos.map((repo) => {
    const local = localByGithubId.get(repo.id);
    return {
      id: local?.id ?? null,
      githubRepoId: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      ownerLogin: repo.owner.login,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch ?? "main",
      starsCount: repo.stargazers_count ?? 0,
      forksCount: repo.forks_count ?? 0,
      openIssuesCount: repo.open_issues_count ?? 0,
      isMonitored: local?.isMonitored ?? false,
    };
  });
}

/**
 * Ensures a repository row exists locally (creating it from live
 * GitHub data if needed), then sets its monitored flag. Called when
 * the user toggles monitoring on a repo we may not have synced yet.
 */
export async function setRepositoryMonitored(params: {
  installationDbId: string;
  installationId: number;
  githubRepoId: number;
  monitored: boolean;
}) {
  const existing = await db.query.repository.findFirst({
    where: and(
      eq(repository.installationId, params.installationDbId),
      eq(repository.githubRepoId, params.githubRepoId)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(repository)
      .set({ isMonitored: params.monitored, updatedAt: new Date() })
      .where(eq(repository.id, existing.id))
      .returning();
    return updated;
  }

  // First time monitoring this repo — fetch its current metadata from
  // GitHub so we have a real row to attach event settings/events to.
  const octokit = getInstallationOctokit(params.installationId);
  const repos = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 }
  );
  const match = repos.find((r) => r.id === params.githubRepoId);
  if (!match) {
    throw new Error("Repository not accessible to this installation");
  }

  const [created] = await db
    .insert(repository)
    .values({
      id: randomUUID(),
      installationId: params.installationDbId,
      githubRepoId: match.id,
      fullName: match.full_name,
      name: match.name,
      ownerLogin: match.owner.login,
      description: match.description,
      private: match.private,
      defaultBranch: match.default_branch ?? "main",
      starsCount: match.stargazers_count ?? 0,
      forksCount: match.forks_count ?? 0,
      openIssuesCount: match.open_issues_count ?? 0,
      isMonitored: params.monitored,
      lastSyncedAt: new Date(),
    })
    .returning();
  return created;
}
