import { getEventDisplay } from "@/lib/github/event-display";
import type { InlineButton } from "@/lib/telegram/api";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const DIVIDER = "━━━━━━━━━━━━━━━━";

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
  createdAt?: Date;
};

export type FormattedMessage = {
  text: string;
  buttons: InlineButton[][];
};

type Field = [emoji: string, label: string, value: string];
type Details = { fields: Field[]; quote: string[] };

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function code(value: string): string {
  return `<code>${escapeHtml(value)}</code>`;
}

function details(e: TelegramEventInput): Details {
  const s = e.summary;
  const fields: Field[] = [];
  const quote: string[] = [];

  switch (e.eventType) {
    case "push": {
      const count = typeof s.commitCount === "number" ? s.commitCount : 0;
      fields.push(["🌿", "Branch", code(str(s.branch) ?? "main")]);
      fields.push(["📝", "Commits", String(count)]);
      const commits = Array.isArray(s.commits) ? (s.commits as Record<string, unknown>[]) : [];
      for (const c of commits.slice(0, 5)) {
        const msg = str(c.message);
        if (msg) quote.push(`${code(str(c.id) ?? "")} ${escapeHtml(msg.slice(0, 90))}`);
      }
      if (count > 5) quote.push(`… and ${count - 5} more`);
      break;
    }
    case "star":
      if (typeof s.starsCount === "number") fields.push(["⭐", "Total stars", String(s.starsCount)]);
      break;
    case "fork":
      if (str(s.forkFullName)) fields.push(["🍴", "Fork", code(str(s.forkFullName)!)]);
      break;
    case "pull_request":
    case "pull_request_review":
      if (str(s.baseBranch)) fields.push(["🎯", "Base", code(str(s.baseBranch)!)]);
      if (str(s.reviewState)) fields.push(["🧾", "Review", escapeHtml(str(s.reviewState)!)]);
      if (str(s.title)) quote.push(`<b>#${s.number}</b> ${escapeHtml(str(s.title)!)}`);
      break;
    case "issues":
      if (str(s.title)) quote.push(`<b>#${s.number}</b> ${escapeHtml(str(s.title)!)}`);
      break;
    case "issue_comment":
      if (str(s.issueTitle)) fields.push(["📌", "On", `#${s.issueNumber} ${escapeHtml(str(s.issueTitle)!)}`]);
      if (str(s.commentExcerpt)) quote.push(escapeHtml(str(s.commentExcerpt)!.slice(0, 160)));
      break;
    case "release":
      if (str(s.tagName)) fields.push(["🏷️", "Tag", code(str(s.tagName)!)]);
      if (str(s.name)) fields.push(["📣", "Title", escapeHtml(str(s.name)!)]);
      break;
    case "create":
    case "delete":
      if (str(s.refType)) fields.push(["🔖", "Type", escapeHtml(str(s.refType)!)]);
      if (str(s.ref)) fields.push(["🌿", "Name", code(str(s.ref)!)]);
      break;
    case "workflow_run":
      if (str(s.workflowName)) fields.push(["🧩", "Workflow", escapeHtml(str(s.workflowName)!)]);
      if (str(s.branch)) fields.push(["🌿", "Branch", code(str(s.branch)!)]);
      break;
    case "deployment":
    case "deployment_status":
      if (str(s.environment)) fields.push(["🌍", "Environment", escapeHtml(str(s.environment)!)]);
      if (str(s.ref)) fields.push(["🌿", "Ref", code(str(s.ref)!)]);
      break;
    case "follower":
      if (typeof s.followersBefore === "number" && typeof s.followersAfter === "number") {
        fields.push(["📈", "Followers", `${s.followersBefore} → <b>${s.followersAfter}</b>`]);
      }
      break;
  }
  return { fields, quote };
}

export function formatTimestamp(date: Date): string {
  const d = date.toISOString();
  return `${d.slice(0, 10)} · ${d.slice(11, 16)} UTC`;
}

/** Builds the Telegram message (HTML + inline buttons) for a stored event. */
export function formatEventMessage(e: TelegramEventInput): FormattedMessage {
  const display = getEventDisplay(e.eventType, e.action);
  const emoji = EVENT_EMOJI[e.eventType] ?? "🔔";
  const { fields, quote } = details(e);

  const lines: string[] = [`${emoji}  <b>${escapeHtml(display.label)}</b>`, DIVIDER];

  if (e.repositoryName && e.eventType !== "follower") {
    lines.push(`📁 <b>Repository:</b> ${escapeHtml(e.repositoryName)}`);
  }
  if (e.actorLogin) {
    lines.push(
      `👤 <b>${e.eventType === "follower" ? "User" : "By"}:</b> <a href="https://github.com/${encodeURIComponent(e.actorLogin)}">@${escapeHtml(e.actorLogin)}</a>`
    );
  }
  for (const [icon, label, value] of fields) {
    lines.push(`${icon} <b>${label}:</b> ${value}`);
  }
  if (quote.length > 0) {
    lines.push("", `<blockquote>${quote.join("\n")}</blockquote>`);
  }
  lines.push("", `🕒 <i>${formatTimestamp(e.createdAt ?? new Date())}</i>`);

  const buttons: InlineButton[][] = [];
  const row: InlineButton[] = [];
  if (e.url) row.push({ text: "🔗 View on GitHub", url: e.url });
  if (e.repositoryName && e.eventType !== "follower") {
    row.push({ text: "📁 Repository", url: `https://github.com/${e.repositoryName}` });
  }
  if (e.eventType === "follower" && e.actorLogin) {
    row.length = 0;
    row.push({ text: "👤 View profile", url: `https://github.com/${e.actorLogin}` });
  }
  if (row.length > 0) buttons.push(row);

  return { text: lines.join("\n"), buttons };
}
