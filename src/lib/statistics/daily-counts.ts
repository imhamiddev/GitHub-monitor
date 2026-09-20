import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, githubInstallation, repository } from "@/lib/db/schema";

export type DailyEventCount = { date: string; count: number };

/**
 * Returns a day-by-day event count for the last N days, including
 * days with zero events (so the chart doesn't skip gaps). Dates are
 * UTC calendar days, formatted as YYYY-MM-DD.
 */
export async function getDailyEventCounts(
  userId: string,
  days = 30
): Promise<DailyEventCount[]> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });

  const today = new Date();
  const dateKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }

  if (!installation) {
    return dateKeys.map((date) => ({ date, count: 0 }));
  }

  const from = new Date(dateKeys[0] + "T00:00:00.000Z");

  const rows = await db
    .select({
      day: sql<string>`to_char(${githubEvent.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(
      and(eq(repository.installationId, installation.id), gte(githubEvent.createdAt, from))
    )
    .groupBy(sql`to_char(${githubEvent.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);

  const countsByDay = new Map(rows.map((row) => [row.day, row.total]));

  return dateKeys.map((date) => ({ date, count: countsByDay.get(date) ?? 0 }));
}
