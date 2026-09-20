import { and, count, desc, eq, gte, lte, or, ilike } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, githubInstallation, repository } from "@/lib/db/schema";

export type ActivityListItem = {
  id: string;
  eventType: string;
  action: string | null;
  actorLogin: string | null;
  actorAvatarUrl: string | null;
  summary: Record<string, unknown>;
  url: string | null;
  createdAt: Date;
  repositoryId: string;
  repositoryName: string;
};

const PAGE_SIZE = 20;

export type ActivityFilters = {
  repositoryId?: string;
  eventType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
};

export async function getActivity(
  userId: string,
  filters: ActivityFilters = {}
): Promise<{ items: ActivityListItem[]; totalPages: number; page: number }> {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });

  if (!installation) {
    return { items: [], totalPages: 1, page: 1 };
  }

  const page = Math.max(1, filters.page ?? 1);

  const conditions = [eq(repository.installationId, installation.id)];
  if (filters.repositoryId) {
    conditions.push(eq(repository.id, filters.repositoryId));
  }
  if (filters.eventType) {
    conditions.push(eq(githubEvent.eventType, filters.eventType));
  }
  if (filters.dateFrom) {
    conditions.push(gte(githubEvent.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(githubEvent.createdAt, filters.dateTo));
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(repository.fullName, term), ilike(githubEvent.actorLogin, term))!
    );
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ total: count() })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil((totalResult?.total ?? 0) / PAGE_SIZE));

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
      repositoryId: repository.id,
      repositoryName: repository.fullName,
    })
    .from(githubEvent)
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(whereClause)
    .orderBy(desc(githubEvent.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: rows, totalPages, page };
}

export async function getMonitoredRepositoriesForFilter(userId: string) {
  const installation = await db.query.githubInstallation.findFirst({
    where: eq(githubInstallation.userId, userId),
  });
  if (!installation) return [];

  return db.query.repository.findMany({
    where: and(
      eq(repository.installationId, installation.id),
      eq(repository.isMonitored, true)
    ),
    columns: { id: true, name: true, fullName: true },
    orderBy: (row, { asc }) => asc(row.name),
  });
}
