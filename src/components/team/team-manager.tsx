"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyIcon, ExternalLinkIcon, Loader2Icon, LinkIcon, Trash2Icon, UserMinusIcon } from "lucide-react";
import { toast } from "sonner";

import {
  changeMemberRoleAction,
  createInviteAction,
  deleteTeamAction,
  removeMemberAction,
  renameTeamAction,
  revokeInviteAction,
} from "@/lib/teams/actions";
import type { TeamRole } from "@/lib/teams";
import { formatRelativeTime } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TeamManagerMember = { userId: string; name: string; email: string; image: string | null; role: TeamRole };
export type TeamManagerInvite = { id: string; role: TeamRole; expiresAt: string };

type Props = {
  teamId: string;
  teamName: string;
  viewerId: string;
  viewerRole: TeamRole;
  members: TeamManagerMember[];
  invites: TeamManagerInvite[];
};

export function TeamManager({ teamId, teamName, viewerId, viewerRole, members, invites }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(teamName);
  const [inviteRole, setInviteRole] = useState<"viewer" | "admin">("viewer");
  const [freshLink, setFreshLink] = useState<string | null>(null);

  const isOwner = viewerRole === "owner";

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok?: string, after?: () => void) {
    startTransition(async () => {
      const result = await task();
      if (!result.success) toast.error(result.error ?? "Something went wrong.");
      else {
        if (ok) toast.success(ok);
        after?.();
      }
      router.refresh();
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  function createInvite() {
    startTransition(async () => {
      const result = await createInviteAction(teamId, inviteRole);
      if (result.success) {
        setFreshLink(result.link);
        toast.success("Invite link created.");
      } else {
        toast.error(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{teamName}</CardTitle>
          <CardDescription>Everyone here sees your dashboard, statistics and activity — read-only.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href={`/team/${teamId}`}>
              <ExternalLinkIcon />
              Open team dashboard
            </Link>
          </Button>
          {isOwner && (
            <>
              <Input
                value={name}
                maxLength={60}
                aria-label="Team name"
                className="max-w-56"
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={isPending || name.trim() === teamName || name.trim().length === 0}
                onClick={() => run(() => renameTeamAction(teamId, name), "Team renamed.")}
              >
                Rename
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => {
            const isSelf = m.userId === viewerId;
            const canRemove =
              m.role !== "owner" && !isSelf && (isOwner || (viewerRole === "admin" && m.role === "viewer"));
            return (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8">
                    {m.image && <AvatarImage src={m.image} alt={m.name} />}
                    <AvatarFallback>{(m.name || m.email)[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.name || m.email} {isSelf && <span className="text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{m.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isOwner && m.role !== "owner" ? (
                    <Select
                      value={m.role}
                      disabled={isPending}
                      onValueChange={(role) =>
                        run(() => changeMemberRoleAction(teamId, m.userId, role as "admin" | "viewer"), "Role updated.")
                      }
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">
                      {m.role}
                    </Badge>
                  )}
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      aria-label={`Remove ${m.name || m.email}`}
                      onClick={() => run(() => removeMemberAction(teamId, m.userId), "Member removed.")}
                    >
                      <UserMinusIcon />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite people</CardTitle>
          <CardDescription>Links work once and expire after 7 days. Share them privately.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "viewer" | "admin")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">As viewer</SelectItem>
                  <SelectItem value="admin">As admin</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button onClick={createInvite} disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : <LinkIcon />}
              Create invite link
            </Button>
          </div>

          {freshLink && (
            <div className="bg-muted/40 flex items-center gap-2 rounded-md p-2">
              <code className="min-w-0 flex-1 truncate text-xs">{freshLink}</code>
              <Button variant="outline" size="icon" aria-label="Copy invite link" onClick={() => copy(freshLink)}>
                <CopyIcon />
              </Button>
            </div>
          )}

          {invites.length > 0 && (
            <div className="divide-y">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Pending <span className="capitalize">{invite.role}</span> invite · expires{" "}
                    {formatRelativeTime(new Date(invite.expiresAt))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => run(() => revokeInviteAction(teamId, invite.id), "Invite revoked.")}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
            <CardDescription>Deleting the team removes every member&apos;s access immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2Icon />
                  Delete team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All members and pending invites will be removed. Your own data is not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => run(() => deleteTeamAction(teamId), "Team deleted.")}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
