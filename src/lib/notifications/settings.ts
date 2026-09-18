"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";

type ActionResult = { success: true } | { success: false; error: string };

export async function getNotificationsEnabled(userId: string): Promise<boolean> {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return settings?.notificationsEnabled ?? true; // default: on
}

export async function setGlobalNotificationsEnabled(
  enabled: boolean
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  await db
    .insert(userSettings)
    .values({ userId: session.user.id, notificationsEnabled: enabled })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { notificationsEnabled: enabled, updatedAt: new Date() },
    });

  revalidatePath("/settings/notifications");
  return { success: true };
}
