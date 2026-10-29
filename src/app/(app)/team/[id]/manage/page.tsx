import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getTeamAccess } from "@/lib/teams";
import { getManagerData } from "@/lib/teams/view";
import { TeamManager } from "@/components/team/team-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Manage team — GitHub Monitor",
};

/** Owners and admins manage members here; viewers get a 404. */
export default async function ManageTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return null;

  const access = await getTeamAccess(session.user.id, id);
  if (!access || access.role === "viewer") notFound();

  const manager = await getManagerData(access);

  return (
    <div className="flex max-w-3xl flex-1 flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/team">
            <ArrowLeftIcon />
            Back to team
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Manage {access.team.name}</h1>
      </div>
      <TeamManager
        teamId={access.team.id}
        teamName={access.team.name}
        viewerId={session.user.id}
        viewerRole={access.role}
        members={manager.members}
        invites={manager.invites}
      />
    </div>
  );
}
