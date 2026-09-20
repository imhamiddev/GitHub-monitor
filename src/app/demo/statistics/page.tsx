import type { Metadata } from "next";
import {
  CircleDotIcon,
  GitBranchIcon,
  GitForkIcon,
  GitPullRequestIcon,
  RocketIcon,
  StarIcon,
} from "lucide-react";

import { DEMO_DAILY_COUNTS, DEMO_STATISTICS_COUNTS } from "@/lib/demo/data";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityTrendChart } from "@/components/statistics/activity-trend-chart";
import { EventBreakdownChart } from "@/components/statistics/event-breakdown-chart";

export const metadata: Metadata = { title: "Statistics — Demo" };

export default function DemoStatisticsPage() {
  const stats = DEMO_STATISTICS_COUNTS;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground text-sm">
          Event totals across your monitored repositories.
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityTrendChart data={DEMO_DAILY_COUNTS} />
        <EventBreakdownChart stats={stats} />
      </div>
    </div>
  );
}
