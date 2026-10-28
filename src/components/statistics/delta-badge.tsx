import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import type { Delta } from "@/lib/statistics/compare";
import { cn } from "@/lib/utils";

/** Small trend pill: green ▲ for growth, red ▼ for decline, grey for no change. */
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
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        direction === "up" && "bg-emerald-500/10 text-emerald-500",
        direction === "down" && "bg-red-500/10 text-red-500",
        direction === "flat" && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
