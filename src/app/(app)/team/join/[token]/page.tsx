import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon, UsersIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { previewInvite } from "@/lib/teams";
import { JoinTeamButton } from "@/components/team/join-team-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Join a team — GitHub Monitor",
  robots: { index: false },
};

export default async function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession();
  if (!session) return null; // the proxy sends signed-out visitors to /login first

  const invite = await previewInvite(token);
  if (!invite) {
    return (
      <EmptyState
        icon={LinkIcon}
        title="This invite isn't valid"
        description="The link may have expired or already been used. Ask the team owner for a new one."
        actionLabel="Go to dashboard"
        actionHref="/dashboard"
      />
    );
  }

  return (
    <div className="flex max-w-lg flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Join {invite.teamName}
          </CardTitle>
          <CardDescription>
            {invite.ownerName} invited you to view their GitHub Monitor dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            You&apos;ll join as <Badge variant="secondary" className="capitalize">{invite.role}</Badge> and get a
            read-only view of their repositories, statistics and activity. You won&apos;t be able to change anything.
          </p>
          <div className="flex items-center gap-2">
            <JoinTeamButton token={token} />
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Not now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
