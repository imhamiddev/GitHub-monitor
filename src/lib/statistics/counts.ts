import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, githubInstallation, repository } from "@/lib/db/schema";

export type StatisticsCounts = {
  commits: number;
  stars: number;
  forks: number;
  pullRequests: number;
  issues: number;
  releases: number;
};

const EMPTY_STATS: StatisticsCounts = {
  commits: 0,
  stars: 0,
  forks: 0,
  pullRequests: 0,
  issues: 0,
  releases: 0,
};

/**
 * Runs a single grouped-count query (GROUP BY event_type) rather than
 * six separate COUNT queries, keeping this cheap even as event volume
 * grows — the date range + installation filter apply once, and the
 * database does the bucketing.
 */
export async function getStatistics(
  userId: string,
  dateFrom: Date,
  dateTo?: Date
): Promise<StatisticsCounts> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });

  if (!installation) return EMPTY_STATS;

  const conditions = [
    eq(repository.installationId, installation.id),
    gte(githubEvent.createdAt, dateFrom),
  ];
  if (dateTo) {
    conditions.push(lte(githubEvent.createdAt, dateTo));
  }

  // Grouped counts for simple one-row-per-event categories (stars,
  // forks, pull requests, issues, releases).
  const rows = await db
    .select({
      eventType: githubEvent.eventType,
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(and(...conditions))
    .groupBy(githubEvent.eventType);

  // Commits need a separate sum: a single push event can carry
  // multiple commits, stored as summary.commitCount (jsonb), so a
  // plain row count would undercount actual commits.
  const [commitSumResult] = await db
    .select({
      total: sql<number>`coalesce(sum((${githubEvent.summary}->>'commitCount')::int), 0)`.mapWith(
        Number
      ),
    })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(and(...conditions, eq(githubEvent.eventType, "push")));

  const counts = { ...EMPTY_STATS };
  counts.commits = commitSumResult?.total ?? 0;

  for (const row of rows) {
    switch (row.eventType) {
      case "star":
        counts.stars += row.total;
        break;
      case "fork":
        counts.forks += row.total;
        break;
      case "pull_request":
      case "pull_request_review":
        counts.pullRequests += row.total;
        break;
      case "issues":
        counts.issues += row.total;
        break;
      case "release":
        counts.releases += row.total;
        break;
    }
  }

  return counts;
}
