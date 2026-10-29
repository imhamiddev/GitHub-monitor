import { createHash, randomBytes, randomUUID } from "crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { team, teamInvite, teamMember, user } from "@/lib/db/schema";

export type TeamRole = "owner" | "admin" | "viewer";

export const TEAM_LIMITS = {
  maxMembers: 25,
  inviteTtlMs: 7 * 24 * 60 * 60 * 1000,
  maxActiveInvites: 10,
} as const;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type TeamAccess = {
  team: typeof team.$inferSelect;
  role: TeamRole;
};

/* --------------------------------- reading --------------------------------- */

export async function getOwnedTeam(userId: string) {
  return db.query.team.findFirst({ where: eq(team.ownerUserId, userId) });
}

/**
 * The single authorization check for everything team-related: returns the
 * viewer's role in the team, or null when they have no access at all.
 */
export async function getTeamAccess(userId: string, teamId: string): Promise<TeamAccess | null> {
  const found = await db.query.team.findFirst({ where: eq(team.id, teamId) });
  if (!found) return null;
  if (found.ownerUserId === userId) return { team: found, role: "owner" };

  const membership = await db.query.teamMember.findFirst({
    where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
  });
  if (!membership) return null;
  return { team: found, role: membership.role === "admin" ? "admin" : "viewer" };
}

export type Membership = { teamId: string; teamName: string; ownerName: string; role: TeamRole };

/** Teams the user has joined (not the one they own). */
export async function listMemberships(userId: string): Promise<Membership[]> {
  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      ownerName: user.name,
      ownerEmail: user.email,
      role: teamMember.role,
    })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .innerJoin(user, eq(user.id, team.ownerUserId))
    .where(eq(teamMember.userId, userId));

  return rows.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    ownerName: r.ownerName || r.ownerEmail,
    role: r.role === "admin" ? "admin" : "viewer",
  }));
}

export type MemberListItem = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: TeamRole;
};

/** Owner first, then members by join date. */
export async function listMembers(teamId: string): Promise<MemberListItem[]> {
  const found = await db.query.team.findFirst({ where: eq(team.id, teamId) });
  if (!found) return [];

  const [owner] = await db.select().from(user).where(eq(user.id, found.ownerUserId)).limit(1);
  const members = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: teamMember.role,
    })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.teamId, teamId))
    .orderBy(teamMember.createdAt);

  return [
    ...(owner ? [{ userId: owner.id, name: owner.name, email: owner.email, image: owner.image, role: "owner" as const }] : []),
    ...members.map((m) => ({ ...m, role: (m.role === "admin" ? "admin" : "viewer") as TeamRole })),
  ];
}

export type ActiveInvite = { id: string; role: TeamRole; expiresAt: Date; createdAt: Date };

export async function listActiveInvites(teamId: string): Promise<ActiveInvite[]> {
  const rows = await db
    .select({ id: teamInvite.id, role: teamInvite.role, expiresAt: teamInvite.expiresAt, createdAt: teamInvite.createdAt })
    .from(teamInvite)
    .where(and(eq(teamInvite.teamId, teamId), isNull(teamInvite.usedAt), gt(teamInvite.expiresAt, new Date())))
    .orderBy(teamInvite.createdAt);
  return rows.map((r) => ({ ...r, role: r.role === "admin" ? "admin" : "viewer" }));
}

/* --------------------------------- writing --------------------------------- */

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function createTeam(ownerUserId: string, name: string): Promise<Result<{ teamId: string }>> {
  if (await getOwnedTeam(ownerUserId)) return { ok: false, error: "You already own a team." };

  const teamId = randomUUID();
  await db.insert(team).values({ id: teamId, ownerUserId, name });
  return { ok: true, teamId };
}

export async function renameTeam(teamId: string, name: string) {
  await db.update(team).set({ name }).where(eq(team.id, teamId));
}

export async function deleteTeam(teamId: string) {
  await db.delete(team).where(eq(team.id, teamId));
}

