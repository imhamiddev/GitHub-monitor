import { DEMO_STATS, getDemoActivityItems } from "@/lib/demo/data";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";
import { StatCard } from "@/components/dashboard/stat-card";

/**
 * Static preview of the real dashboard, built from the same components
 * and the demo data behind /demo, so the landing page shows what the
 * product actually looks like.
 */
export function HeroPreview() {
  const items = getDemoActivityItems(4);

  return (
    <div
      aria-hidden
      className="bg-card pointer-events-none flex w-full flex-col gap-4 rounded-xl border p-4 select-none"
    >
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Repositories" value={DEMO_STATS.repositoriesCount} />
        <StatCard label="Events today" value={DEMO_STATS.eventsTodayCount} />
        <StatCard label="Total events" value={DEMO_STATS.totalEventsCount} />
      </div>
      <div className="rounded-lg border px-4">
        <div className="text-muted-foreground pt-3 text-sm">Recent activity</div>
        <div className="divide-y">
          {items.map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
