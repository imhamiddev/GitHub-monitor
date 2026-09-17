import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { repository, repositoryEventSetting } from "@/lib/db/schema";
import type { EventCategory } from "@/lib/github/events";

export async function findMonitoredRepositoryByGithubId(githubRepoId: number) {
  return db.query.repository.findFirst({
    where: and(
      eq(repository.githubRepoId, githubRepoId),
      eq(repository.isMonitored, true)
    ),
  });
}

/**
 * Returns whether notifications for a given event category are enabled
 * for a repository. Defaults to enabled if no explicit setting row
 * exists yet (opt-out model — a newly monitored repo notifies for
 * everything until the user turns categories off).
 */
export async function isEventCategoryEnabled(
  repositoryId: string,
  category: EventCategory
): Promise<boolean> {
  const setting = await db.query.repositoryEventSetting.findFirst({
    where: and(
      eq(repositoryEventSetting.repositoryId, repositoryId),
      eq(repositoryEventSetting.eventType, category)
    ),
  });

  return setting ? setting.enabled : true;
}
