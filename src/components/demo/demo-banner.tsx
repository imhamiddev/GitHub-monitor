import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DemoBanner() {
  return (
    <div className="bg-primary text-primary-foreground flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-sm">
      <SparklesIcon className="size-4 shrink-0" />
      <span>
        You&apos;re viewing a <strong>live demo</strong> with sample data — nothing
        here is connected to a real GitHub account.
      </span>
      <Button
        asChild
        size="sm"
        variant="secondary"
        className="h-7 shrink-0 px-3 text-xs"
      >
        <Link href="/register">Get started for free</Link>
      </Button>
    </div>
  );
}
