"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import { leaveTeamAction } from "@/lib/teams/actions";
import type { Membership } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function JoinedTeamsCard({ memberships }: { memberships: Membership[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function leave(teamId: string) {
    startTransition(async () => {
      const result = await leaveTeamAction(teamId);
      if (result.success) toast.success("You left the team.");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teams you&apos;ve joined</CardTitle>
        <CardDescription>Dashboards other people have shared with you.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {memberships.map((m) => (
          <div key={m.teamId} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{m.teamName}</p>
              <p className="text-muted-foreground truncate text-xs">Shared by {m.ownerName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {m.role}
              </Badge>
              <Button size="sm" asChild>
                <Link href={`/team/${m.teamId}`}>Open</Link>
              </Button>
              {m.role === "admin" && (
                <Button variant="outline" size="icon" asChild aria-label="Manage team">
                  <Link href={`/team/${m.teamId}/manage`}>
                    <SettingsIcon />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" disabled={isPending} aria-label="Leave team" onClick={() => leave(m.teamId)}>
                <LogOutIcon />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
