import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import type { Delta } from "@/lib/statistics/compare";
import { cn } from "@/lib/utils";

/** Quiet trend figure: success color for growth, destructive for decline, muted for no change. */
export function DeltaBadge({ delta }: { delta: Delta }) {
  const { direction, percent, diff } = delta;

  const label =
    direction === "flat"
      ? "0%"
      : percent === null
        ? `+${diff} new`
        : `${percent > 0 ? "+" : ""}${percent}%`;

  const Icon = direction === "up" ? ArrowUpRightIcon : direction === "down" ? ArrowDownRightIcon : MinusIcon;

  return (
    <span
      title={`${diff > 0 ? "+" : ""}${diff} vs previous period`}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs tabular-nums",
        direction === "up" && "text-success",
        direction === "down" && "text-destructive",
        direction === "flat" && "text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
