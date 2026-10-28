import { NextRequest, NextResponse } from "next/server";

import { runRetention } from "@/lib/db/retention";
import { timingSafeEqualString } from "@/lib/security/crypto";

export const maxDuration = 60;

/** Daily housekeeping. Authenticated with CRON_SECRET like the other crons. */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!cronSecret || !auth?.startsWith("Bearer ") || !timingSafeEqualString(auth.slice(7), cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRetention();
  return NextResponse.json({ ok: true, ...result });
}
