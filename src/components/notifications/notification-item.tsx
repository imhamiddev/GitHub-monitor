"use client";

import { useTransition } from "react";
import Link from "next/link";

import { getEventDisplay } from "@/lib/github/event-display";
import { formatRelativeTime } from "@/lib/format";
import { markNotificationRead } from "@/lib/notifications/actions";
import type { NotificationListItem } from "@/lib/notifications/list";
import { cn } from "@/lib/utils";

function renderSummaryLine(item: NotificationListItem): string {
  const s = item.summary;
  switch (item.eventType) {
    case "push": {
      const commitCount = typeof s.commitCount === "number" ? s.commitCount : 0;
      const branch = typeof s.branch === "string" ? s.branch : "main";
      return `${item.actorLogin ?? "Someone"} pushed ${commitCount} commit${commitCount === 1 ? "" : "s"} to ${branch}`;
    }
    case "star":
      return `@${item.actorLogin} starred ${item.repositoryName}`;
    case "fork":
      return `@${item.actorLogin} forked ${item.repositoryName}`;
    case "follower": {
      const before = typeof s.followersBefore === "number" ? s.followersBefore : null;
      const after = typeof s.followersAfter === "number" ? s.followersAfter : null;
      return before !== null && after !== null
        ? `@${item.actorLogin} — Followers ${before} → ${after}`
        : `@${item.actorLogin}`;
    }
    case "pull_request":
      return typeof s.title === "string" ? `#${s.number} ${s.title}` : "Pull request";
    case "issues":
      return typeof s.title === "string" ? `#${s.number} ${s.title}` : "Issue";
    case "release":
      return typeof s.tagName === "string" ? String(s.tagName) : "New release";
    default:
      return item.action ?? item.eventType;
  }
}

export function NotificationItem({ item }: { item: NotificationListItem }) {
  const [isPending, startTransition] = useTransition();
  const display = getEventDisplay(item.eventType, item.action);
  const Icon = display.icon;

  function handleClick() {
    if (!item.read) {
      startTransition(() => {
        void markNotificationRead(item.id);
      });
    }
  }

  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-3 transition-colors",
        !item.read && "bg-accent/40"
      )}
    >
      <div className={`mt-0.5 shrink-0 ${display.colorClassName}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{display.label}</span>
          {!item.read && (
            <span className="bg-primary inline-block size-1.5 shrink-0 rounded-full" />
          )}
        </div>
        <p className="text-muted-foreground truncate text-sm">
          {renderSummaryLine(item)}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {formatRelativeTime(item.createdAt)} · {item.repositoryName}
        </p>
      </div>
    </div>
  );

  if (item.url) {
    return (
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-disabled={isPending}
        className="hover:bg-accent/60 block rounded-md transition-colors"
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="hover:bg-accent/60 block w-full rounded-md text-left transition-colors"
    >
      {body}
    </button>
  );
}
