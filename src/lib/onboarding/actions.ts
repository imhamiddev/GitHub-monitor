"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { userOnboarding } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const row = await db.query.userOnboarding.findFirst({
    where: eq(userOnboarding.userId, userId),
  });
  return !!row;
}

export async function completeOnboarding(): Promise<{ success: boolean }> {
  const session = await getServerSession();
  if (!session) return { success: false };

  await db
    .insert(userOnboarding)
    .values({ userId: session.user.id })
    .onConflictDoNothing();

  return { success: true };
}
