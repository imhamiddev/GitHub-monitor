import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { repository, repositoryEventSetting } from "@/lib/db/schema";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/github/events";

export type RepositoryWithSettings = {
  id: string;
  fullName: string;
  name: string;
  ownerLogin: string;
  description: string | null;
  githubRepoId: number;
  isMonitored: boolean;
  eventSettings: Record<EventCategory, boolean>;
};

/**
 * Loads a repository by its local id, scoped to the given user's
 * installation — returns null if the repo doesn't exist or doesn't
 * belong to that user (prevents cross-account access via URL guessing).
 */
export async function getRepositoryForUser(
  repositoryId: string,
  installationDbId: string
): Promise<RepositoryWithSettings | null> {
  const repo = await db.query.repository.findFirst({
    where: and(
      eq(repository.id, repositoryId),
      eq(repository.installationId, installationDbId)
    ),
  });

  if (!repo) return null;

  const settings = await db.query.repositoryEventSetting.findMany({
    where: eq(repositoryEventSetting.repositoryId, repo.id),
  });
  const settingsByCategory = new Map(settings.map((s) => [s.eventType, s.enabled]));

  const eventSettings = Object.fromEntries(
    EVENT_CATEGORIES.map((category) => [
      category,
      settingsByCategory.get(category) ?? true, // default: enabled
    ])
  ) as Record<EventCategory, boolean>;

  return {
    id: repo.id,
    fullName: repo.fullName,
    name: repo.name,
    ownerLogin: repo.ownerLogin,
    description: repo.description,
    githubRepoId: repo.githubRepoId,
    isMonitored: repo.isMonitored,
    eventSettings,
  };
}