/** Creates a single-use invite link token (the raw token is returned once). */
export async function createInvite(
  teamId: string,
  createdByUserId: string,
  role: "admin" | "viewer"
): Promise<Result<{ token: string; expiresAt: Date }>> {
  const [{ members }] = await db.select({ members: count() }).from(teamMember).where(eq(teamMember.teamId, teamId));
  if (members + 1 >= TEAM_LIMITS.maxMembers) return { ok: false, error: "The team is full." };

  const [{ active }] = await db
    .select({ active: count() })
    .from(teamInvite)
    .where(and(eq(teamInvite.teamId, teamId), isNull(teamInvite.usedAt), gt(teamInvite.expiresAt, new Date())));
  if (active >= TEAM_LIMITS.maxActiveInvites) {
    return { ok: false, error: "Too many pending invites. Revoke one first." };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TEAM_LIMITS.inviteTtlMs);
  await db.insert(teamInvite).values({
    id: randomUUID(),
    teamId,
    tokenHash: hashToken(token),
    role,
    createdByUserId,
    expiresAt,
  });
  return { ok: true, token, expiresAt };
}

export async function revokeInvite(teamId: string, inviteId: string) {
  await db.delete(teamInvite).where(and(eq(teamInvite.id, inviteId), eq(teamInvite.teamId, teamId)));
}

/** Looks an invite up without consuming it (for the join confirmation page). */
export async function previewInvite(token: string) {
  const invite = await db.query.teamInvite.findFirst({
    where: and(eq(teamInvite.tokenHash, hashToken(token)), isNull(teamInvite.usedAt), gt(teamInvite.expiresAt, new Date())),
  });
  if (!invite) return null;

  const [row] = await db
    .select({ teamId: team.id, teamName: team.name, ownerName: user.name, ownerEmail: user.email })
    .from(team)
    .innerJoin(user, eq(user.id, team.ownerUserId))
    .where(eq(team.id, invite.teamId))
    .limit(1);
  if (!row) return null;

  return {
    teamId: row.teamId,
    teamName: row.teamName,
    ownerName: row.ownerName || row.ownerEmail,
    role: (invite.role === "admin" ? "admin" : "viewer") as TeamRole,
  };
}

/**
 * Consumes an invite. The invite row is claimed with a conditional UPDATE so
 * the same link can never be redeemed twice, even by concurrent requests.
 */
export async function acceptInvite(userId: string, token: string): Promise<Result<{ teamId: string }>> {
  const invite = await db.query.teamInvite.findFirst({
    where: and(eq(teamInvite.tokenHash, hashToken(token)), isNull(teamInvite.usedAt), gt(teamInvite.expiresAt, new Date())),
  });
  if (!invite) return { ok: false, error: "This invite is invalid or has expired." };

  const access = await getTeamAccess(userId, invite.teamId);
  if (access) return { ok: false, error: "You are already part of this team." };

  const [{ members }] = await db.select({ members: count() }).from(teamMember).where(eq(teamMember.teamId, invite.teamId));
  if (members + 1 >= TEAM_LIMITS.maxMembers) return { ok: false, error: "The team is full." };

  const claimed = await db
    .update(teamInvite)
    .set({ usedAt: new Date(), usedByUserId: userId })
    .where(and(eq(teamInvite.id, invite.id), isNull(teamInvite.usedAt)))
    .returning({ id: teamInvite.id });
  if (claimed.length === 0) return { ok: false, error: "This invite was just used." };

  await db.insert(teamMember).values({ id: randomUUID(), teamId: invite.teamId, userId, role: invite.role });
  return { ok: true, teamId: invite.teamId };
}

export async function removeMember(teamId: string, memberUserId: string) {
  await db.delete(teamMember).where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, memberUserId)));
}

export async function setMemberRole(teamId: string, memberUserId: string, role: "admin" | "viewer") {
  await db
    .update(teamMember)
    .set({ role })
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, memberUserId)));
}
