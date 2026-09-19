"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2Icon, ExternalLinkIcon, GitBranch, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { disconnectGithub } from "@/lib/github/actions";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type ConnectionState =
  | { connected: false }
  | { connected: true; accountLogin: string; accountType: string };

export function GithubConnectionCard({ connection }: { connection: ConnectionState }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const runWithBar = useLoadingBarAction();

  function handleDisconnect() {
    startTransition(async () => {
      const result = await runWithBar(() => disconnectGithub());
      if (result.success) {
        toast.success("GitHub account disconnected.");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!connection.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="size-5" />
            GitHub
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to start monitoring your repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/api/github/connect">
              <GitBranch />
              Connect GitHub
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="size-5" />
          GitHub
        </CardTitle>
        <CardDescription>Your GitHub App connection.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <CheckCircle2Icon className="size-3.5" />
            Connected
          </Badge>
          <span className="text-sm font-medium">@{connection.accountLogin}</span>
          <span className="text-muted-foreground text-xs">
            ({connection.accountType})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a
              href={`https://github.com/${connection.accountLogin}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon />
              View GitHub Profile
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`https://github.com/settings/installations`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage Connection
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/repositories">Choose repositories</Link>
          </Button>
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Disconnect</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes GitHub Monitor&apos;s access to your repositories
                  and stops all monitoring and notifications. You can reconnect
                  at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    handleDisconnect();
                  }}
                  disabled={isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isPending && <Loader2Icon className="animate-spin" />}
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
