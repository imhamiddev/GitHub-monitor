"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import type { StarPoint, WeeklyCommits } from "@/lib/github/repo-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

function TooltipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
      <div className="font-medium">{title}</div>
      {lines.map((line) => (
        <div key={line} className="text-muted-foreground">
          {line}
        </div>
      ))}
    </div>
  );
}

export function StarGrowthChart({ data }: { data: StarPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Star growth</CardTitle>
        <CardDescription>Total stars over the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="starFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as StarPoint;
                  return (
                    <TooltipBox
                      title={format(parseISO(p.date), "MMMM d, yyyy")}
                      lines={[`${p.stars} stars`, `${p.gained >= 0 ? "+" : ""}${p.gained} that day`]}
                    />
                  );
                }}
              />
              <Area type="monotone" dataKey="stars" stroke="var(--primary)" strokeWidth={2} fill="url(#starFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyCommitsChart({ data }: { data: WeeklyCommits[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly commits</CardTitle>
        <CardDescription>Commits per week over the last 12 weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
              <Tooltip
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as WeeklyCommits;
                  return (
                    <TooltipBox
                      title={`Week of ${format(parseISO(p.week), "MMM d, yyyy")}`}
                      lines={[`${p.commits} commit${p.commits === 1 ? "" : "s"}`]}
                    />
                  );
                }}
              />
              <Bar dataKey="commits" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
