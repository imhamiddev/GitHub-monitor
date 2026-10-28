import type { StatisticsCounts } from "@/lib/statistics/counts";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DateRange = { from: Date; to?: Date };

/**
 * The window to compare a range against.
 * - "today" is compared with the same elapsed time yesterday, so a
 *   half-finished day isn't measured against a full one.
 * - Every other range is compared with the equally long period right
 *   before it (e.g. last 7 days vs the 7 days before that).
 */
export function previousRange(preset: string, range: DateRange, now = new Date()): Required<DateRange> {
  const end = range.to ?? now;
  if (preset === "today") {
    return {
      from: new Date(range.from.getTime() - DAY_MS),
      to: new Date(end.getTime() - DAY_MS),
    };
  }
  const duration = end.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime() - 1),
  };
}

export type Delta = {
  /** Absolute change (current − previous). */
  diff: number;
  /** Percent change, or null when there is no previous value to compare. */
  percent: number | null;
  direction: "up" | "down" | "flat";
};

export function computeDelta(current: number, previous: number): Delta {
  const diff = current - previous;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const percent = previous === 0 ? null : Math.round((diff / previous) * 100);
  return { diff, percent, direction };
}

export type StatisticsDeltas = Record<keyof StatisticsCounts, Delta>;

export function computeDeltas(current: StatisticsCounts, previous: StatisticsCounts): StatisticsDeltas {
  const keys = Object.keys(current) as (keyof StatisticsCounts)[];
  return Object.fromEntries(keys.map((k) => [k, computeDelta(current[k], previous[k])])) as StatisticsDeltas;
}
