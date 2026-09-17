import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubEvent, notification, repository } from "@/lib/db/schema";

export type NotificationListItem = {
  id: string;
  read: boolean;
  createdAt: Date;
  eventId: string;
  eventType: string;
  action: string | null;
  actorLogin: string | null;
  actorAvatarUrl: string | null;
  summary: Record<string, unknown>;
  url: string | null;
  repositoryName: string;
};

const PAGE_SIZE = 20;

export async function getNotifications(
  userId: string,
  options: { filter?: "all" | "unread"; page?: number } = {}
): Promise<{ items: NotificationListItem[]; totalPages: number; page: number }> {
  const page = Math.max(1, options.page ?? 1);
  const filter = options.filter ?? "all";

  const whereClause =
    filter === "unread"
      ? and(eq(notification.userId, userId), eq(notification.read, false))
      : eq(notification.userId, userId);

  const [totalResult] = await db
    .select({ total: count() })
    .from(notification)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil((totalResult?.total ?? 0) / PAGE_SIZE));

  const rows = await db
    .select({
      id: notification.id,
      read: notification.read,
      createdAt: notification.createdAt,
      eventId: githubEvent.id,
      eventType: githubEvent.eventType,
      action: githubEvent.action,
      actorLogin: githubEvent.actorLogin,
      actorAvatarUrl: githubEvent.actorAvatarUrl,
      summary: githubEvent.summary,
      url: githubEvent.url,
      repositoryName: repository.fullName,
    })
    .from(notification)
    .innerJoin(githubEvent, eq(notification.eventId, githubEvent.id))
    .innerJoin(repository, eq(githubEvent.repositoryId, repository.id))
    .where(whereClause)
    .orderBy(desc(notification.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: rows, totalPages, page };
}

export { PAGE_SIZE as NOTIFICATIONS_PAGE_SIZE };
