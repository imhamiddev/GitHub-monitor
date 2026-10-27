import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  githubEvent,
  githubInstallation,
  repository,
  telegramConnection,
  telegramGroup,
  user,
} from "@/lib/db/schema";

export type Member = {
  userId: string;
  name: string;
  email: string;
  chatId: string;
  notificationsEnabled: boolean;
  connectedAt: Date | null;
  githubLogin: string | null;
};

/** Resolves the site account linked to a Telegram chat (null = not linked). */
export async function getMemberByChatId(chatId: string): Promise<Member | null> {
  const [row] = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      chatId: telegramConnection.chatId,
      notificationsEnabled: telegramConnection.notificationsEnabled,
      connectedAt: telegramConnection.connectedAt,
      githubLogin: githubInstallation.githubAccountLogin,
    })
    .from(telegramConnection)
    .innerJoin(user, eq(user.id, telegramConnection.userId))
    .leftJoin(
      githubInstallation,
      and(eq(githubInstallation.userId, user.id), eq(githubInstallation.status, "active"))
    )
    .where(eq(telegramConnection.chatId, chatId))
    .limit(1);

  if (!row || !row.chatId) return null;
  return { ...row, chatId: row.chatId };
}

export async function setNotificationsByChatId(chatId: string, enabled: boolean) {
  await db
    .update(telegramConnection)
    .set({ notificationsEnabled: enabled, updatedAt: new Date() })
    .where(eq(telegramConnection.chatId, chatId));
}

export type MonitoredRepo = {
  fullName: string;
  private: boolean;
  starsCount: number;
  forksCount: number;
};

export async function getMonitoredRepos(userId: string, limit = 15): Promise<MonitoredRepo[]> {
  return db
    .select({
      fullName: repository.fullName,
      private: repository.private,
      starsCount: repository.starsCount,
      forksCount: repository.forksCount,
    })
    .from(repository)
    .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
    .where(and(eq(githubInstallation.userId, userId), eq(repository.isMonitored, true)))
    .orderBy(desc(repository.starsCount))
    .limit(limit);
}

export type TopRepo = { fullName: string; events: number };
export type TopActor = { login: string; events: number };

/** Leaderboard data for /top: starred repos + 7-day activity ranking. */
export async function getTopData(userId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const owned = eq(githubInstallation.userId, userId);

  const starred = await getMonitoredRepos(userId, 5);

  const activeRepos = await db
    .select({ fullName: repository.fullName, events: sql<number>`count(*)::int` })
    .from(githubEvent)
    .innerJoin(repository, eq(repository.id, githubEvent.repositoryId))
    .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
    .where(and(owned, gte(githubEvent.createdAt, since)))
    .groupBy(repository.fullName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const actors = await db
    .select({ login: githubEvent.actorLogin, events: sql<number>`count(*)::int` })
    .from(githubEvent)
    .innerJoin(repository, eq(repository.id, githubEvent.repositoryId))
    .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
    .where(and(owned, gte(githubEvent.createdAt, since), isNotNull(githubEvent.actorLogin)))
    .groupBy(githubEvent.actorLogin)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return {
    starred,
    activeRepos,
    actors: actors.filter((a): a is TopActor => a.login !== null),
  };
}

export async function countGroups(userId: string): Promise<number> {
  const rows = await db
    .select({ id: telegramGroup.id })
    .from(telegramGroup)
    .where(eq(telegramGroup.userId, userId));
  return rows.length;
}
