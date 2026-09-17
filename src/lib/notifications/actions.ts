"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";

type ActionResult = { success: true } | { success: false; error: string };

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  await db
    .update(notification)
    .set({ read: true })
    .where(
      and(eq(notification.id, notificationId), eq(notification.userId, session.user.id))
    );

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, session.user.id), eq(notification.read, false)));

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}
