"use server";

import { revalidatePath } from "next/cache";

import { getServerSession } from "@/lib/auth/session";
import { getAppOctokit } from "@/lib/github/app";
import { deleteInstallation, getInstallationForUser } from "@/lib/github/installations";

export type DisconnectResult = { success: true } | { success: false; error: string };

export async function disconnectGithub(): Promise<DisconnectResult> {
  const session = await getServerSession();
  if (!session) {
    return { success: false, error: "Not authenticated." };
  }

  const installation = await getInstallationForUser(session.user.id);
  if (!installation) {
    return { success: false, error: "No GitHub connection found." };
  }

  // Best-effort: also uninstall the app on GitHub's side so the user
  // doesn't end up with a "ghost" installation they can't see in our
  // UI anymore. If this fails (e.g. already uninstalled on GitHub),
  // we still proceed to remove our local record.
  try {
    const appOctokit = getAppOctokit();
    await appOctokit.rest.apps.deleteInstallation({
      installation_id: installation.installationId,
    });
  } catch (error) {
    console.error("Failed to uninstall GitHub App on GitHub's side:", error);
  }

  await deleteInstallation(installation.id, session.user.id);

  revalidatePath("/settings/github");
  return { success: true };
}
