import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth/session";
import { getOwnedTeam, getTeamAccess, listMemberships } from "@/lib/teams";
import { getManagerData } from "@/lib/teams/view";
import { CreateTeamCard } from "@/components/team/create-team-card";
import { JoinedTeamsCard } from "@/components/team/joined-teams-card";
import { TeamManager } from "@/components/team/team-manager";

export const metadata: Metadata = {
  title: "Team — GitHub Monitor",
};

export default async function TeamPage() {
  const session = await getServerSession();
  if (!session) return null;
  const userId = session.user.id;

  const [owned, memberships] = await Promise.all([getOwnedTeam(userId), listMemberships(userId)]);
  const access = owned ? await getTeamAccess(userId, owned.id) : null;
  const manager = access ? await getManagerData(access) : null;

  return (
    <div className="flex max-w-3xl flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground text-sm">Share a read-only view of your dashboard, or open ones shared with you.</p>
      </div>

      {access && manager ? (
        <TeamManager
          teamId={access.team.id}
          teamName={access.team.name}
          viewerId={userId}
          viewerRole={access.role}
          members={manager.members}
          invites={manager.invites}
        />
      ) : (
        <CreateTeamCard />
      )}

      {memberships.length > 0 && <JoinedTeamsCard memberships={memberships} />}
    </div>
  );
}
