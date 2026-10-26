import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Compact metric tile: icon on the left, label + value stacked on the
 * right. Padding is deliberately tight so the tile hugs its content
 * instead of reserving empty space.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex-row items-center gap-3 px-4 py-3">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-muted-foreground truncate text-sm leading-tight">
          {label}
        </div>
        <div className="text-xl leading-tight font-semibold tabular-nums">
          {value}
        </div>
      </div>
    </Card>
  );
}

/** Loading placeholder matching StatCard's exact dimensions. */
export function StatCardSkeleton() {
  return (
    <Card className="flex-row items-center gap-3 px-4 py-3">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
    </Card>
  );
}
