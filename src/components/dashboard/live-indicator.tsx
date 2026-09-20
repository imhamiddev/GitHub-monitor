"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 15_000;

export function LiveIndicator() {
  const router = useRouter();
  const [newCount, setNewCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const sinceRef = useRef(new Date());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(
          `/api/dashboard/poll?since=${encodeURIComponent(sinceRef.current.toISOString())}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Poll failed");
        const data = (await response.json()) as { newCount: number };
        if (!cancelled) {
          setNewCount(data.newCount);
          setIsPolling(true);
        }
      } catch {
        // Silently stop showing as "live" on a failed poll (e.g. offline);
        // resumes automatically once a request succeeds again.
        if (!cancelled) setIsPolling(false);
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);

    // Pause polling when the tab isn't visible, resume (with an
    // immediate check) when it becomes visible again.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        poll();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function handleRefresh() {
    sinceRef.current = new Date();
    setNewCount(0);
    router.refresh();
  }

  if (newCount > 0) {
    return (
      <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
        <span className="relative flex size-2">
          <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex size-2 rounded-full" />
        </span>
        {newCount} new event{newCount === 1 ? "" : "s"}
        <RefreshCwIcon className="size-3.5" />
      </Button>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground gap-1.5">
      <span className="relative flex size-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isPolling ? "bg-success animate-ping" : "bg-muted-foreground"
          }`}
        />
        <span
          className={`relative inline-flex size-2 rounded-full ${
            isPolling ? "bg-success" : "bg-muted-foreground"
          }`}
        />
      </span>
      {isPolling ? "Live" : "Offline"}
    </Badge>
  );
}
