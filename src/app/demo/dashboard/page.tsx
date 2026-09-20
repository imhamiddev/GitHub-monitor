import type { Metadata } from "next";
import { ActivityIcon, DatabaseIcon, FolderGitIcon, GitBranchIcon } from "lucide-react";

import { DEMO_ACTIVITY, DEMO_STATS } from "@/lib/demo/data";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — Demo" };

export default function DemoDashboardPage() {
  const activityItems = DEMO_ACTIVITY.map((item) => ({
    id: item.id,
    eventType: item.eventType,
    action: item.action,
    actorLogin: item.actorLogin,
    actorAvatarUrl: null,
    summary: item.summary,
    url: null,
    createdAt: new Date(Date.now() - item.minutesAgo * 60_000),
    repositoryName: item.repositoryName,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          An overview of what&apos;s happening across your repositories.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Repositories"
          value={DEMO_STATS.repositoriesCount}
          icon={FolderGitIcon}
        />
        <StatCard
          label="Monitored"
          value={DEMO_STATS.monitoredCount}
          icon={GitBranchIcon}
        />
        <StatCard
          label="Events Today"
          value={DEMO_STATS.eventsTodayCount}
          icon={ActivityIcon}
        />
        <StatCard
          label="Total Events"
          value={DEMO_STATS.totalEventsCount}
          icon={DatabaseIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            The latest events across your monitored repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {activityItems.map((item) => (
              <ActivityFeedItem key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
