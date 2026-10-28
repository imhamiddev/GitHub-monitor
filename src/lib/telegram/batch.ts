import { getEventDisplay } from "@/lib/github/event-display";
import { DIVIDER, escapeHtml, formatTimestamp, type FormattedMessage, type TelegramEventInput } from "@/lib/telegram/format";
import { t, translateEventLabel, type Lang } from "@/lib/telegram/i18n";

const MAX_REPOS = 5;

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

function repoLines(events: TelegramEventInput[], lang: Lang): string[] {
  const lines: string[] = [];

  const pushes = events.filter((e) => e.eventType === "push");
  if (pushes.length > 0) {
    const commits = pushes.reduce((sum, e) => sum + (num(e.summary.commitCount) ?? 0), 0);
    const branches = [...new Set(pushes.map((e) => e.summary.branch).filter((b): b is string => typeof b === "string"))]
      .slice(0, 3)
      .map((b) => `<code>${escapeHtml(b)}</code>`)
      .join(", ");
    lines.push(t(lang, "batch.commits", { n: commits, branches: branches || "—" }));
  }

  const stars = events.filter((e) => e.eventType === "star" && e.action !== "deleted");
  if (stars.length > 0) {
    const total = [...stars].reverse().map((e) => num(e.summary.starsCount)).find((n) => n !== null) ?? "—";
    lines.push(t(lang, "batch.stars", { n: stars.length, total }));
  }

  const forks = events.filter((e) => e.eventType === "fork");
  if (forks.length > 0) lines.push(t(lang, "batch.forks", { n: forks.length }));

  const gained = events.filter((e) => e.eventType === "follower" && e.action !== "unfollowed");
  const lost = events.filter((e) => e.eventType === "follower" && e.action === "unfollowed");
  const lastFollowers = [...events].reverse().map((e) => num(e.summary.followersAfter)).find((n) => n !== null) ?? "—";
  if (gained.length > 0) lines.push(t(lang, "batch.followers", { n: gained.length, total: lastFollowers }));
  if (lost.length > 0) lines.push(t(lang, "batch.unfollowers", { n: lost.length, total: lastFollowers }));

  // Everything else: count per localized label.
  const handled = new Set(["push", "fork", "follower"]);
  const others = new Map<string, number>();
  for (const e of events) {
    if (handled.has(e.eventType) || (e.eventType === "star" && e.action !== "deleted")) continue;
    const base = e.eventType === "star" ? "Star Removed" : getEventDisplay(e.eventType, e.action).label;
    const label = translateEventLabel(lang, base);
    others.set(label, (others.get(label) ?? 0) + 1);
  }
  for (const [label, n] of others) lines.push(t(lang, "batch.other", { label: escapeHtml(label), n }));

  return lines;
}

/** One summary message for a burst of events (grouped by repository). */
export function formatBatchMessage(events: TelegramEventInput[], lang: Lang): FormattedMessage {
  const groups = new Map<string, TelegramEventInput[]>();
  for (const e of events) {
    const key = e.repositoryName ?? "";
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  const first = events[0].createdAt ?? new Date();
  const last = events[events.length - 1].createdAt ?? new Date();

  const lines = [t(lang, "batch.title", { n: events.length }), DIVIDER];
  for (const [repo, repoEvents] of ordered.slice(0, MAX_REPOS)) {
    if (repo) lines.push(`📁 <b>${escapeHtml(repo)}</b>`);
    lines.push(...repoLines(repoEvents, lang), "");
  }
  if (ordered.length > MAX_REPOS) {
    lines.push(t(lang, "batch.moreRepos", { n: ordered.length - MAX_REPOS }), "");
  }
  lines.push(`🕒 <i>${t(lang, "batch.range", { from: formatTimestamp(first, lang), to: formatTimestamp(last, lang) })}</i>`);

  return { text: lines.join("\n") };
}
