import { listActiveInvites, listMembers, type TeamAccess } from "@/lib/teams";
import type { TeamManagerInvite, TeamManagerMember } from "@/components/team/team-manager";

/** Serializable props for <TeamManager> (dates → ISO strings). */
export async function getManagerData(access: TeamAccess): Promise<{
  members: TeamManagerMember[];
  invites: TeamManagerInvite[];
}> {
  const [members, invites] = await Promise.all([listMembers(access.team.id), listActiveInvites(access.team.id)]);
  return {
    members,
    invites: invites.map((i) => ({ id: i.id, role: i.role, expiresAt: i.expiresAt.toISOString() })),
  };
}
