"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { repository, repositoryEventSetting } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { setRepositoryMonitored } from "@/lib/github/repo-sync";
import type { EventCategory } from "@/lib/github/events";
import { EVENT_CATEGORIES } from "@/lib/github/events";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

type ActionResult = { success: true } | { success: false; error: string };

export async function toggleRepositoryMonitoring(
  githubRepoId: number,
  monitored: boolean
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  const installation = await getInstallationForUser(session.user.id);
  if (!installation) return { success: false, error: "GitHub is not connected." };

  try {
    await setRepositoryMonitored({
      installationDbId: installation.id,
      installationId: installation.installationId,
      githubRepoId,
      monitored,
    });
  } catch (error) {
    console.error("Failed to toggle repository monitoring:", error);
    return { success: false, error: "Could not update monitoring status." };
  }

  revalidatePath("/repositories");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEventCategorySetting(
  repositoryId: string,
  category: EventCategory,
  enabled: boolean
): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, error: "Not authenticated." };

  if (!EVENT_CATEGORIES.includes(category)) {
    return { success: false, error: "Unknown event category." };
  }

  // Ownership check: the repository must belong to an installation
  // owned by the current user before we let them change its settings.
  const installation = await getInstallationForUser(session.user.id);
  if (!installation) return { success: false, error: "GitHub is not connected." };

  const repo = await db.query.repository.findFirst({
    where: and(eq(repository.id, repositoryId), eq(repository.installationId, installation.id)),
  });
  if (!repo) {
    return { success: false, error: "Repository not found." };
  }

  const existing = await db.query.repositoryEventSetting.findFirst({
    where: and(
      eq(repositoryEventSetting.repositoryId, repositoryId),
      eq(repositoryEventSetting.eventType, category)
    ),
  });

  if (existing) {
    await db
      .update(repositoryEventSetting)
      .set({ enabled })
      .where(eq(repositoryEventSetting.id, existing.id));
  } else {
    await db.insert(repositoryEventSetting).values({
      id: randomUUID(),
      repositoryId,
      eventType: category,
      enabled,
    });
  }

  revalidatePath(`/repositories/${repositoryId}`);
  return { success: true };
}
