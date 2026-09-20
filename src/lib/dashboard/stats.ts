import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, githubInstallation, repository } from "@/lib/db/schema";

export type DashboardStats = {
  repositoriesCount: number;
  monitoredCount: number;
  eventsTodayCount: number;
  totalEventsCount: number;
};

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });

  if (!installation) {
    return {
      repositoriesCount: 0,
      monitoredCount: 0,
      eventsTodayCount: 0,
      totalEventsCount: 0,
    };
  }

  const [repoCountResult, totalEventsResult] = await Promise.all([
    db
      .select({ total: count() })
      .from(repository)
      .where(eq(repository.installationId, installation.id)),
    db
      .select({ total: count() })
      .from(githubEvent)
      .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
      .where(eq(repository.installationId, installation.id)),
  ]);

  const [monitoredResult] = await db
    .select({ total: count() })
    .from(repository)
    .where(
      and(eq(repository.installationId, installation.id), eq(repository.isMonitored, true))
    );

  const [eventsTodayResult] = await db
    .select({ total: count() })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(
      and(
        eq(repository.installationId, installation.id),
        gte(githubEvent.createdAt, startOfTodayUtc())
      )
    );

  return {
    repositoriesCount: repoCountResult[0]?.total ?? 0,
    monitoredCount: monitoredResult?.total ?? 0,
    eventsTodayCount: eventsTodayResult?.total ?? 0,
    totalEventsCount: totalEventsResult[0]?.total ?? 0,
  };
}

/**
 * Lightweight count-only query used for polling: how many events have
 * arrived since a given timestamp. Deliberately returns just a number
 * (no rows), so this is cheap enough to call every ~15s from the client.
 */
export async function getNewEventsCountSince(userId: string, since: Date): Promise<number> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });
  if (!installation) return 0;

  const [result] = await db
    .select({ total: count() })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(
      and(eq(repository.installationId, installation.id), gte(githubEvent.createdAt, since))
    );

  return result?.total ?? 0;
}

export type RecentActivityItem = {
  id: string;
  eventType: string;
  action: string | null;
  actorLogin: string | null;
  actorAvatarUrl: string | null;
  summary: Record<string, unknown>;
  url: string | null;
  createdAt: Date;
  repositoryName: string;
};

export async function getRecentActivity(
  userId: string,
  limit = 10
): Promise<RecentActivityItem[]> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });

  if (!installation) return [];

  const rows = await db
    .select({
      id: githubEvent.id,
      eventType: githubEvent.eventType,
      action: githubEvent.action,
      actorLogin: githubEvent.actorLogin,
      actorAvatarUrl: githubEvent.actorAvatarUrl,
      summary: githubEvent.summary,
      url: githubEvent.url,
      createdAt: githubEvent.createdAt,
      repositoryName: repository.fullName,
    })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(eq(repository.installationId, installation.id))
    .orderBy(desc(githubEvent.createdAt))
    .limit(limit);

  return rows;
}
