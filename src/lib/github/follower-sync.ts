import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  followerSnapshot,
  githubEvent,
  githubInstallation,
  repository,
} from "@/lib/db/schema";
import { getInstallationOctokit } from "@/lib/github/app";

export type FollowerSyncResult = {
  userId: string;
  githubLogin: string;
  followersBefore: number;
  followersAfter: number;
  newFollowers: string[];
  unfollowed: string[];
};

/**
 * Fetches the live follower list for a GitHub App installation's
 * account, diffs it against our last stored snapshot, and returns
 * what changed. GitHub has no webhook event for follows/unfollows,
 * so this function exists to be called periodically (see the cron
 * route), not in response to any webhook.
 */
export async function syncFollowersForInstallation(
  installationDbId: string,
  installationId: number,
  userId: string,
  githubLogin: string
): Promise<FollowerSyncResult | null> {
  const octokit = getInstallationOctokit(installationId);

  let liveFollowers: string[];
  try {
    const followers = await octokit.paginate(octokit.rest.users.listFollowersForUser, {
      username: githubLogin,
      per_page: 100,
    });
    liveFollowers = followers.map((f) => f.login);
  } catch (error) {
    console.error(`Failed to fetch followers for ${githubLogin}:`, error);
    return null;
  }

  const previousSnapshots = await db.query.followerSnapshot.findMany({
    where: eq(followerSnapshot.userId, userId),
  });
  const previousSet = new Set(previousSnapshots.map((s) => s.githubLogin));
  const liveSet = new Set(liveFollowers);

  const newFollowers = liveFollowers.filter((login) => !previousSet.has(login));
  const unfollowed = [...previousSet].filter((login) => !liveSet.has(login));

  const followersBefore = previousSet.size;
  const followersAfter = liveSet.size;

  if (newFollowers.length === 0 && unfollowed.length === 0) {
    return { userId, githubLogin, followersBefore, followersAfter, newFollowers, unfollowed };
  }

  // Update the stored snapshot to match GitHub's current state.
  for (const login of newFollowers) {
    await db
      .insert(followerSnapshot)
      .values({ id: randomUUID(), userId, githubLogin: login })
      .onConflictDoNothing();
  }
  for (const login of unfollowed) {
    await db
      .delete(followerSnapshot)
      .where(and(eq(followerSnapshot.userId, userId), eq(followerSnapshot.githubLogin, login)));
  }

  await recordFollowerEvents({
    installationDbId,
    userId,
    newFollowers,
    unfollowed,
    followersBefore,
  });

  return { userId, githubLogin, followersBefore, followersAfter, newFollowers, unfollowed };
}

/**
 * Records follower/unfollow changes as githubEvent rows so they show
 * up in the Activity feed alongside repository events. These events
 * aren't tied to a specific repository, so we attach them to the
 * installation's first repository purely to satisfy the FK constraint
 * and give the UI something to group by. If the installation has no
 * repositories yet, follower events are skipped — there would be
 * nothing to attach them to.
 */
async function recordFollowerEvents(params: {
  installationDbId: string;
  userId: string;
  newFollowers: string[];
  unfollowed: string[];
  followersBefore: number;
}) {
  const anyRepo = await db.query.repository.findFirst({
    where: eq(repository.installationId, params.installationDbId),
  });
  if (!anyRepo) return;
  const repositoryId = anyRepo.id;

  let runningCount = params.followersBefore;

  async function insertFollowerEvent(login: string, action: "followed" | "unfollowed") {
    const before = runningCount;
    runningCount += action === "followed" ? 1 : -1;

    await db.insert(githubEvent).values({
      id: randomUUID(),
      repositoryId,
      // Synthetic delivery id: follower events don't come from a
      // webhook delivery, so we mint a unique id ourselves to satisfy
      // the same idempotency-oriented unique constraint.
      githubDeliveryId: `follower:${randomUUID()}`,
      eventType: "follower",
      action,
      actorLogin: login,
      actorAvatarUrl: `https://github.com/${login}.png`,
      summary: {
        kind: "follower",
        followersBefore: before,
        followersAfter: runningCount,
      },
      url: `https://github.com/${login}`,
    });
  }

  for (const login of params.newFollowers) {
    await insertFollowerEvent(login, "followed");
  }
  for (const login of params.unfollowed) {
    await insertFollowerEvent(login, "unfollowed");
  }
}

export async function getAllActiveInstallationsForFollowerSync() {
  return db.query.githubInstallation.findMany({
    where: eq(githubInstallation.status, "active"),
  });
}
