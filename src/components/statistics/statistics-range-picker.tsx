"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

export function StatisticsRangePicker({
  activePreset,
  customFrom,
  customTo,
}: {
  activePreset: string;
  customFrom?: Date;
  customTo?: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustomRange(range: DateRange | undefined) {
    if (!range?.from) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set("from", format(range.from, "yyyy-MM-dd"));
    if (range.to) {
      params.set("to", format(range.to, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={activePreset === "custom" ? "" : activePreset}>
        <TabsList>
          {PRESETS.map((preset) => (
            <TabsTrigger
              key={preset.value}
              value={preset.value}
              onClick={() => setPreset(preset.value)}
            >
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === "custom" ? "default" : "outline"}
            size="sm"
          >
            <CalendarIcon />
            {activePreset === "custom" && customFrom
              ? `${format(customFrom, "MMM d")}${customTo ? ` – ${format(customTo, "MMM d")}` : ""}`
              : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: customFrom, to: customTo }}
            onSelect={setCustomRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
