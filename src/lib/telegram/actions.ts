"use server";

import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { telegramConnection } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { buildBotLink, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/api";
import { createLinkToken, getTelegramConnection, unlinkByUserId } from "@/lib/telegram/connection";

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user.id ?? null;
}

export async function generateTelegramLink(): Promise<
  ActionResult<{ link: string; qrDataUrl: string; expiresAt: string }>
> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  if (!isTelegramConfigured()) {
    return { success: false, error: "Telegram bot is not configured on this server." };
  }

  const { token, expiresAt } = await createLinkToken(userId);
  const link = buildBotLink(token);
  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return { success: true, link, qrDataUrl, expiresAt: expiresAt.toISOString() };
}

export async function disconnectTelegram(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const connection = await getTelegramConnection(userId);
  if (connection?.chatId) {
    await sendTelegramMessage(
      connection.chatId,
      "🔌 This chat was disconnected from GitHub Monitor. You will no longer receive notifications."
    );
  }
  await unlinkByUserId(userId);

  revalidatePath("/settings/telegram");
  return { success: true };
}

export async function setTelegramNotifications(enabled: boolean): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  await db
    .update(telegramConnection)
    .set({ notificationsEnabled: enabled, updatedAt: new Date() })
    .where(eq(telegramConnection.userId, userId));

  revalidatePath("/settings/telegram");
  return { success: true };
}

export async function sendTelegramTestMessage(): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  const connection = await getTelegramConnection(userId);
  if (!connection?.chatId) return { success: false, error: "Telegram is not connected." };

  const result = await sendTelegramMessage(
    connection.chatId,
    "✅ <b>Test notification</b>\nGitHub Monitor can reach you here."
  );
  return result.ok ? { success: true } : { success: false, error: "Could not deliver the message." };
}

/** Lightweight status read used by the settings card to detect a completed link. */
export async function getTelegramStatus(): Promise<{ connected: boolean }> {
  const userId = await requireUserId();
  if (!userId) return { connected: false };
  const connection = await getTelegramConnection(userId);
  return { connected: Boolean(connection?.chatId) };
}
