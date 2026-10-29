"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteAlertRule, toggleAlertRule } from "@/lib/alerts/actions";
import { ALERT_EVENT_TYPES } from "@/lib/alerts/presets";
import type { AlertRuleListItem } from "@/lib/alerts/queries";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

function describe(rule: AlertRuleListItem): string {
  const event = ALERT_EVENT_TYPES.find((e) => e.value === rule.eventType)?.label ?? rule.eventType;
  const action = rule.action ? ` (${rule.action})` : "";
  return `${rule.threshold}× ${event}${action} within ${rule.windowMinutes} min`;
}

export function AlertRuleList({ rules }: { rules: AlertRuleListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(task: () => Promise<{ success: boolean; error?: string }>, okMessage?: string) {
    startTransition(async () => {
      const result = await task();
      if (!result.success) toast.error(result.error ?? "Something went wrong.");
      else if (okMessage) toast.success(okMessage);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your rules</CardTitle>
        <CardDescription>
          {rules.length === 0 ? "No rules yet — create one above." : `${rules.length} rule${rules.length === 1 ? "" : "s"}.`}
        </CardDescription>
      </CardHeader>
      {rules.length > 0 && (
        <CardContent className="divide-y">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{rule.name}</span>
                  <Badge variant="secondary">{rule.repositoryName ?? "All repositories"}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">{describe(rule)}</p>
                <p className="text-muted-foreground text-xs">
                  {rule.lastTriggeredAt
                    ? `Last triggered ${formatRelativeTime(rule.lastTriggeredAt)}`
                    : "Never triggered"}{" "}
                  · cooldown {rule.cooldownMinutes} min
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={rule.enabled}
                  disabled={isPending}
                  aria-label={`Toggle ${rule.name}`}
                  onCheckedChange={(enabled) => run(() => toggleAlertRule(rule.id, enabled))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  aria-label={`Delete ${rule.name}`}
                  onClick={() => run(() => deleteAlertRule(rule.id), "Rule deleted.")}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
