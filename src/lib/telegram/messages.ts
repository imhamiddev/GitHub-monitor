import type { StatisticsCounts } from "@/lib/statistics/counts";
import type { DashboardStats, RecentActivityItem } from "@/lib/dashboard/stats";
import { getEventDisplay } from "@/lib/github/event-display";
import { escapeHtml, formatTimestamp } from "@/lib/telegram/format";
import type { Member, MonitoredRepo } from "@/lib/telegram/queries";

const DIVIDER = "━━━━━━━━━━━━━━━━";

export function guestWelcome(firstName?: string | null): string {
  const hello = firstName ? `Hi ${escapeHtml(firstName)}! 👋` : "Hi there! 👋";
  return [
    `${hello}`,
    "",
    "🛰 <b>Welcome to GitHub Monitor</b>",
    DIVIDER,
    "A self-hosted dashboard that watches your GitHub repositories — and this bot delivers everything to you <b>in real time</b>.",
    "",
    "<b>What you get:</b>",
    "🔨 Commits, ⭐ stars, 🍴 forks",
    "🔀 Pull requests, 🐛 issues, 💬 comments",
    "🚀 Releases, ⚙️ workflows, 📦 deployments",
    "👤 New followers",
    "",
    "<b>You're not connected yet.</b> Create an account on the website, link GitHub, then open <b>Settings → Telegram</b> and scan the QR code.",
    "",
    "Use the buttons below to get started 👇",
  ].join("\n");
}

export function howItWorks(): string {
  return [
    "ℹ️ <b>How it works</b>",
    DIVIDER,
    "<b>1.</b> Sign up on the website and connect your GitHub account.",
    "<b>2.</b> Choose which repositories to monitor and which event types matter.",
    "<b>3.</b> Open <b>Settings → Telegram</b>, scan the QR code (or tap the link) and press <b>Start</b> here.",
    "<b>4.</b> Every event is recorded on the dashboard <i>and</i> sent to this chat instantly.",
    "",
    "🔒 You can pause notifications or disconnect at any time — from the site or with /stop.",
  ].join("\n");
}

export function guestProfile(): string {
  return [
    "👤 <b>Profile</b>",
    DIVIDER,
    "🔴 <b>Status:</b> Not connected",
    "",
    "This chat isn't linked to a GitHub Monitor account yet. Sign in on the website, then link this chat from <b>Settings → Telegram</b>.",
  ].join("\n");
}

export function connectGithubMessage(): string {
  return [
    "🔗 <b>Connect GitHub</b>",
    DIVIDER,
    "Open the website to sign in and install the GitHub App on your account. After that, pick the repositories you want to monitor.",
    "",
    "👇 Tap the button below.",
  ].join("\n");
}

export function memberWelcome(member: Member): string {
  const name = member.name ? ` ${escapeHtml(member.name)}` : "";
  return [
    `👋 Welcome back${name}!`,
    "",
    "✅ This chat is connected. You'll receive every event from your monitored repositories right here.",
    "",
    "Use the menu below or type /help.",
  ].join("\n");
}

export function linkedSuccess(firstName?: string | null): string {
  const name = firstName ? ` ${escapeHtml(firstName)}` : "";
  return [
    `✅ <b>Connected!</b>`,
    DIVIDER,
    `Hi${name}, this chat is now linked to your GitHub Monitor account.`,
    "",
    "From now on you'll get a message here the moment something happens in your monitored repositories.",
    "",
    "📊 Try <b>Statistics</b> or <b>Recent activity</b> from the menu below.",
  ].join("\n");
}

