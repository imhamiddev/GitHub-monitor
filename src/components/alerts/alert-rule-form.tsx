"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { createAlertRule } from "@/lib/alerts/actions";
import { ALERT_EVENT_TYPES, ALERT_PRESETS, type AlertPreset } from "@/lib/alerts/presets";
import type { RepoOption } from "@/lib/alerts/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL_REPOS = "all";

type FormState = {
  name: string;
  repositoryId: string;
  eventType: string;
  action: string;
  threshold: string;
  windowMinutes: string;
  cooldownMinutes: string;
};

const INITIAL: FormState = {
  name: "",
  repositoryId: ALL_REPOS,
  eventType: "workflow_run",
  action: "failure",
  threshold: "1",
  windowMinutes: "60",
  cooldownMinutes: "60",
};

export function AlertRuleForm({ repos }: { repos: RepoOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(INITIAL);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function applyPreset(preset: AlertPreset) {
    setForm((prev) => ({
      ...prev,
      name: preset.label,
      eventType: preset.eventType,
      action: preset.action ?? "",
      threshold: String(preset.threshold),
      windowMinutes: String(preset.windowMinutes),
    }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createAlertRule({
        name: form.name,
        repositoryId: form.repositoryId === ALL_REPOS ? null : form.repositoryId,
        eventType: form.eventType,
        action: form.action || null,
        threshold: Number(form.threshold),
        windowMinutes: Number(form.windowMinutes),
        cooldownMinutes: Number(form.cooldownMinutes),
      });
      if (result.success) {
        toast.success("Alert rule created.");
        setForm(INITIAL);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New alert rule</CardTitle>
        <CardDescription>
          Get a Telegram message when matching events happen often enough within a time window.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Presets">
          {ALERT_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              title={preset.description}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="alert-name">Name</Label>
            <Input
              id="alert-name"
              value={form.name}
              maxLength={80}
              placeholder="e.g. Production deploy failed"
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Repository</Label>
            <Select value={form.repositoryId} onValueChange={(v) => set("repositoryId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REPOS}>All repositories</SelectItem>
                {repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id}>
                    {repo.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Event</Label>
            <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_EVENT_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alert-action">Action (optional)</Label>
            <Input
              id="alert-action"
              value={form.action}
              placeholder="failure, opened, merged…"
              onChange={(e) => set("action", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alert-threshold">Count ≥</Label>
              <Input
                id="alert-threshold"
                type="number"
                min={1}
                value={form.threshold}
                onChange={(e) => set("threshold", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alert-window">Within (min)</Label>
              <Input
                id="alert-window"
                type="number"
                min={1}
                value={form.windowMinutes}
                onChange={(e) => set("windowMinutes", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alert-cooldown">Cooldown (min)</Label>
              <Input
                id="alert-cooldown"
                type="number"
                min={1}
                value={form.cooldownMinutes}
                onChange={(e) => set("cooldownMinutes", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <Button onClick={handleSubmit} disabled={isPending || form.name.trim().length === 0}>
            {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            Create rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
