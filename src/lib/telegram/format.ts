import { getEventDisplay } from "@/lib/github/event-display";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const EVENT_EMOJI: Record<string, string> = {
  push: "🔨",
  star: "⭐",
  fork: "🍴",
  pull_request: "🔀",
  pull_request_review: "👀",
  issues: "🐛",
  issue_comment: "💬",
  release: "🚀",
  create: "🌿",
  delete: "🗑️",
  workflow_run: "⚙️",
  deployment: "📦",
  deployment_status: "📦",
  follower: "👤",
};

export type TelegramEventInput = {
  repositoryName: string | null;
  eventType: string;
  action: string | null;
  actorLogin: string | null;
  summary: Record<string, unknown>;
  url: string | null;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function detailLines(e: TelegramEventInput): string[] {
  const s = e.summary;
  switch (e.eventType) {
    case "push": {
      const count = typeof s.commitCount === "number" ? s.commitCount : 0;
      const branch = str(s.branch) ?? "main";
      const lines = [`${count} commit${count === 1 ? "" : "s"} → <code>${escapeHtml(branch)}</code>`];
      const commits = Array.isArray(s.commits) ? (s.commits as Record<string, unknown>[]) : [];
      for (const c of commits.slice(0, 3)) {
        const msg = str(c.message);
        if (msg) lines.push(`• <code>${escapeHtml(str(c.id) ?? "")}</code> ${escapeHtml(msg.slice(0, 80))}`);
      }
      if (commits.length > 3) lines.push(`… +${count - 3} more`);
      return lines;
    }
    case "star":
      return typeof s.starsCount === "number" ? [`Total stars: ${s.starsCount}`] : [];
    case "fork":
      return str(s.forkFullName) ? [`Fork: ${escapeHtml(str(s.forkFullName)!)}`] : [];
    case "pull_request":
    case "pull_request_review":
    case "issues":
      return str(s.title) ? [`#${s.number} ${escapeHtml(str(s.title)!)}`] : [];
    case "issue_comment":
      return [
        str(s.issueTitle) ? `On #${s.issueNumber} ${escapeHtml(str(s.issueTitle)!)}` : "",
        str(s.commentExcerpt) ? `“${escapeHtml(str(s.commentExcerpt)!.slice(0, 120))}”` : "",
      ].filter(Boolean);
    case "release":
      return [escapeHtml(str(s.name) ?? str(s.tagName) ?? "")].filter(Boolean);
    case "create":
    case "delete":
      return str(s.ref) ? [`<code>${escapeHtml(str(s.ref)!)}</code>`] : [];
    case "workflow_run":
      return [
        str(s.workflowName) ? escapeHtml(str(s.workflowName)!) : "",
        str(s.branch) ? `Branch: <code>${escapeHtml(str(s.branch)!)}</code>` : "",
      ].filter(Boolean);
    case "deployment":
    case "deployment_status":
      return str(s.environment) ? [`Environment: ${escapeHtml(str(s.environment)!)}`] : [];
    case "follower":
      return typeof s.followersBefore === "number" && typeof s.followersAfter === "number"
        ? [`Followers: ${s.followersBefore} → ${s.followersAfter}`]
        : [];
    default:
      return [];
  }
}

/** Builds the Telegram HTML message for a stored event. */
export function formatEventMessage(e: TelegramEventInput): string {
  const display = getEventDisplay(e.eventType, e.action);
  const emoji = EVENT_EMOJI[e.eventType] ?? "🔔";

  const lines: string[] = [`${emoji} <b>${escapeHtml(display.label)}</b>`];
  if (e.repositoryName && e.eventType !== "follower") {
    lines.push(`📁 <b>${escapeHtml(e.repositoryName)}</b>`);
  }
  if (e.actorLogin) {
    lines.push(`👤 <a href="https://github.com/${encodeURIComponent(e.actorLogin)}">@${escapeHtml(e.actorLogin)}</a>`);
  }
  lines.push(...detailLines(e));
  if (e.url) lines.push(`🔗 <a href="${escapeHtml(e.url)}">View on GitHub</a>`);

  return lines.join("\n");
}
