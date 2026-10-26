import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram/api";
import { completeLink, unlinkByChatId } from "@/lib/telegram/connection";
import { escapeHtml } from "@/lib/telegram/format";
import { timingSafeEqualString } from "@/lib/security/crypto";

export const runtime = "nodejs";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number; type: string };
    from?: { username?: string; first_name?: string };
  };
};

const HELP_TEXT =
  "👋 <b>GitHub Monitor bot</b>\n\n" +
  "To receive live notifications, open <b>Settings → Telegram</b> on the website " +
  "and use the QR code or the “Open in Telegram” button.\n\n" +
  "Commands:\n/status — connection status\n/stop — disconnect this chat";

/**
 * Telegram calls this endpoint for every message sent to the bot.
 * Requests are authenticated with the secret token configured via
 * setWebhook (X-Telegram-Bot-Api-Secret-Token header).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const provided = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!timingSafeEqualString(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message;
  // Only private chats can be linked; ignore groups/channels silently.
  if (!message?.text || message.chat.type !== "private") {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const [command, arg] = message.text.trim().split(/\s+/, 2);
  const cmd = command.split("@")[0].toLowerCase();

  try {
    if (cmd === "/start" && arg) {
      const result = await completeLink(arg, {
        chatId,
        username: message.from?.username ?? null,
        firstName: message.from?.first_name ?? null,
      });

      if (result.ok) {
        const name = message.from?.first_name ? ` ${escapeHtml(message.from.first_name)}` : "";
        await sendTelegramMessage(
          chatId,
          `✅ <b>Connected!</b>\nHi${name}, this chat is now linked to your GitHub Monitor account. ` +
            "You'll get a message here the moment something happens in your monitored repositories."
        );
      } else if (result.reason === "chat_in_use") {
        await sendTelegramMessage(
          chatId,
          "⚠️ This Telegram account is already linked to another GitHub Monitor user. Send /stop first, then try again."
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "❌ This link is invalid or has expired. Please generate a new one from <b>Settings → Telegram</b>."
        );
      }
    } else if (cmd === "/stop") {
      const removed = await unlinkByChatId(chatId);
      await sendTelegramMessage(
        chatId,
        removed ? "🔌 Disconnected. You will no longer receive notifications." : "This chat isn't connected."
      );
    } else if (cmd === "/status") {
      const row = await db.query.telegramConnection.findFirst({
        where: (t, { eq }) => eq(t.chatId, chatId),
      });
      await sendTelegramMessage(
        chatId,
        row
          ? `✅ Connected. Notifications are <b>${row.notificationsEnabled ? "ON" : "OFF"}</b>.`
          : "This chat isn't connected yet."
      );
    } else {
      await sendTelegramMessage(chatId, HELP_TEXT);
    }
  } catch (error) {
    console.error("Telegram webhook handling failed:", error);
  }

  // Always 200 so Telegram doesn't retry the same update.
  return NextResponse.json({ ok: true });
}
