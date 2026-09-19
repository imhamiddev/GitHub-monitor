"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, HomeIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Link href="/" className="flex items-center gap-2 font-medium">
        <Logo className="size-8" />
        GitHub Monitor
      </Link>

      <div className="flex flex-col items-center gap-3">
        <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-full">
          <AlertTriangleIcon className="text-destructive size-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground max-w-sm text-balance">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <RotateCcwIcon />
          Try again
        </Button>
        <Button asChild>
          <Link href="/">
            <HomeIcon />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
