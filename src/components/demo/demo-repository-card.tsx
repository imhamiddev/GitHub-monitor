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
    <Card>
      <CardHeader className="gap-1">
        <div className="flex items-center gap-2">
          <PackageIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate font-medium">{repo.name}</span>
          {repo.private && (
            <Badge variant="outline" className="text-xs">
              Private
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-sm">{repo.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Monitoring: {repo.isMonitored ? "ON" : "OFF"}
          </span>
          <Switch checked={repo.isMonitored} onCheckedChange={notifyDemo} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={notifyDemo} className="flex-1">
            <ExternalLinkIcon />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={notifyDemo} className="flex-1">
            <SettingsIcon />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
