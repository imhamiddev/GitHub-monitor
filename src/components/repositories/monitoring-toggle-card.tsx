"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { toggleRepositoryMonitoring } from "@/lib/github/repo-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function MonitoringToggleCard({
  githubRepoId,
  repoName,
  initialMonitored,
}: {
  githubRepoId: number;
  repoName: string;
  initialMonitored: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleRepositoryMonitoring(githubRepoId, checked);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(checked ? "Monitoring enabled" : "Monitoring disabled");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Monitoring</CardTitle>
        <Switch
          defaultChecked={initialMonitored}
          onCheckedChange={handleChange}
          disabled={isPending}
          aria-label={`Toggle monitoring for ${repoName}`}
        />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          When enabled, GitHub Monitor tracks activity in {repoName} and sends
          notifications based on your settings below.
        </p>
      </CardContent>
    </Card>
  );
}
