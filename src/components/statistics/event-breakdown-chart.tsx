"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { StatisticsCounts } from "@/lib/statistics/counts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { label: string; value: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
      <div className="font-medium">{point.label}</div>
      <div className="text-muted-foreground">
        {point.value} event{point.value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export function EventBreakdownChart({ stats }: { stats: StatisticsCounts }) {
  const data = [
    { label: "Commits", value: stats.commits },
    { label: "Stars", value: stats.stars },
    { label: "Forks", value: stats.forks },
    { label: "Pull Requests", value: stats.pullRequests },
    { label: "Issues", value: stats.issues },
    { label: "Releases", value: stats.releases },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Breakdown</CardTitle>
        <CardDescription>Distribution across event types for the selected range.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
