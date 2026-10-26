import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { githubInstallation, repository, telegramConnection, user } from "@/lib/db/schema";

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
