import type { Metadata } from "next";
import {
  ActivityIcon,
  DatabaseIcon,
  FolderGitIcon,
  GitBranchIcon,
} from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard/stats";
import { getInstallationForUser } from "@/lib/github/installations";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard — GitHub Monitor",
};

export default async function DashboardPage() {
  const session = await getServerSession();
  // Layout already redirects to /login when there's no session, but
  // TypeScript can't know that across files — narrow it here too.
  if (!session) return null;

  const installation = await getInstallationForUser(session.user.id);

  if (!installation) {
    return (
      <EmptyState
        icon={GitBranchIcon}
        title="Connect your GitHub account"
        description="Connect GitHub Monitor to your GitHub account to start tracking repository activity."
        actionLabel="Connect GitHub"
        actionHref="/settings/github"
      />
    );
  }

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentActivity(session.user.id, 10),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            An overview of what&apos;s happening across your repositories.
          </p>
        </div>
        <LiveIndicator />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Repositories"
          value={stats.repositoriesCount}
          icon={FolderGitIcon}
        />
        <StatCard
          label="Monitored"
          value={stats.monitoredCount}
          icon={GitBranchIcon}
        />
        <StatCard
          label="Events Today"
          value={stats.eventsTodayCount}
          icon={ActivityIcon}
        />
        <StatCard
          label="Total Events"
          value={stats.totalEventsCount}
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
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="No activity yet"
              description="Once you start monitoring repositories, their activity will show up here."
              actionLabel="Manage repositories"
              actionHref="/repositories"
            />
          ) : (
            <div className="divide-y">
              {recentActivity.map((item) => (
                <ActivityFeedItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
