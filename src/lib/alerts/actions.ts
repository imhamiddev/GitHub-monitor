"use server";

import { randomUUID } from "crypto";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { ALERT_EVENT_TYPES, ALERT_LIMITS } from "@/lib/alerts/presets";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { alertRule, githubInstallation, repository } from "@/lib/db/schema";

type ActionResult = { success: true } | { success: false; error: string };

export type AlertRuleInput = {
  name: string;
  repositoryId: string | null;
  eventType: string;
  action: string | null;
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
};

const inRange = (n: number, r: { min: number; max: number }) => Number.isInteger(n) && n >= r.min && n <= r.max;

export async function createAlertRule(input: AlertRuleInput): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };
  const userId = session.user.id;

  const name = input.name.trim();
  if (name.length < 1 || name.length > 80) return { success: false, error: "Name must be 1–80 characters." };
  if (!ALERT_EVENT_TYPES.some((e) => e.value === input.eventType)) {
    return { success: false, error: "Unknown event type." };
  }
  const action = input.action?.trim().toLowerCase() || null;
  if (action && !/^[a-z_]{1,40}$/.test(action)) return { success: false, error: "Invalid action filter." };
  if (!inRange(input.threshold, ALERT_LIMITS.threshold)) {
    return { success: false, error: `Threshold must be ${ALERT_LIMITS.threshold.min}–${ALERT_LIMITS.threshold.max}.` };
  }
  if (!inRange(input.windowMinutes, ALERT_LIMITS.windowMinutes)) {
    return { success: false, error: `Window must be ${ALERT_LIMITS.windowMinutes.min}–${ALERT_LIMITS.windowMinutes.max} minutes.` };
  }
  if (!inRange(input.cooldownMinutes, ALERT_LIMITS.cooldownMinutes)) {
    return { success: false, error: `Cooldown must be ${ALERT_LIMITS.cooldownMinutes.min}–${ALERT_LIMITS.cooldownMinutes.max} minutes.` };
  }

  // A repository scope must belong to this user (no cross-account rules).
  if (input.repositoryId) {
    const [owned] = await db
      .select({ id: repository.id })
      .from(repository)
      .innerJoin(githubInstallation, eq(githubInstallation.id, repository.installationId))
      .where(and(eq(repository.id, input.repositoryId), eq(githubInstallation.userId, userId)))
      .limit(1);
    if (!owned) return { success: false, error: "Repository not found." };
  }

  const [{ total }] = await db.select({ total: count() }).from(alertRule).where(eq(alertRule.userId, userId));
  if (total >= ALERT_LIMITS.maxRulesPerUser) {
    return { success: false, error: `You can have up to ${ALERT_LIMITS.maxRulesPerUser} rules.` };
  }

  await db.insert(alertRule).values({
    id: randomUUID(),
    userId,
    name,
    repositoryId: input.repositoryId,
    eventType: input.eventType,
    action,
    threshold: input.threshold,
    windowMinutes: input.windowMinutes,
    cooldownMinutes: input.cooldownMinutes,
  });

  revalidatePath("/alerts");
  return { success: true };
}

export async function toggleAlertRule(id: string, enabled: boolean): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  await db
    .update(alertRule)
    .set({ enabled })
    .where(and(eq(alertRule.id, id), eq(alertRule.userId, session.user.id)));

  revalidatePath("/alerts");
  return { success: true };
}

export async function deleteAlertRule(id: string): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  await db.delete(alertRule).where(and(eq(alertRule.id, id), eq(alertRule.userId, session.user.id)));

  revalidatePath("/alerts");
  return { success: true };
}
