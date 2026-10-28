import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { alertRule, githubInstallation, repository } from "@/lib/db/schema";

export type AlertRuleListItem = {
  id: string;
  name: string;
  repositoryName: string | null;
  eventType: string;
  action: string | null;
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
  enabled: boolean;
  lastTriggeredAt: Date | null;
};

export async function listAlertRules(userId: string): Promise<AlertRuleListItem[]> {
  const rows = await db
    .select({
      id: alertRule.id,
      name: alertRule.name,
      repositoryName: repository.fullName,
      eventType: alertRule.eventType,
      action: alertRule.action,
      threshold: alertRule.threshold,
      windowMinutes: alertRule.windowMinutes,
      cooldownMinutes: alertRule.cooldownMinutes,
      enabled: alertRule.enabled,
      lastTriggeredAt: alertRule.lastTriggeredAt,
    })
    .from(alertRule)
    .leftJoin(repository, eq(repository.id, alertRule.repositoryId))
    .where(eq(alertRule.userId, userId))
    .orderBy(desc(alertRule.createdAt));
  return rows;
}

export type RepoOption = { id: string; fullName: string };

/** Repositories a rule can be scoped to (the user's monitored ones). */
export async function listRepoOptions(userId: string): Promise<RepoOption[]> {
  return db
    .select({ id: repository.id, fullName: repository.fullName })
    .from(repository)
    .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
    .where(eq(githubInstallation.userId, userId))
    .orderBy(repository.fullName);
}
