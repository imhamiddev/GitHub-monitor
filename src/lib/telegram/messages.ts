import type { StatisticsCounts } from "@/lib/statistics/counts";
import type { DashboardStats, RecentActivityItem } from "@/lib/dashboard/stats";
import { getEventDisplay } from "@/lib/github/event-display";
import { escapeHtml, formatTimestamp, DIVIDER } from "@/lib/telegram/format";
import { t, translateEventLabel, type Lang } from "@/lib/telegram/i18n";
import type { Member, MonitoredRepo, TopActor, TopRepo } from "@/lib/telegram/queries";

const join = (lines: string[]) => lines.join("\n");

export function guestWelcome(lang: Lang, firstName?: string | null): string {
  return join([
    firstName ? t(lang, "hello.named", { name: escapeHtml(firstName) }) : t(lang, "hello.anon"),
    "",
    t(lang, "guest.title"),
    DIVIDER,
    t(lang, "guest.intro"),
    "",
    t(lang, "guest.whatYouGet"),
    t(lang, "guest.l1"),
    t(lang, "guest.l2"),
    t(lang, "guest.l3"),
    t(lang, "guest.l4"),
    "",
    t(lang, "guest.notConnected"),
    "",
    t(lang, "guest.cta"),
  ]);
}

export function howItWorks(lang: Lang): string {
  return join([
    t(lang, "how.title"),
    DIVIDER,
    t(lang, "how.s1"),
    t(lang, "how.s2"),
    t(lang, "how.s3"),
    t(lang, "how.s4"),
    "",
    t(lang, "how.foot"),
  ]);
}

export function guestProfile(lang: Lang): string {
  return join([
    t(lang, "guestProfile.title"),
    DIVIDER,
    t(lang, "guestProfile.status"),
    "",
    t(lang, "guestProfile.body"),
  ]);
}

export function connectGithubMessage(lang: Lang): string {
  return join([t(lang, "connect.title"), DIVIDER, t(lang, "connect.body"), "", t(lang, "connect.tap")]);
}

export function memberWelcome(lang: Lang, member: Member): string {
  const name = member.name ? ` ${escapeHtml(member.name)}` : "";
  return join([
    t(lang, "member.welcomeBack", { name }),
    "",
    t(lang, "member.connected"),
    "",
    t(lang, "member.useMenu"),
  ]);
}

export function linkedSuccess(lang: Lang, firstName?: string | null): string {
  const name = firstName ? ` ${escapeHtml(firstName)}` : "";
  return join([
    t(lang, "linked.title"),
    DIVIDER,
    t(lang, "linked.body", { name }),
    "",
    t(lang, "linked.foot"),
    "",
    t(lang, "linked.try"),
  ]);
}

export function memberProfile(
  lang: Lang,
  member: Member,
  stats: DashboardStats,
  groupCount: number
): string {
  const since = member.connectedAt ? member.connectedAt.toISOString().slice(0, 10) : "—";
  const github = member.githubLogin
    ? `<a href="https://github.com/${encodeURIComponent(member.githubLogin)}">@${escapeHtml(member.githubLogin)}</a>`
    : t(lang, "profile.githubNone");
  return join([
    t(lang, "profile.title"),
    DIVIDER,
    t(lang, "profile.status"),
    t(lang, "profile.name", { v: escapeHtml(member.name || "—") }),
    t(lang, "profile.email", { v: escapeHtml(member.email) }),
    t(lang, "profile.github", { v: github }),
    t(lang, "profile.notifications", { v: t(lang, member.notificationsEnabled ? "on" : "off") }),
    t(lang, "profile.since", { v: since }),
    ...(groupCount > 0 ? [t(lang, "profile.groups", { v: groupCount })] : []),
    "",
    t(lang, "profile.overview"),
    t(lang, "profile.repos", { a: stats.repositoriesCount, b: stats.monitoredCount }),
    t(lang, "profile.events", { a: stats.eventsTodayCount, b: stats.totalEventsCount }),
  ]);
}

export type StatsRange = "today" | "7d" | "30d";

export function statsMessage(lang: Lang, range: StatsRange, s: StatisticsCounts): string {
  const total = s.commits + s.stars + s.forks + s.pullRequests + s.issues + s.releases;
  return join([
    t(lang, "stats.title", { range: t(lang, `stats.${range}`) }),
    DIVIDER,
    t(lang, "stats.commits", { n: s.commits }),
    t(lang, "stats.stars", { n: s.stars }),
    t(lang, "stats.forks", { n: s.forks }),
    t(lang, "stats.prs", { n: s.pullRequests }),
    t(lang, "stats.issues", { n: s.issues }),
    t(lang, "stats.releases", { n: s.releases }),
    DIVIDER,
    t(lang, "stats.total", { n: total }),
  ]);
}

