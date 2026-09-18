import { NextRequest, NextResponse } from "next/server";

import { getAllActiveInstallationsForFollowerSync, syncFollowersForInstallation } from "@/lib/github/follower-sync";
import { timingSafeEqualString } from "@/lib/security/crypto";

export const maxDuration = 300; // allow up to 5 minutes for larger user bases

/**
 * Vercel signs cron requests with a bearer token matching CRON_SECRET
 * (set in the Vercel dashboard's Cron Jobs settings) in the
 * Authorization header. This prevents the public internet from
 * triggering follower polling — and the API calls/writes it causes —
 * on demand.
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length);
  return timingSafeEqualString(token, cronSecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installations = await getAllActiveInstallationsForFollowerSync();

  let succeeded = 0;
  let failed = 0;
  let totalNewFollowers = 0;
  let totalUnfollowed = 0;

  // Sequential, not parallel: each installation makes GitHub API calls
  // under the same app's overall rate limit, so fanning out
  // concurrently would just contend for the same budget without
  // actually finishing faster, while making failures harder to trace.
  for (const installation of installations) {
    try {
      const result = await syncFollowersForInstallation(
        installation.id,
        installation.installationId,
        installation.userId,
        installation.githubAccountLogin
      );
      if (result) {
        succeeded += 1;
        totalNewFollowers += result.newFollowers.length;
        totalUnfollowed += result.unfollowed.length;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(
        `Follower sync failed for installation ${installation.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    ok: true,
    installationsProcessed: installations.length,
    succeeded,
    failed,
    totalNewFollowers,
    totalUnfollowed,
  });
}
