"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateEventCategorySetting } from "@/lib/github/repo-actions";
import type { EventCategory } from "@/lib/github/events";
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

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await updateEventCategorySetting(repositoryId, category, checked);
      if (!result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      <Switch
        defaultChecked={initialEnabled}
        onCheckedChange={handleChange}
        disabled={isPending}
        aria-label={`Toggle ${label} notifications`}
      />
    </div>
  );
}
