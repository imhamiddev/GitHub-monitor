/**
 * Canonical list of monitorable event categories, matching the toggles
 * in repositoryEventSetting. Each category may map to one or more raw
 * GitHub webhook event names (see WEBHOOK_EVENT_TO_CATEGORY below).
 */
export const EVENT_CATEGORIES = [
  "push",
  "star",
  "fork",
  "pull_request",
  "issue",
  "issue_comment",
  "release",
  "branch_change", // create/delete of branches & tags
  "workflow_run",
  "deployment",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  push: "Commits",
  star: "Stars",
  fork: "Forks",
  pull_request: "Pull Requests",
  issue: "Issues",
  issue_comment: "Issue Comments",
  release: "Releases",
  branch_change: "Branch Changes",
  workflow_run: "GitHub Actions",
  deployment: "Deployments",
};

/**
 * Maps a raw GitHub webhook event name (the X-GitHub-Event header) to
 * our internal event category, used to look up whether the repository
 * is tracking that category of event.
 */
export const WEBHOOK_EVENT_TO_CATEGORY: Record<string, EventCategory> = {
  push: "push",
  star: "star",
  fork: "fork",
  pull_request: "pull_request",
  pull_request_review: "pull_request",
  issues: "issue",
  issue_comment: "issue_comment",
  release: "release",
  create: "branch_change",
  delete: "branch_change",
  workflow_run: "workflow_run",
  deployment: "deployment",
  deployment_status: "deployment",
};

/**
 * All raw GitHub webhook event names this app subscribes to /
 * understands. Anything else received is safely ignored.
 */
export const SUPPORTED_WEBHOOK_EVENTS = Object.keys(WEBHOOK_EVENT_TO_CATEGORY);
