import { Card } from "@/components/ui/card";
import { DeltaBadge } from "@/components/statistics/delta-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Delta } from "@/lib/statistics/compare";

/**
 * Metric tile: label, figure and optional change vs the previous period.
 * Numbers carry the tile, so there is no icon box competing with them.
 */
export function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  /** Optional change vs the previous period (statistics page). */
  delta?: Delta;
}) {
  return (
    <Card className="gap-1 px-4 py-3">
      <div className="text-muted-foreground truncate text-sm">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl leading-8 font-medium tabular-nums">{value.toLocaleString("en-US")}</span>
        {delta && <DeltaBadge delta={delta} />}
      </div>
    </Card>
  );
}

/** Loading placeholder matching StatCard's exact dimensions. */
export function StatCardSkeleton() {
  return (
    <Card className="gap-1 px-4 py-3">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-12" />
    </Card>
  );
}
