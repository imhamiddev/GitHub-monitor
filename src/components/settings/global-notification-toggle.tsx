"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { setGlobalNotificationsEnabled } from "@/lib/notifications/settings";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function GlobalNotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await setGlobalNotificationsEnabled(checked);
      if (result.success) {
        toast.success(checked ? "Notifications enabled" : "Notifications disabled");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">All notifications</CardTitle>
          <CardDescription>
            Turn all GitHub Monitor notifications on or off, regardless of
            per-repository settings.
          </CardDescription>
        </div>
        <Switch
          defaultChecked={initialEnabled}
          onCheckedChange={handleChange}
          disabled={isPending}
          aria-label="Toggle all notifications"
        />
      </CardHeader>
    </Card>
  );
}
