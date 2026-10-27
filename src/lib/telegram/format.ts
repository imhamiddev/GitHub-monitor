import { getEventDisplay } from "@/lib/github/event-display";
import type { ButtonStyle, InlineButton } from "@/lib/telegram/api";
import { t, translateEventLabel, type Lang } from "@/lib/telegram/i18n";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const DIVIDER = "━━━━━━━━━━━━━━━━";

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

function details(e: TelegramEventInput, lang: Lang): Details {
  const L = (k: Parameters<typeof t>[1]) => t(lang, k);
  const s = e.summary;
  const fields: Field[] = [];
  const quote: string[] = [];

  switch (e.eventType) {
    case "push": {
      const count = typeof s.commitCount === "number" ? s.commitCount : 0;
      fields.push(["🌿", L("f.branch"), code(str(s.branch) ?? "main")]);
      fields.push(["📝", L("f.commits"), String(count)]);
      const commits = Array.isArray(s.commits) ? (s.commits as Record<string, unknown>[]) : [];
      for (const c of commits.slice(0, 5)) {
        const msg = str(c.message);
        if (msg) quote.push(`${code(str(c.id) ?? "")} ${escapeHtml(msg.slice(0, 90))}`);
      }
      if (count > 5) quote.push(t(lang, "f.more", { n: count - 5 }));
      break;
    }
    case "star":
      if (typeof s.starsCount === "number") fields.push(["⭐", L("f.totalStars"), String(s.starsCount)]);
      break;
    case "fork":
      if (str(s.forkFullName)) fields.push(["🍴", L("f.fork"), code(str(s.forkFullName)!)]);
      break;
    case "pull_request":
    case "pull_request_review":
      if (str(s.baseBranch)) fields.push(["🎯", L("f.base"), code(str(s.baseBranch)!)]);
      if (str(s.reviewState)) fields.push(["🧾", L("f.review"), escapeHtml(str(s.reviewState)!)]);
      if (str(s.title)) quote.push(`<b>#${s.number}</b> ${escapeHtml(str(s.title)!)}`);
      break;
    case "issues":
      if (str(s.title)) quote.push(`<b>#${s.number}</b> ${escapeHtml(str(s.title)!)}`);
      break;
    case "issue_comment":
      if (str(s.issueTitle)) fields.push(["📌", L("f.on"), `#${s.issueNumber} ${escapeHtml(str(s.issueTitle)!)}`]);
      if (str(s.commentExcerpt)) quote.push(escapeHtml(str(s.commentExcerpt)!.slice(0, 160)));
      break;
    case "release":
      if (str(s.tagName)) fields.push(["🏷️", L("f.tag"), code(str(s.tagName)!)]);
      if (str(s.name)) fields.push(["📣", L("f.title"), escapeHtml(str(s.name)!)]);
      break;
    case "create":
    case "delete":
      if (str(s.refType)) fields.push(["🔖", L("f.type"), escapeHtml(str(s.refType)!)]);
      if (str(s.ref)) fields.push(["🌿", L("f.name"), code(str(s.ref)!)]);
      break;
    case "workflow_run":
      if (str(s.workflowName)) fields.push(["🧩", L("f.workflow"), escapeHtml(str(s.workflowName)!)]);
      if (str(s.branch)) fields.push(["🌿", L("f.branch"), code(str(s.branch)!)]);
      break;
    case "deployment":
    case "deployment_status":
      if (str(s.environment)) fields.push(["🌍", L("f.environment"), escapeHtml(str(s.environment)!)]);
      if (str(s.ref)) fields.push(["🌿", L("f.ref"), code(str(s.ref)!)]);
      break;
    case "follower":
      if (typeof s.followersBefore === "number" && typeof s.followersAfter === "number") {
        fields.push(["📈", L("f.followers"), `${s.followersBefore} → <b>${s.followersAfter}</b>`]);
      }
      break;
  }
  return { fields, quote };
}

/** English: ISO date + UTC time. Persian: Jalali date in Tehran time. */
export function formatTimestamp(date: Date, lang: Lang = "en"): string {
  if (lang === "fa") {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tehran",
      }).format(date);
    } catch {
      // fall through to the ISO format if ICU data is unavailable
    }
  }
  const d = date.toISOString();
  return `${d.slice(0, 10)} · ${d.slice(11, 16)} UTC`;
}

/** Colours the primary action button by outcome: red = bad, green = good. */
function eventButtonStyle(e: TelegramEventInput): ButtonStyle {
  const action = e.action ?? "";
  if (["failure", "error", "deleted", "cancelled", "unfollowed"].includes(action)) return "danger";
  if (["success", "merged", "published", "followed"].includes(action)) return "success";
  if (e.eventType === "star" || e.eventType === "release") return "success";
  return "primary";
}

/** Builds the Telegram message (HTML + inline buttons) for a stored event. */
export function formatEventMessage(e: TelegramEventInput, lang: Lang = "en"): FormattedMessage {
  const baseLabel =
    e.eventType === "star" && e.action === "deleted"
      ? "Star Removed"
      : getEventDisplay(e.eventType, e.action).label;
  const display = { label: translateEventLabel(lang, baseLabel) };
  const emoji = EVENT_EMOJI[e.eventType] ?? "🔔";
  const { fields, quote } = details(e, lang);

  const lines: string[] = [`${emoji}  <b>${escapeHtml(display.label)}</b>`, DIVIDER];

  if (e.repositoryName && e.eventType !== "follower") {
    lines.push(`📁 <b>${t(lang, "f.repository")}:</b> ${escapeHtml(e.repositoryName)}`);
  }
  if (e.actorLogin) {
    lines.push(
      `👤 <b>${t(lang, e.eventType === "follower" ? "f.user" : "f.by")}:</b> <a href="https://github.com/${encodeURIComponent(e.actorLogin)}">@${escapeHtml(e.actorLogin)}</a>`
    );
  }
  for (const [icon, label, value] of fields) {
    lines.push(`${icon} <b>${label}:</b> ${value}`);
  }
  if (quote.length > 0) {
    lines.push("", `<blockquote>${quote.join("\n")}</blockquote>`);
  }
  lines.push("", `🕒 <i>${formatTimestamp(e.createdAt ?? new Date(), lang)}</i>`);

  const buttons: InlineButton[][] = [];
  const row: InlineButton[] = [];
  if (e.url) row.push({ text: t(lang, "ib.viewGithub"), url: e.url, style: eventButtonStyle(e) });
  if (e.repositoryName && e.eventType !== "follower") {
    row.push({
      text: t(lang, "ib.repository"),
      url: `https://github.com/${e.repositoryName}`,
      style: "primary",
    });
  }
  if (e.eventType === "follower" && e.actorLogin) {
    row.length = 0;
    row.push({
      text: t(lang, "ib.viewProfile"),
      url: `https://github.com/${e.actorLogin}`,
      style: eventButtonStyle(e),
    });
  }
  if (row.length > 0) buttons.push(row);

  return { text: lines.join("\n"), buttons };
}
