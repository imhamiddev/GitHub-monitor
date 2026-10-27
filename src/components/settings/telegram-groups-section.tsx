"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, Loader2Icon, MegaphoneIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import {
  generateTelegramGroupLink,
  getTelegramGroupCount,
  removeTelegramGroup,
} from "@/lib/telegram/actions";
import { Button } from "@/components/ui/button";

export type TelegramGroupItem = { id: string; title: string | null; chatType: string };

type Pending = { groupLink: string; channelCommand: string; expiresAt: number };

export function TelegramGroupsSection({ groups }: { groups: TelegramGroupItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<Pending | null>(null);

  // Wait for the bot to confirm a newly linked group, then refresh the list.
  useEffect(() => {
    if (!pending) return;
    const startCount = groups.length;
    const interval = setInterval(async () => {
      if (Date.now() > pending.expiresAt) {
        setPending(null);
        return;
      }
      if ((await getTelegramGroupCount()) > startCount) {
        setPending(null);
        toast.success("Group connected!");
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pending, groups.length, router]);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateTelegramGroupLink();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPending({
        groupLink: result.groupLink,
        channelCommand: result.channelCommand,
        expiresAt: new Date(result.expiresAt).getTime(),
      });
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeTelegramGroup(id);
      if (result.success) {
        toast.success("Removed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy.");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <UsersIcon className="text-muted-foreground size-4" />
          Groups &amp; channels
        </span>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          Add
        </Button>
      </div>

      {groups.length === 0 && !pending && (
        <p className="text-muted-foreground text-sm">
          Send notifications to a team group or a channel as well.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="flex h-9 items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            {group.chatType === "channel" ? (
              <MegaphoneIcon className="text-muted-foreground size-4 shrink-0" />
            ) : (
              <UsersIcon className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className="truncate">{group.title ?? "Untitled chat"}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(group.id)}
            disabled={isPending}
            aria-label="Remove"
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      {pending && (
        <div className="bg-muted/40 flex flex-col gap-3 rounded-md p-3 text-sm">
          <div>
            <p className="font-medium">Group</p>
            <p className="text-muted-foreground mb-2">
              Open the link, pick your group and confirm. This page updates automatically (link valid for 15
              minutes).
            </p>
            <Button size="sm" asChild>
              <a href={pending.groupLink} target="_blank" rel="noopener noreferrer">
                <UsersIcon />
                Add bot to a group
              </a>
            </Button>
          </div>
          <div>
            <p className="font-medium">Channel</p>
            <p className="text-muted-foreground mb-2">
              Add the bot as a channel admin, then post this command in the channel:
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-background min-w-0 flex-1 truncate rounded border px-2 py-1.5 text-xs">
                {pending.channelCommand}
              </code>
              <Button variant="outline" size="icon" onClick={() => copy(pending.channelCommand)} aria-label="Copy">
                <CopyIcon />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
