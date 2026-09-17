"use client";

import { useTransition } from "react";
import { CheckCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { markAllNotificationsRead } from "@/lib/notifications/actions";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
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
