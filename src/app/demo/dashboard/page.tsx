import type { Metadata } from "next";

import { DEMO_STATS, getDemoActivityItems } from "@/lib/demo/data";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard | Demo" };

export default function DemoDashboardPage() {
  const activityItems = getDemoActivityItems();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          An overview of what&apos;s happening across your repositories
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Repositories"
          value={DEMO_STATS.repositoriesCount}
        />
        <StatCard
          label="Monitored"
          value={DEMO_STATS.monitoredCount}
        />
        <StatCard
          label="Events today"
          value={DEMO_STATS.eventsTodayCount}
        />
        <StatCard
          label="Total events"
          value={DEMO_STATS.totalEventsCount}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            The latest events across your monitored repositories
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
