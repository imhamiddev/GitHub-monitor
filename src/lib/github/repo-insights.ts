import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, repository } from "@/lib/db/schema";
import type { RecentActivityItem } from "@/lib/dashboard/stats";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDayUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

function dayKeys(days: number): string[] {
  const today = startOfDayUtc(new Date());
  return Array.from({ length: days }, (_, i) =>
    new Date(today.getTime() - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10)
  );
}

const dayExpr = sql<string>`to_char(${githubEvent.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;

/* ------------------------------- star growth ------------------------------- */

export type StarPoint = { date: string; stars: number; gained: number };

/**
 * Cumulative star count per day. Net change per day (stars added minus
 * removed) is replayed backwards from the repository's current count, so
 * the last point always equals the live total.
 */
export async function getStarGrowth(repositoryId: string, currentStars: number, days = 30): Promise<StarPoint[]> {
  const keys = dayKeys(days);
  const from = new Date(`${keys[0]}T00:00:00.000Z`);

  const rows = await db
    .select({
      day: dayExpr,
      net: sql<number>`sum(case when ${githubEvent.action} = 'deleted' then -1 else 1 end)`.mapWith(Number),
    })
    .from(githubEvent)
    .where(and(eq(githubEvent.repositoryId, repositoryId), eq(githubEvent.eventType, "star"), gte(githubEvent.createdAt, from)))
    .groupBy(dayExpr);

  const netByDay = new Map(rows.map((r) => [r.day, r.net]));
  const totalNet = [...netByDay.values()].reduce((a, b) => a + b, 0);

  let running = Math.max(currentStars - totalNet, 0);
  return keys.map((date) => {
    const gained = netByDay.get(date) ?? 0;
    running += gained;
    return { date, stars: running, gained };
  });
}

/* ------------------------------ weekly commits ------------------------------ */

export type WeeklyCommits = { week: string; commits: number };

/** Commits per ISO week (Monday start) for the last N weeks, zero-filled. */
export async function getWeeklyCommits(repositoryId: string, weeks = 12): Promise<WeeklyCommits[]> {
  const today = startOfDayUtc(new Date());
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY_MS);
  const keys = Array.from({ length: weeks }, (_, i) =>
    new Date(monday.getTime() - (weeks - 1 - i) * 7 * DAY_MS).toISOString().slice(0, 10)
  );
  const from = new Date(`${keys[0]}T00:00:00.000Z`);

  const weekExpr = sql<string>`to_char(date_trunc('week', ${githubEvent.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      week: weekExpr,
      commits: sql<number>`coalesce(sum((${githubEvent.summary}->>'commitCount')::int), 0)`.mapWith(Number),
    })
    .from(githubEvent)
    .where(and(eq(githubEvent.repositoryId, repositoryId), eq(githubEvent.eventType, "push"), gte(githubEvent.createdAt, from)))
    .groupBy(weekExpr);

  const byWeek = new Map(rows.map((r) => [r.week, r.commits]));
  return keys.map((week) => ({ week, commits: byWeek.get(week) ?? 0 }));
}

/* ----------------------------- top contributors ----------------------------- */

export type Contributor = { login: string; avatarUrl: string | null; events: number; commits: number };

export async function getTopContributors(repositoryId: string, days = 30, limit = 5): Promise<Contributor[]> {
  const from = new Date(Date.now() - days * DAY_MS);
  const rows = await db
    .select({
      login: githubEvent.actorLogin,
      avatarUrl: sql<string | null>`max(${githubEvent.actorAvatarUrl})`,
      events: sql<number>`count(*)`.mapWith(Number),
      commits: sql<number>`coalesce(sum((${githubEvent.summary}->>'commitCount')::int) filter (where ${githubEvent.eventType} = 'push'), 0)`.mapWith(Number),
    })
    .from(githubEvent)
    .where(and(eq(githubEvent.repositoryId, repositoryId), gte(githubEvent.createdAt, from), isNotNull(githubEvent.actorLogin)))
    .groupBy(githubEvent.actorLogin)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return rows.filter((r): r is Contributor => r.login !== null);
}

/* ------------------------------ totals & feed ------------------------------ */

export type RepoTotals = { commits: number; stars: number; forks: number; pullRequests: number; issues: number };

export async function getRepoTotals(repositoryId: string, days = 30): Promise<RepoTotals> {
  const from = new Date(Date.now() - days * DAY_MS);
  const rows = await db
    .select({
      eventType: githubEvent.eventType,
      total: sql<number>`count(*)`.mapWith(Number),
      commits: sql<number>`coalesce(sum((${githubEvent.summary}->>'commitCount')::int), 0)`.mapWith(Number),
    })
    .from(githubEvent)
    .where(and(eq(githubEvent.repositoryId, repositoryId), gte(githubEvent.createdAt, from)))
    .groupBy(githubEvent.eventType);

  const totals: RepoTotals = { commits: 0, stars: 0, forks: 0, pullRequests: 0, issues: 0 };
  for (const r of rows) {
    if (r.eventType === "push") totals.commits += r.commits;
    else if (r.eventType === "star") totals.stars += r.total;
    else if (r.eventType === "fork") totals.forks += r.total;
    else if (r.eventType === "pull_request" || r.eventType === "pull_request_review") totals.pullRequests += r.total;
    else if (r.eventType === "issues") totals.issues += r.total;
  }
  return totals;
}

export async function getRepoRecentEvents(repositoryId: string, limit = 8): Promise<RecentActivityItem[]> {
  const rows = await db
    .select({ event: githubEvent, repoName: repository.fullName })
    .from(githubEvent)
    .innerJoin(repository, eq(repository.id, githubEvent.repositoryId))
    .where(eq(githubEvent.repositoryId, repositoryId))
    .orderBy(desc(githubEvent.createdAt))
    .limit(limit);

  return rows.map(({ event, repoName }) => ({
    id: event.id,
    eventType: event.eventType,
    action: event.action,
    actorLogin: event.actorLogin,
    actorAvatarUrl: event.actorAvatarUrl,
    summary: event.summary,
    url: event.url,
    createdAt: event.createdAt,
    repositoryName: repoName,
  }));
}

/** Live counters stored on the repository row. */
export async function getRepoCounters(repositoryId: string) {
  const repo = await db.query.repository.findFirst({ where: eq(repository.id, repositoryId) });
  return { stars: repo?.starsCount ?? 0, forks: repo?.forksCount ?? 0 };
}
