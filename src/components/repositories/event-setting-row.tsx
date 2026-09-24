"use client";

import { useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { updateEventCategorySetting } from "@/lib/github/repo-actions";
import type { EventCategory } from "@/lib/github/events";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { Switch } from "@/components/ui/switch";

export function EventSettingRow({
  repositoryId,
  category,
  label,
  initialEnabled,
}: {
  repositoryId: string;
  category: EventCategory;
  label: string;
  initialEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const runWithBar = useLoadingBarAction();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await runWithBar(() =>
        updateEventCategorySetting(repositoryId, category, checked)
      );
      if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="hover:bg-accent/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2.5 transition-colors duration-150">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {isPending && (
          <Loader2Icon className="text-muted-foreground size-3.5 animate-spin" />
        )}
      </span>
      <Switch
        defaultChecked={initialEnabled}
        onCheckedChange={handleChange}
        disabled={isPending}
        aria-label={`Toggle tracking for ${label}`}
      />
    </div>
  );
}
