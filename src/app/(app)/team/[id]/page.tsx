import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActivityIcon,
  ArrowLeftIcon,
  DatabaseIcon,
  EyeIcon,
  FolderGitIcon,
  GitBranchIcon,
  SettingsIcon,
} from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard/stats";
import { getInstallationForUser } from "@/lib/github/installations";
import { getDailyEventCounts } from "@/lib/statistics/daily-counts";
import { getTeamAccess, getUserLabel } from "@/lib/teams";
import { getMonitoredRepos } from "@/lib/telegram/queries";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityTrendChart } from "@/components/statistics/activity-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Team dashboard — GitHub Monitor",
};

/**
 * Read-only view of a team owner's data. Authorization is the team access
 * check; the queries then run against the owner's account, so a viewer can
 * see exactly what the owner shared and nothing else.
 */
export default async function TeamDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return null;

  const access = await getTeamAccess(session.user.id, id);
  if (!access) notFound();

  const ownerId = access.team.ownerUserId;
  const [installation, ownerLabel] = await Promise.all([getInstallationForUser(ownerId), getUserLabel(ownerId)]);

  const canManage = access.role === "owner" || access.role === "admin";

  const header = (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link href="/team">
          <ArrowLeftIcon />
          Back to team
        </Link>
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{access.team.name}</h1>
            <Badge variant="secondary" className="gap-1">
              <EyeIcon className="size-3" />
              Read-only
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Shared by {ownerLabel}</p>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/team/${access.team.id}/manage`}>
              <SettingsIcon />
              Manage
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  if (!installation) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {header}
        <EmptyState
          icon={GitBranchIcon}
          title="Nothing to show yet"
          description={`${ownerLabel} hasn't connected GitHub, so there's no activity to display.`}
        />
      </div>
    );
  }

  const [stats, recent, daily, repos] = await Promise.all([
    getDashboardStats(ownerId),
    getRecentActivity(ownerId, 10),
    getDailyEventCounts(ownerId, 30),
    getMonitoredRepos(ownerId, 12),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Repositories" value={stats.repositoriesCount} icon={FolderGitIcon} />
        <StatCard label="Monitored" value={stats.monitoredCount} icon={GitBranchIcon} />
        <StatCard label="Events Today" value={stats.eventsTodayCount} icon={ActivityIcon} />
        <StatCard label="Total Events" value={stats.totalEventsCount} icon={DatabaseIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityTrendChart data={daily} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitored repositories</CardTitle>
            <CardDescription>Most starred first.</CardDescription>
          </CardHeader>
          <CardContent>
            {repos.length === 0 ? (
              <p className="text-muted-foreground text-sm">No repositories are being monitored.</p>
            ) : (
              <ul className="divide-y">
                {repos.map((repo) => (
                  <li key={repo.fullName} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FolderGitIcon className="text-muted-foreground size-4 shrink-0" />
                      <span className="truncate">{repo.fullName}</span>
                      {repo.private && <Badge variant="outline">Private</Badge>}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      ⭐ {repo.starsCount} · 🍴 {repo.forksCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>The latest events across the shared repositories.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          ) : (
            <div className="divide-y">
              {recent.map((item) => (
                <ActivityFeedItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
