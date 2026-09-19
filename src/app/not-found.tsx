import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Link href="/" className="flex items-center gap-2 font-medium">
        <Logo className="size-8" />
        GitHub Monitor
      </Link>

      <div className="flex flex-col items-center gap-3">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <CompassIcon className="text-muted-foreground size-8" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">404</h1>
        <p className="text-muted-foreground max-w-sm text-balance">
          This page doesn&apos;t exist, or it moved somewhere we can&apos;t
          find.
        </p>
      </div>

      <Button asChild>
        <Link href="/">
          <HomeIcon />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
