"use client";

import { useTransition } from "react";
import { CheckCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { markAllNotificationsRead } from "@/lib/notifications/actions";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const runWithBar = useLoadingBarAction();

  function handleClick() {
    startTransition(async () => {
      const result = await runWithBar(() => markAllNotificationsRead());
      if (result.success) {
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      <CheckCheckIcon />
      Mark all as read
    </Button>
  );
}
