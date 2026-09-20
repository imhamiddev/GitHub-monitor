import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getAppInstallUrl } from "@/lib/github/app";
import { createInstallState, type InstallReturnTarget } from "@/lib/security/install-state";

const VALID_RETURN_TARGETS: InstallReturnTarget[] = ["settings", "onboarding"];

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  const requestedReturn = request.nextUrl.searchParams.get("returnTo");
  const returnTo: InstallReturnTarget = VALID_RETURN_TARGETS.includes(
    requestedReturn as InstallReturnTarget
  )
    ? (requestedReturn as InstallReturnTarget)
    : "settings";

  const state = createInstallState(session.user.id, returnTo);
  const installUrl = getAppInstallUrl(state);

  return NextResponse.redirect(installUrl);
}
