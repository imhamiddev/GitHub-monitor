import { randomUUID } from "crypto";

import { db } from "@/lib/db";
import { telegramMilestone } from "@/lib/db/schema";
import { getInstallationByGithubId } from "@/lib/github/installations";
import { escapeHtml, DIVIDER } from "@/lib/telegram/format";
import { t } from "@/lib/telegram/i18n";
import { fixConnectionButtons, websiteButtons } from "@/lib/telegram/keyboards";
import { notifyUserText } from "@/lib/telegram/notify";

export type HealthIssue =
  | { kind: "suspended" }
  | { kind: "deleted" }
  | { kind: "unsuspended" }
  | { kind: "reposRemoved"; names: string[] }
  | { kind: "unreachable" };

/** Tells the owner of a user's chats that their GitHub connection needs attention. */
export async function alertConnectionIssue(userId: string, issue: HealthIssue) {
  await notifyUserText(userId, (lang) => {
    let body: string;
    switch (issue.kind) {
      case "suspended":
        body = t(lang, "health.suspended");
        break;
      case "deleted":
        body = t(lang, "health.deleted");
        break;
      case "unsuspended":
        body = t(lang, "health.unsuspended");
        break;
      case "reposRemoved": {
        const shown = issue.names.slice(0, 5).map((n) => `<code>${escapeHtml(n)}</code>`).join(", ");
        const extra = issue.names.length > 5 ? ` (+${issue.names.length - 5})` : "";
        body = t(lang, "health.reposRemoved", { n: issue.names.length, names: shown + extra });
        break;
      }
      case "unreachable":
        body = t(lang, "health.unreachable");
        break;
    }
    return {
      text: [t(lang, "health.title"), DIVIDER, body].join("\n"),
      buttons: issue.kind === "unsuspended" ? websiteButtons(lang) : fixConnectionButtons(lang),
    };
  });
}

/** Same as above but addressed by GitHub's numeric installation id (webhook payloads). */
export async function alertByInstallationId(githubInstallationId: number, issue: HealthIssue) {
  const installation = await getInstallationByGithubId(githubInstallationId);
  if (installation) await alertConnectionIssue(installation.userId, issue);
}

/**
 * Like alertConnectionIssue, but at most once per UTC day per user — used by
 * the cron so a persistent outage doesn't produce a message every run.
 */
export async function alertUnreachableOncePerDay(userId: string) {
  const key = `health:unreachable:${new Date().toISOString().slice(0, 10)}`;
  const inserted = await db
    .insert(telegramMilestone)
    .values({ id: randomUUID(), userId, key })
    .onConflictDoNothing()
    .returning({ id: telegramMilestone.id });
  if (inserted.length > 0) await alertConnectionIssue(userId, { kind: "unreachable" });
}
