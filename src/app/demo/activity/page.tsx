import type { Metadata } from "next";

import { getDemoActivityItems } from "@/lib/demo/data";
import { groupByDay } from "@/lib/activity/group-by-day";
import { ActivityFeedItem } from "@/components/dashboard/activity-feed-item";

export const metadata: Metadata = { title: "Activity — Demo" };

export default function DemoActivityPage() {
  const items = getDemoActivityItems();

  const groups = groupByDay(items);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Activity</h1>
        <p className="text-muted-foreground text-sm">
          The complete history of events across your monitored repositories
        </p>
      </div>

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
    </div>
  );
}
