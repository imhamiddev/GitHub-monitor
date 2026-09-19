"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/auth/session";

type ActionResult = { success: true } | { success: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  if (newPassword.length < 10) {
    return { success: false, error: "New password must be at least 10 characters." };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.message ?? "Could not change password." };
    }
    console.error("changePassword failed:", error);
    return { success: false, error: "Could not change password." };
  }

  return { success: true };
}

/**
 * Deletes the user's account. Better Auth cascades the deletion
 * through our schema's onDelete: "cascade" foreign keys (sessions,
 * accounts, githubInstallation → repositories → events), so no
 * manual cleanup is needed here. Disconnecting the GitHub App
 * installation itself (uninstalling on GitHub's side) should be done
 * by the user beforehand via Settings → GitHub; account deletion does
 * not reach out to GitHub's API.
 */
export async function deleteAccount(password: string): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: { password },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.message ?? "Could not delete account." };
    }
    console.error("deleteAccount failed:", error);
    return { success: false, error: "Could not delete account." };
  }

  return { success: true };
}
