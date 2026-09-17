import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import { getAppOctokit } from "@/lib/github/app";
import { upsertInstallation } from "@/lib/github/installations";
import { verifyInstallState } from "@/lib/security/install-state";

function redirectToSettings(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/settings/github", request.url);
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

  // "request" happens when a GitHub org requires owner approval for app
  // installs — there's no installation_id yet, so just inform the user.
  if (setupAction === "request") {
    return redirectToSettings(request, { status: "pending_approval" });
  }

  if (!installationId || !state) {
    return redirectToSettings(request, { status: "missing_params" });
  }

  const stateCheck = verifyInstallState(state, session.user.id);
  if (!stateCheck.valid) {
    return redirectToSettings(request, { status: "invalid_state" });
  }

  try {
    const appOctokit = getAppOctokit();
    const { data: installation } = await appOctokit.rest.apps.getInstallation({
      installation_id: Number(installationId),
    });

    const account = installation.account;
    if (!account) {
      return redirectToSettings(request, { status: "installation_error" });
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

    return redirectToSettings(request, { status: "connected" });
  } catch (error) {
    console.error("GitHub App installation callback failed:", error);
    return redirectToSettings(request, { status: "installation_error" });
  }
}
