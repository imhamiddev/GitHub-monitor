import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getAppOctokit } from "@/lib/github/app";
import { upsertInstallation } from "@/lib/github/installations";
import { verifyInstallState, type InstallReturnTarget } from "@/lib/security/install-state";

function redirectTo(
  request: NextRequest,
  target: InstallReturnTarget,
  params: Record<string, string>
) {
  const path = target === "onboarding" ? "/onboarding" : "/settings/github";
  const url = new URL(path, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const state = searchParams.get("state");

  // Without a valid state we can't know the intended return target —
  // "request" (org approval pending) and missing-param cases fall back
  // to settings, the safe default.
  if (setupAction === "request") {
    return redirectTo(request, "settings", { status: "pending_approval" });
  }

  if (!installationId || !state) {
    return redirectTo(request, "settings", { status: "missing_params" });
  }

  const stateCheck = verifyInstallState(state, session.user.id);
  if (!stateCheck.valid) {
    return redirectTo(request, "settings", { status: "invalid_state" });
  }

  const returnTo = stateCheck.returnTo ?? "settings";

  try {
    const appOctokit = getAppOctokit();
    const { data: installation } = await appOctokit.rest.apps.getInstallation({
      installation_id: Number(installationId),
    });

    const account = installation.account;
    if (!account) {
      return redirectTo(request, returnTo, { status: "installation_error" });
    }

    // GitHub's installation account can be a User or an Organization;
    // both expose "login", but the type union differs slightly.
    const accountLogin = "login" in account ? account.login : account.slug ?? "unknown";
    const accountType = "type" in account ? account.type : "Organization";

    await upsertInstallation({
      userId: session.user.id,
      installationId: installation.id,
      githubAccountId: account.id,
      githubAccountLogin: accountLogin,
      githubAccountType: accountType,
    });

    return redirectTo(request, returnTo, { status: "connected" });
  } catch (error) {
    console.error("GitHub App installation callback failed:", error);
    return redirectTo(request, returnTo, { status: "installation_error" });
  }
}
