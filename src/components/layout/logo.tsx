import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-primary text-primary-foreground",
        className
      )}
    >
      <GitBranch className="size-[60%]" strokeWidth={2.5} />
    </div>
  );
}
