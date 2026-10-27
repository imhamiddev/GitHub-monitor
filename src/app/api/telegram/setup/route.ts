import { NextRequest, NextResponse } from "next/server";

import { setTelegramCommands, setTelegramWebhook } from "@/lib/telegram/api";
import { timingSafeEqualString } from "@/lib/security/crypto";

/**
 * One-time (idempotent) registration of the bot webhook. Call after each
 * deploy to a new domain:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/telegram/setup
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!cronSecret || !auth?.startsWith("Bearer ") || !timingSafeEqualString(auth.slice(7), cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!appUrl || !secret || !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL, TELEGRAM_WEBHOOK_SECRET and TELEGRAM_BOT_TOKEN must be set" },
      { status: 500 }
    );
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const { data } = await setTelegramWebhook(webhookUrl, secret);
  const { data: commands } = await setTelegramCommands([
    { command: "start", description: "Main menu" },
    { command: "profile", description: "Your account & overview" },
    { command: "stats", description: "Event statistics" },
    { command: "activity", description: "Latest events" },
    { command: "repos", description: "Monitored repositories" },
    { command: "top", description: "Weekly leaderboard" },
    { command: "language", description: "Language / زبان" },
    { command: "notifications", description: "Pause / resume alerts" },
    { command: "connect", description: "Connect GitHub" },
    { command: "help", description: "Help & commands" },
    { command: "stop", description: "Disconnect this chat" },
  ]);
  return NextResponse.json({ webhookUrl, telegram: data, commands });
}
