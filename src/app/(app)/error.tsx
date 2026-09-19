"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in app section:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-24 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <AlertTriangleIcon className="text-destructive size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Something went wrong</h2>
        <p className="text-muted-foreground max-w-sm text-sm text-balance">
          This page couldn&apos;t load properly. You can try again, or head
          back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcwIcon />
          Try again
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
