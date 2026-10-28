/** Ready-made alert rules offered in the UI (users can still tweak every field). */
export type AlertPreset = {
  id: string;
  label: string;
  description: string;
  eventType: string;
  action: string | null;
  threshold: number;
  windowMinutes: number;
};

export const ALERT_PRESETS: AlertPreset[] = [
  {
    id: "workflow-failed",
    label: "Workflow failed",
    description: "A GitHub Actions workflow run fails.",
    eventType: "workflow_run",
    action: "failure",
    threshold: 1,
    windowMinutes: 60,
  },
  {
    id: "deployment-failed",
    label: "Deployment failed",
    description: "A deployment finishes with a failure.",
    eventType: "deployment_status",
    action: "failure",
    threshold: 1,
    windowMinutes: 60,
  },
  {
    id: "issue-spike",
    label: "Issue spike",
    description: "5 or more issues are opened within an hour.",
    eventType: "issues",
    action: "opened",
    threshold: 5,
    windowMinutes: 60,
  },
  {
    id: "star-burst",
    label: "Star burst",
    description: "10 or more new stars within an hour.",
    eventType: "star",
    action: "created",
    threshold: 10,
    windowMinutes: 60,
  },
  {
    id: "new-release",
    label: "New release",
    description: "A release is published.",
    eventType: "release",
    action: null,
    threshold: 1,
    windowMinutes: 60,
  },
  {
    id: "activity-surge",
    label: "Activity surge",
    description: "30 or more events of any kind within 30 minutes.",
    eventType: "any",
    action: null,
    threshold: 30,
    windowMinutes: 30,
  },
];

/** Event types the rule form lets the user pick from. */
export const ALERT_EVENT_TYPES: { value: string; label: string }[] = [
  { value: "any", label: "Any event" },
  { value: "push", label: "Push (commits)" },
  { value: "star", label: "Star" },
  { value: "fork", label: "Fork" },
  { value: "pull_request", label: "Pull request" },
  { value: "pull_request_review", label: "Pull request review" },
  { value: "issues", label: "Issue" },
  { value: "issue_comment", label: "Issue comment" },
  { value: "release", label: "Release" },
  { value: "workflow_run", label: "Workflow run" },
  { value: "deployment_status", label: "Deployment" },
  { value: "create", label: "Branch / tag created" },
  { value: "delete", label: "Branch / tag deleted" },
];

export const ALERT_LIMITS = {
  maxRulesPerUser: 20,
  threshold: { min: 1, max: 1000 },
  windowMinutes: { min: 1, max: 1440 },
  cooldownMinutes: { min: 1, max: 1440 },
} as const;
