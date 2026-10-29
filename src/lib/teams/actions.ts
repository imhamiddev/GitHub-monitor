"use server";

import { revalidatePath } from "next/cache";

import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { teamMember } from "@/lib/db/schema";
import {
  acceptInvite,
  createInvite,
  createTeam,
  deleteTeam,
  getTeamAccess,
  removeMember,
  renameTeam,
  revokeInvite,
  setMemberRole,
  type TeamAccess,
} from "@/lib/teams";
import { and, eq } from "drizzle-orm";

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

const NOT_ALLOWED = { success: false, error: "You don't have permission to do that." } as const;

function cleanName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 60 ? trimmed : null;
}

async function requireUser(): Promise<string | null> {
  return (await getServerSession())?.user.id ?? null;
}

async function requireAccess(teamId: string): Promise<{ userId: string; access: TeamAccess } | null> {
  const userId = await requireUser();
  if (!userId) return null;
  const access = await getTeamAccess(userId, teamId);
  return access ? { userId, access } : null;
}

function revalidate(teamId?: string) {
  revalidatePath("/team");
  if (teamId) revalidatePath(`/team/${teamId}`);
}

export async function createTeamAction(name: string): Promise<ActionResult<{ teamId: string }>> {
  const userId = await requireUser();
  if (!userId) return { success: false, error: "Not authenticated." };

  const clean = cleanName(name);
  if (!clean) return { success: false, error: "Team name must be 1–60 characters." };

  const result = await createTeam(userId, clean);
  if (!result.ok) return { success: false, error: result.error };
  revalidate();
  return { success: true, teamId: result.teamId };
}

export async function renameTeamAction(teamId: string, name: string): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role !== "owner") return NOT_ALLOWED;

  const clean = cleanName(name);
  if (!clean) return { success: false, error: "Team name must be 1–60 characters." };

  await renameTeam(teamId, clean);
  revalidate(teamId);
  return { success: true };
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role !== "owner") return NOT_ALLOWED;

  await deleteTeam(teamId);
  revalidate(teamId);
  return { success: true };
}

/** Owners and admins can invite; admins can only invite viewers. */
export async function createInviteAction(
  teamId: string,
  role: "admin" | "viewer"
): Promise<ActionResult<{ link: string; expiresAt: string }>> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role === "viewer") return NOT_ALLOWED;
  if (role === "admin" && ctx.access.role !== "owner") return NOT_ALLOWED;

  const result = await createInvite(teamId, ctx.userId, role);
  if (!result.ok) return { success: false, error: result.error };

  const site = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  revalidate(teamId);
  return { success: true, link: `${site}/team/join/${result.token}`, expiresAt: result.expiresAt.toISOString() };
}

export async function revokeInviteAction(teamId: string, inviteId: string): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role === "viewer") return NOT_ALLOWED;

  await revokeInvite(teamId, inviteId);
  revalidate(teamId);
  return { success: true };
}

/** Owner removes anyone; admins only remove viewers; nobody removes the owner. */
export async function removeMemberAction(teamId: string, memberUserId: string): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role === "viewer") return NOT_ALLOWED;
  if (memberUserId === ctx.access.team.ownerUserId) return NOT_ALLOWED;

  if (ctx.access.role === "admin") {
    const target = await db.query.teamMember.findFirst({
      where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, memberUserId)),
    });
    if (!target || target.role !== "viewer") return NOT_ALLOWED;
  }

  await removeMember(teamId, memberUserId);
  revalidate(teamId);
  return { success: true };
}

export async function changeMemberRoleAction(
  teamId: string,
  memberUserId: string,
  role: "admin" | "viewer"
): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role !== "owner") return NOT_ALLOWED;
  if (memberUserId === ctx.userId) return NOT_ALLOWED;

  await setMemberRole(teamId, memberUserId, role);
  revalidate(teamId);
  return { success: true };
}

/** Members (not the owner) can leave on their own. */
export async function leaveTeamAction(teamId: string): Promise<ActionResult> {
  const ctx = await requireAccess(teamId);
  if (!ctx || ctx.access.role === "owner") return NOT_ALLOWED;

  await removeMember(teamId, ctx.userId);
  revalidate(teamId);
  return { success: true };
}

export async function acceptInviteAction(token: string): Promise<ActionResult<{ teamId: string }>> {
  const userId = await requireUser();
  if (!userId) return { success: false, error: "Please sign in to join." };

  const result = await acceptInvite(userId, token);
  if (!result.ok) return { success: false, error: result.error };
  revalidate(result.teamId);
  return { success: true, teamId: result.teamId };
}
