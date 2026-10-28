import { CircleDotIcon, GitBranchIcon, GitForkIcon, GitPullRequestIcon, StarIcon } from "lucide-react";

import {
  getRepoCounters,
  getRepoRecentEvents,
  getRepoTotals,
  getStarGrowth,
  getTopContributors,
  getWeeklyCommits,
} from "@/lib/github/repo-insights";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { StatCard } from "@/components/dashboard/stat-card";
import { StarGrowthChart, WeeklyCommitsChart } from "@/components/repositories/repo-insights-charts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Server component: loads everything in parallel and lays the insights out. */
export async function RepoInsights({ repositoryId }: { repositoryId: string }) {
  const counters = await getRepoCounters(repositoryId);
  const [totals, stars, weekly, contributors, recent] = await Promise.all([
    getRepoTotals(repositoryId),
    getStarGrowth(repositoryId, counters.stars),
    getWeeklyCommits(repositoryId),
    getTopContributors(repositoryId),
    getRepoRecentEvents(repositoryId),
  ]);

  return (
    <section className="flex flex-col gap-4" aria-label="Repository insights">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
        <p className="text-muted-foreground text-sm">Last 30 days for this repository.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Commits" value={totals.commits} icon={GitBranchIcon} />
        <StatCard label="New stars" value={totals.stars} icon={StarIcon} />
        <StatCard label="Forks" value={totals.forks} icon={GitForkIcon} />
        <StatCard label="Pull requests" value={totals.pullRequests} icon={GitPullRequestIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <StarGrowthChart data={stars} />
        <WeeklyCommitsChart data={weekly} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDotIcon className="size-4" />
              Top contributors
            </CardTitle>
            <CardDescription>Most active people in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {contributors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            ) : (
              <ul className="divide-y">
                {contributors.map((c) => (
                  <li key={c.login} className="flex items-center justify-between gap-3 py-2">
                    <a
                      href={`https://github.com/${c.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-sm hover:underline"
                    >
                      <Avatar className="size-6">
                        {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.login} />}
                        <AvatarFallback>{c.login[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">@{c.login}</span>
                    </a>
                    <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      {c.commits > 0 ? `${c.commits} commits · ` : ""}
                      {c.events} events
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
            <CardDescription>The latest things that happened here.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No events recorded yet.</p>
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
    </section>
  );
}