export function memberProfile(
  member: Member,
  stats: DashboardStats
): string {
  const since = member.connectedAt ? member.connectedAt.toISOString().slice(0, 10) : "—";
  return [
    "👤 <b>Profile</b>",
    DIVIDER,
    `🟢 <b>Status:</b> Connected`,
    `🙍 <b>Name:</b> ${escapeHtml(member.name || "—")}`,
    `✉️ <b>Email:</b> ${escapeHtml(member.email)}`,
    member.githubLogin
      ? `🐙 <b>GitHub:</b> <a href="https://github.com/${encodeURIComponent(member.githubLogin)}">@${escapeHtml(member.githubLogin)}</a>`
      : "🐙 <b>GitHub:</b> not connected yet",
    `🔔 <b>Notifications:</b> ${member.notificationsEnabled ? "ON" : "OFF"}`,
    `📅 <b>Linked since:</b> ${since}`,
    "",
    "<b>Overview</b>",
    `📁 Repositories: ${stats.repositoriesCount}  ·  👁 Monitored: ${stats.monitoredCount}`,
    `⚡ Events today: ${stats.eventsTodayCount}  ·  🗂 Total: ${stats.totalEventsCount}`,
  ].join("\n");
}

const RANGE_LABEL = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days" } as const;

export function statsMessage(range: keyof typeof RANGE_LABEL, s: StatisticsCounts): string {
  const total = s.commits + s.stars + s.forks + s.pullRequests + s.issues + s.releases;
  return [
    `📊 <b>Statistics — ${RANGE_LABEL[range]}</b>`,
    DIVIDER,
    `🔨 Commits: <b>${s.commits}</b>`,
    `⭐ Stars: <b>${s.stars}</b>`,
    `🍴 Forks: <b>${s.forks}</b>`,
    `🔀 Pull requests: <b>${s.pullRequests}</b>`,
    `🐛 Issues: <b>${s.issues}</b>`,
    `🚀 Releases: <b>${s.releases}</b>`,
    DIVIDER,
    `Σ Total: <b>${total}</b>`,
  ].join("\n");
}

function activityLine(item: RecentActivityItem): string {
  const label = getEventDisplay(item.eventType, item.action).label;
  const actor = item.actorLogin ? ` · @${escapeHtml(item.actorLogin)}` : "";
  const repo = item.eventType === "follower" ? "" : ` — ${escapeHtml(item.repositoryName)}`;
  return `• <b>${escapeHtml(label)}</b>${repo}${actor}\n   <i>${formatTimestamp(item.createdAt)}</i>`;
}

export function activityMessage(items: RecentActivityItem[]): string {
  if (items.length === 0) {
    return "🕒 <b>Recent activity</b>\n" + DIVIDER + "\nNo events yet. They'll appear here as soon as something happens.";
  }
  return ["🕒 <b>Recent activity</b>", DIVIDER, ...items.map(activityLine)].join("\n");
}

export function reposMessage(repos: MonitoredRepo[]): string {
  if (repos.length === 0) {
    return "📁 <b>Monitored repositories</b>\n" + DIVIDER + "\nYou aren't monitoring any repository yet. Enable monitoring from the Repositories page on the website.";
  }
  return [
    `📁 <b>Monitored repositories</b> (${repos.length})`,
    DIVIDER,
    ...repos.map(
      (r) =>
        `${r.private ? "🔒" : "🌐"} <a href="https://github.com/${r.fullName}">${escapeHtml(r.fullName)}</a>  ·  ⭐ ${r.starsCount}  🍴 ${r.forksCount}`
    ),
  ].join("\n");
}

export function notificationsMessage(enabled: boolean): string {
  return [
    "🔔 <b>Notifications</b>",
    DIVIDER,
    `Currently: <b>${enabled ? "ON ✅" : "OFF ⏸"}</b>`,
    "",
    enabled
      ? "You receive every event from your monitored repositories."
      : "Events are still recorded on the dashboard, but nothing is sent here.",
  ].join("\n");
}

export function helpMessage(connected: boolean): string {
  return [
    "❓ <b>Help</b>",
    DIVIDER,
    "<b>Commands</b>",
    "/start — main menu",
    "/profile — your account",
    ...(connected
      ? [
          "/stats — event statistics",
          "/activity — latest events",
          "/repos — monitored repositories",
          "/notifications — pause / resume alerts",
        ]
      : ["/connect — how to connect GitHub"]),
    "/stop — disconnect this chat",
    "/help — this message",
  ].join("\n");
}

export const NOT_CONNECTED_HINT =
  "🔒 This feature needs a connected account. Open <b>Settings → Telegram</b> on the website to link this chat.";
