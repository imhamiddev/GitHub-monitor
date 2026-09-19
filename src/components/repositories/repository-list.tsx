"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCheckIcon, Loader2Icon, SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import type { RepoListItem } from "@/lib/github/repo-sync";
import { bulkSetRepositoryMonitoring } from "@/lib/github/repo-actions";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RepositoryCard } from "@/components/repositories/repository-card";
import { EmptyState } from "@/components/ui/empty-state";

type MonitorFilter = "all" | "monitored" | "unmonitored";
type SortKey = "name" | "stars" | "forks";

export function RepositoryList({ repos }: { repos: RepoListItem[] }) {
  const [query, setQuery] = useState("");
  const [monitorFilter, setMonitorFilter] = useState<MonitorFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [isPending, startTransition] = useTransition();
  const runWithBar = useLoadingBarAction();

  const filtered = useMemo(() => {
    let result = repos;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }

    if (monitorFilter === "monitored") {
      result = result.filter((r) => r.isMonitored);
    } else if (monitorFilter === "unmonitored") {
      result = result.filter((r) => !r.isMonitored);
    }

    return [...result].sort((a, b) => {
      if (sortKey === "stars") return b.starsCount - a.starsCount;
      if (sortKey === "forks") return b.forksCount - a.forksCount;
      return a.name.localeCompare(b.name);
    });
  }, [repos, query, monitorFilter, sortKey]);

  const unmonitoredInView = filtered.filter((r) => !r.isMonitored);
  const monitoredInView = filtered.filter((r) => r.isMonitored);

  function handleBulkToggle(monitored: boolean) {
    const targets = monitored ? unmonitoredInView : monitoredInView;
    if (targets.length === 0) return;

    startTransition(async () => {
      const result = await runWithBar(() =>
        bulkSetRepositoryMonitoring(
          targets.map((r) => r.githubRepoId),
          monitored
        )
      );
      if (result.success) {
        toast.success(
          monitored
            ? `Now monitoring ${targets.length} ${targets.length === 1 ? "repository" : "repositories"}`
            : `Stopped monitoring ${targets.length} ${targets.length === 1 ? "repository" : "repositories"}`
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search repositories..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={monitorFilter}
          onValueChange={(value) => setMonitorFilter(value as MonitorFilter)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All repositories</SelectItem>
            <SelectItem value="monitored">Monitored only</SelectItem>
            <SelectItem value="unmonitored">Not monitored</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="stars">Stars</SelectItem>
            <SelectItem value="forks">Forks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || unmonitoredInView.length === 0}
            onClick={() => handleBulkToggle(true)}
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : <CheckCheckIcon />}
            Monitor all ({unmonitoredInView.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || monitoredInView.length === 0}
            onClick={() => handleBulkToggle(false)}
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : <XIcon />}
            Unmonitor all ({monitoredInView.length})
          </Button>
          <span className="text-muted-foreground text-xs">
            Applies to the {filtered.length} repositor
            {filtered.length === 1 ? "y" : "ies"} currently shown
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="No repositories found"
          description="Try a different search term or filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((repo) => (
            <RepositoryCard key={repo.githubRepoId} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