function activityLine(lang: Lang, item: RecentActivityItem): string {
  const label = translateEventLabel(lang, getEventDisplay(item.eventType, item.action).label);
  const actor = item.actorLogin ? ` · @${escapeHtml(item.actorLogin)}` : "";
  const repo = item.eventType === "follower" ? "" : ` — ${escapeHtml(item.repositoryName)}`;
  return `• <b>${escapeHtml(label)}</b>${repo}${actor}\n   <i>${formatTimestamp(item.createdAt, lang)}</i>`;
}

export function activityMessage(lang: Lang, items: RecentActivityItem[]): string {
  if (items.length === 0) {
    return join([t(lang, "activity.title"), DIVIDER, t(lang, "activity.empty")]);
  }
  return join([t(lang, "activity.title"), DIVIDER, ...items.map((i) => activityLine(lang, i))]);
}

export function reposMessage(lang: Lang, repos: MonitoredRepo[]): string {
  if (repos.length === 0) {
    return join([t(lang, "repos.title", { n: 0 }), DIVIDER, t(lang, "repos.empty")]);
  }
  return join([
    t(lang, "repos.title", { n: repos.length }),
    DIVIDER,
    ...repos.map(
      (r) =>
        `${r.private ? "🔒" : "🌐"} <a href="https://github.com/${r.fullName}">${escapeHtml(r.fullName)}</a>  ·  ⭐ ${r.starsCount}  🍴 ${r.forksCount}`
    ),
  ]);
}

const MEDALS = ["🥇", "🥈", "🥉"];
const rank = (i: number) => MEDALS[i] ?? `${i + 1}.`;

export function topMessage(
  lang: Lang,
  data: { starred: MonitoredRepo[]; activeRepos: TopRepo[]; actors: TopActor[] }
): string {
  const empty = data.starred.length === 0 && data.activeRepos.length === 0 && data.actors.length === 0;
  if (empty) return join([t(lang, "top.title"), DIVIDER, t(lang, "top.empty")]);

  const blocks: string[] = [t(lang, "top.title"), DIVIDER];
  if (data.starred.length > 0) {
    blocks.push(
      t(lang, "top.repos"),
      ...data.starred.map((r, i) => `${rank(i)} ${escapeHtml(r.fullName)} — ⭐ ${r.starsCount}`),
      ""
    );
  }
  if (data.activeRepos.length > 0) {
    blocks.push(
      t(lang, "top.active"),
      ...data.activeRepos.map(
        (r, i) => `${rank(i)} ${escapeHtml(r.fullName)} — ${t(lang, "top.events", { n: r.events })}`
      ),
      ""
    );
  }
  if (data.actors.length > 0) {
    blocks.push(
      t(lang, "top.actors"),
      ...data.actors.map(
        (a, i) =>
          `${rank(i)} <a href="https://github.com/${encodeURIComponent(a.login)}">@${escapeHtml(a.login)}</a> — ${t(lang, "top.events", { n: a.events })}`
      )
    );
  }
  return join(blocks).trimEnd();
}

export function notificationsMessage(lang: Lang, enabled: boolean): string {
  return join([
    t(lang, "notif.title"),
    DIVIDER,
    t(lang, "notif.current", { v: `${t(lang, enabled ? "on" : "off")} ${enabled ? "✅" : "⏸"}` }),
    "",
    t(lang, enabled ? "notif.onText" : "notif.offText"),
  ]);
}

export function helpMessage(lang: Lang, connected: boolean): string {
  return join([
    t(lang, "help.title"),
    DIVIDER,
    t(lang, "help.commands"),
    t(lang, "help.start"),
    t(lang, "help.profile"),
    ...(connected
      ? [
          t(lang, "help.stats"),
          t(lang, "help.activity"),
          t(lang, "help.repos"),
          t(lang, "help.top"),
          t(lang, "help.notifications"),
        ]
      : [t(lang, "help.connect")]),
    t(lang, "help.language"),
    t(lang, "help.stop"),
    t(lang, "help.help"),
  ]);
}

export function languageMessage(lang: Lang): string {
  return join([t(lang, "lang.title"), DIVIDER, t(lang, "lang.body")]);
}
