"use client";

import { ExternalLinkIcon, GitForkIcon, PackageIcon, SettingsIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";

import type { DemoRepo } from "@/lib/demo/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

function notifyDemo() {
  toast.info("This is a demo — sign up to manage real repositories.");
}

export function DemoRepositoryCard({ repo }: { repo: DemoRepo }) {
  return (
    <Card className="h-full gap-4 py-4">
      <CardHeader className="gap-1 px-5">
        <div className="flex h-6 items-center gap-2">
          <PackageIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate font-medium">{repo.name}</span>
          {repo.private && (
            <Badge variant="outline" className="text-xs">
              Private
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
          {repo.description || "No description"}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3 px-5">
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <StarIcon className="size-3.5" />
            {repo.starsCount}
          </span>
          <span className="flex items-center gap-1">
            <GitForkIcon className="size-3.5" />
            {repo.forksCount}
          </span>
        </div>

        <div className="flex h-6 items-center justify-between">
          <span className="text-sm font-medium">
            Monitoring: {repo.isMonitored ? "ON" : "OFF"}
          </span>
          <Switch checked={repo.isMonitored} onCheckedChange={notifyDemo} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={notifyDemo}>
            <ExternalLinkIcon />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={notifyDemo}>
            <SettingsIcon />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
