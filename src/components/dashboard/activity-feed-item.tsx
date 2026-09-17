import Link from "next/link";

import { getEventDisplay } from "@/lib/github/event-display";
import { formatRelativeTime } from "@/lib/format";
import type { RecentActivityItem } from "@/lib/dashboard/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function renderSummaryLine(item: RecentActivityItem): string {
  const s = item.summary;

  switch (item.eventType) {
    case "push": {
      const commitCount = typeof s.commitCount === "number" ? s.commitCount : 0;
      const branch = typeof s.branch === "string" ? s.branch : "main";
      return `${commitCount} commit${commitCount === 1 ? "" : "s"} to ${branch}`;
    }
    case "star":
      return `@${item.actorLogin} starred the repo`;
    case "fork":
      return `@${item.actorLogin} forked the repo`;
    case "pull_request":
      return typeof s.title === "string" ? `#${s.number} ${s.title}` : "Pull request";
    case "issues":
      return typeof s.title === "string" ? `#${s.number} ${s.title}` : "Issue";
    case "issue_comment":
      return typeof s.issueTitle === "string" ? `on #${s.issueNumber} ${s.issueTitle}` : "Comment";
    case "release":
      return typeof s.tagName === "string" ? String(s.tagName) : "Release";
    case "workflow_run":
      return typeof s.workflowName === "string" ? String(s.workflowName) : "Workflow";
    case "deployment":
    case "deployment_status":
      return typeof s.environment === "string" ? `to ${s.environment}` : "Deployment";
    case "create":
    case "delete":
      return typeof s.ref === "string" ? String(s.ref) : "Branch change";
    default:
      return item.action ?? "";
  }
}

export function ActivityFeedItem({ item }: { item: RecentActivityItem }) {
  const display = getEventDisplay(item.eventType, item.action);
  const Icon = display.icon;

  const content = (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 ${display.colorClassName}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{display.label}</span>
          <span className="text-muted-foreground truncate">
            {item.repositoryName}
          </span>
        </div>
        <p className="text-muted-foreground truncate text-sm">
          {renderSummaryLine(item)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.actorAvatarUrl && (
          <Avatar className="size-6">
            <AvatarImage src={item.actorAvatarUrl} alt={item.actorLogin ?? ""} />
            <AvatarFallback>{item.actorLogin?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
    </div>
  );

  if (item.url) {
    return (
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-accent/50 -mx-2 block rounded-md px-2 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="-mx-2 px-2">{content}</div>;
}
