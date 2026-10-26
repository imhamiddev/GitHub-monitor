import { NextRequest, NextResponse } from "next/server";

import { timingSafeEqualString } from "@/lib/security/crypto";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram/bot";

export const runtime = "nodejs";

/**
 * Telegram calls this endpoint for every message / button tap sent to the
 * bot. Requests are authenticated with the secret token configured via
 * setWebhook (X-Telegram-Bot-Api-Secret-Token header). All bot logic lives
 * in lib/telegram/bot.ts.
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

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error("Telegram webhook handling failed:", error);
  }

  // Always 200 so Telegram doesn't retry the same update.
  return NextResponse.json({ ok: true });
}
