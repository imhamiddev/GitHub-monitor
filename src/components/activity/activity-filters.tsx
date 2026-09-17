"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { EVENT_CATEGORY_LABELS } from "@/lib/github/events";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RepoOption = { id: string; name: string };

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "push", label: EVENT_CATEGORY_LABELS.push },
  { value: "star", label: EVENT_CATEGORY_LABELS.star },
  { value: "fork", label: EVENT_CATEGORY_LABELS.fork },
  { value: "pull_request", label: "Pull Requests" },
  { value: "issues", label: "Issues" },
  { value: "issue_comment", label: EVENT_CATEGORY_LABELS.issue_comment },
  { value: "release", label: EVENT_CATEGORY_LABELS.release },
  { value: "workflow_run", label: EVENT_CATEGORY_LABELS.workflow_run },
  { value: "deployment", label: EVENT_CATEGORY_LABELS.deployment },
];

export function ActivityFilters({ repositories }: { repositories: RepoOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page"); // any filter change resets pagination
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam("q", value);
  }, 400);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Select
        defaultValue={searchParams.get("repo") ?? "all"}
        onValueChange={(value) => setParam("repo", value)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Repository" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All repositories</SelectItem>
          {repositories.map((repo) => (
            <SelectItem key={repo.id} value={repo.id}>
              {repo.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("type") ?? "all"}
        onValueChange={(value) => setParam("type", value)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All event types</SelectItem>
          {EVENT_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("range") ?? "all"}
        onValueChange={(value) => setParam("range", value)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1 sm:min-w-48">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(event) => debouncedSetSearch(event.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
