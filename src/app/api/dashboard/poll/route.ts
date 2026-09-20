import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getNewEventsCountSince } from "@/lib/dashboard/stats";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;

  if (!since || Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "Invalid or missing 'since' parameter" }, { status: 400 });
  }

  const newCount = await getNewEventsCountSince(session.user.id, since);

  return NextResponse.json({ newCount, checkedAt: new Date().toISOString() });
}
