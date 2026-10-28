import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { alertRule, githubEvent, githubInstallation, repository } from "@/lib/db/schema";
import { DIVIDER, escapeHtml } from "@/lib/telegram/format";
import { t, translateEventLabel, type Lang } from "@/lib/telegram/i18n";
import { getEventDisplay } from "@/lib/github/event-display";
import { notifyUserText } from "@/lib/telegram/notify";

export type AlertEventContext = {
  userId: string;
  repositoryId: string;
  repositoryName: string;
  eventType: string;
  action: string | null;
};

type Rule = typeof alertRule.$inferSelect;

/** Does the freshly stored event fall under this rule's filter? */
function ruleMatches(rule: Rule, ctx: AlertEventContext): boolean {
  if (rule.repositoryId && rule.repositoryId !== ctx.repositoryId) return false;
  if (rule.eventType !== "any" && rule.eventType !== ctx.eventType) return false;
  if (rule.action && rule.action !== ctx.action) return false;
  return true;
}

/** How many matching events happened inside the rule's time window? */
async function countInWindow(rule: Rule, userId: string): Promise<number> {
  const since = new Date(Date.now() - rule.windowMinutes * 60_000);

  const conditions = [gte(githubEvent.createdAt, since)];
  if (rule.eventType !== "any") conditions.push(eq(githubEvent.eventType, rule.eventType));
  if (rule.action) conditions.push(eq(githubEvent.action, rule.action));

  if (rule.repositoryId) {
    conditions.push(eq(githubEvent.repositoryId, rule.repositoryId));
  } else {
    const owned = db
      .select({ id: repository.id })
      .from(repository)
      .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
      .where(eq(githubInstallation.userId, userId));
    conditions.push(inArray(githubEvent.repositoryId, owned));
  }

  const [row] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(githubEvent)
    .where(and(...conditions));
  return row?.total ?? 0;
}

/**
 * Claims the right to fire a rule. The conditional UPDATE only succeeds when
 * the cooldown has elapsed, so concurrent webhooks can't double-notify.
 */
async function claimTrigger(rule: Rule): Promise<boolean> {
  const cutoff = new Date(Date.now() - rule.cooldownMinutes * 60_000);
  const claimed = await db
    .update(alertRule)
    .set({ lastTriggeredAt: new Date() })
    .where(
      and(
        eq(alertRule.id, rule.id),
        eq(alertRule.enabled, true),
        or(isNull(alertRule.lastTriggeredAt), lt(alertRule.lastTriggeredAt, cutoff))
      )
    )
    .returning({ id: alertRule.id });
  return claimed.length > 0;
}

function describeRule(rule: Rule, lang: Lang): string {
  const what =
    rule.eventType === "any"
      ? t(lang, "alert.anyEvent")
      : translateEventLabel(lang, getEventDisplay(rule.eventType, rule.action).label);
  return escapeHtml(what);
}

function alertText(rule: Rule, count: number, repoName: string, lang: Lang): string {
  return [
    t(lang, "alert.title"),
    DIVIDER,
    `🔔 <b>${escapeHtml(rule.name)}</b>`,
    t(lang, "alert.what", { what: describeRule(rule, lang) }),
    t(lang, "alert.count", { n: count, minutes: rule.windowMinutes }),
    t(lang, rule.repositoryId ? "alert.repo" : "alert.lastRepo", { repo: escapeHtml(repoName) }),
  ].join("\n");
}

/**
 * Call after an event has been stored. Evaluates every enabled rule of the
 * user that matches the event and notifies on Telegram when the threshold is
 * reached. Never throws.
 */
export async function evaluateAlertRules(ctx: AlertEventContext) {
  try {
    const rules = await db.query.alertRule.findMany({
      where: and(eq(alertRule.userId, ctx.userId), eq(alertRule.enabled, true)),
    });

    for (const rule of rules) {
      if (!ruleMatches(rule, ctx)) continue;

      const count = await countInWindow(rule, ctx.userId);
      if (count < rule.threshold) continue;
      if (!(await claimTrigger(rule))) continue;

      await notifyUserText(ctx.userId, (lang) => ({
        text: alertText(rule, count, ctx.repositoryName, lang),
      }));
    }
  } catch (error) {
    console.error("Alert evaluation error:", error);
  }
}
