import type { Metadata } from "next";
import {
  GitBranchIcon,
  GitForkIcon,
  GitPullRequestIcon,
  CircleDotIcon,
  RocketIcon,
  StarIcon,
} from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { getStatistics } from "@/lib/statistics/counts";
import { subDays } from "@/lib/activity/group-by-day";
import { StatisticsRangePicker } from "@/components/statistics/statistics-range-picker";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Statistics — GitHub Monitor",
};

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function resolveRange(
  preset: string,
  fromParam?: string,
  toParam?: string
): { from: Date; to?: Date } {
  if (preset === "custom" && fromParam) {
    const from = new Date(`${fromParam}T00:00:00.000Z`);
    const to = toParam ? new Date(`${toParam}T23:59:59.999Z`) : undefined;
    return { from, to };
  }
  if (preset === "7d") return { from: subDays(new Date(), 7) };
  if (preset === "30d") return { from: subDays(new Date(), 30) };
  return { from: startOfTodayUtc() }; // "today" default
}

export default async function StatisticsPage({
  searchParams,
}: PageProps<"/statistics">) {
  const session = await getServerSession();
  if (!session) return null;

  const installation = await getInstallationForUser(session.user.id);

  if (!installation) {
    return (
      <EmptyState
        icon={StarIcon}
        title="Connect your GitHub account"
        description="Connect GitHub Monitor to your GitHub account to see statistics for your repositories."
        actionLabel="Connect GitHub"
        actionHref="/settings/github"
      />
    );
  }

  const params = await searchParams;
  const preset = typeof params.range === "string" ? params.range : "today";
  const fromParam = typeof params.from === "string" ? params.from : undefined;
  const toParam = typeof params.to === "string" ? params.to : undefined;

  const { from, to } = resolveRange(preset, fromParam, toParam);
  const stats = await getStatistics(session.user.id, from, to);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground text-sm">
          Event totals across your monitored repositories.
        </p>
      </div>

      <StatisticsRangePicker
        activePreset={preset}
        customFrom={fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : undefined}
        customTo={toParam ? new Date(`${toParam}T00:00:00.000Z`) : undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Commits" value={stats.commits} icon={GitBranchIcon} />
        <StatCard label="Stars" value={stats.stars} icon={StarIcon} />
        <StatCard label="Forks" value={stats.forks} icon={GitForkIcon} />
        <StatCard
          label="Pull Requests"
          value={stats.pullRequests}
          icon={GitPullRequestIcon}
        />
        <StatCard label="Issues" value={stats.issues} icon={CircleDotIcon} />
        <StatCard label="Releases" value={stats.releases} icon={RocketIcon} />
      </div>
    </div>
  );
}
