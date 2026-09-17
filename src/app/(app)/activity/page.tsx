import type { Metadata } from "next";
import { ActivityIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getActivity, getMonitoredRepositoriesForFilter } from "@/lib/activity/list";
import { groupByDay, subDays } from "@/lib/activity/group-by-day";
import { ActivityFilters } from "@/components/activity/activity-filters";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Activity — GitHub Monitor",
};

function resolveDateRange(range: string | undefined): Date | undefined {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    case "7d":
      return subDays(now, 7);
    case "30d":
      return subDays(now, 30);
    default:
      return undefined;
  }
}

function buildHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page > 1) next.set("page", String(page));
  else next.delete("page");
  const query = next.toString();
  return `/activity${query ? `?${query}` : ""}`;
}

export default async function ActivityPage({
  searchParams,
}: PageProps<"/activity">) {
  const session = await getServerSession();
  if (!session) return null;

  const params = await searchParams;
  const repoId = typeof params.repo === "string" ? params.repo : undefined;
  const eventType = typeof params.type === "string" ? params.type : undefined;
  const range = typeof params.range === "string" ? params.range : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, totalPages }, repositories] = await Promise.all([
    getActivity(session.user.id, {
      repositoryId: repoId,
      eventType,
      dateFrom: resolveDateRange(range),
      search,
      page,
    }),
    getMonitoredRepositoriesForFilter(session.user.id),
  ]);

  const groups = groupByDay(items);

  const currentParams = new URLSearchParams();
  if (repoId) currentParams.set("repo", repoId);
  if (eventType) currentParams.set("type", eventType);
  if (range) currentParams.set("range", range);
  if (search) currentParams.set("q", search);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-muted-foreground text-sm">
          The complete history of events across your monitored repositories.
        </p>
      </div>

      <ActivityFilters repositories={repositories} />

      {items.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity found"
          description="Try adjusting your filters, or check back once your repositories start seeing activity."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-muted-foreground mb-2 text-sm font-medium">
                {group.label}
              </h2>
              <div className="divide-y rounded-lg border">
                {group.items.map((item) => (
                  <div key={item.id} className="px-3">
                    <ActivityFeedItem item={item} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref(currentParams, Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={buildHref(currentParams, page)} isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={buildHref(currentParams, Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
