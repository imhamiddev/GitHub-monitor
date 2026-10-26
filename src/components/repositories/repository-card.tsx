"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  GitForkIcon,
  Loader2Icon,
  PackageIcon,
  SettingsIcon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { RepoListItem } from "@/lib/github/repo-sync";
import { toggleRepositoryMonitoring } from "@/lib/github/repo-actions";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function RepositoryCard({
  repo,
  animateIn = false,
  style,
}: {
  repo: RepoListItem;
  /** Play the entrance animation (first paint only — see RepositoryList). */
  animateIn?: boolean;
  style?: React.CSSProperties;
}) {
  const [isPending, startTransition] = useTransition();
  const runWithBar = useLoadingBarAction();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await runWithBar(() =>
        toggleRepositoryMonitoring(repo.githubRepoId, checked)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        checked ? `Now monitoring ${repo.name}` : `Stopped monitoring ${repo.name}`
      );
    });
  }

  return (
    <Card
      style={style}
      className={cn(
        // h-full + flex column: every card in a grid row stretches to the
        // same height, and the footer (toggle + buttons) is pinned to the
        // bottom so controls line up across cards regardless of content.
        "h-full gap-4 py-4 transition-[border-color,box-shadow] duration-200 ease-out hover:border-foreground/20 hover:shadow-md",
        animateIn && "animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-300 ease-out"
      )}
    >
      <CardHeader className="gap-1 px-5">
        <div className="flex h-6 items-center gap-2">
          <PackageIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate font-medium">{repo.name}</span>
          {repo.private && (
            <Badge variant="outline" className="text-xs">
              Private
            </Badge>
          )}
        </div>
        {/* Always reserve two lines so cards with and without a
            description keep identical vertical rhythm. */}
        <p
          className={cn(
            "line-clamp-2 min-h-10 text-sm leading-5",
            repo.description ? "text-muted-foreground" : "text-muted-foreground/50 italic"
          )}
        >
          {repo.description || "No description"}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3 px-5">
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <StarIcon className="size-3.5" />
            {repo.starsCount}
          </span>
          <span className="flex items-center gap-1">
            <GitForkIcon className="size-3.5" />
            {repo.forksCount}
          </span>
        </div>

        <div className="flex h-6 items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium transition-colors duration-150">
            {isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : null}
            <span className="text-foreground">
              Monitoring: {repo.isMonitored ? "ON" : "OFF"}
            </span>
          </span>
          <Switch
            checked={repo.isMonitored}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label={`Toggle monitoring for ${repo.name}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon />
              View
            </a>
          </Button>
          {repo.id ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/repositories/${repo.id}`}>
                <SettingsIcon />
                Settings
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <SettingsIcon />
              Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
