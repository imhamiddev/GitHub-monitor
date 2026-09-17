import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getAppInstallUrl } from "@/lib/github/app";
import { createInstallState } from "@/lib/security/install-state";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  const state = createInstallState(session.user.id);
  const installUrl = getAppInstallUrl(state);

  return NextResponse.redirect(installUrl);
}
