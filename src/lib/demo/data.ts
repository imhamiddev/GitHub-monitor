// Static, hand-crafted data for the public /demo route. Nothing here
// touches the database — this lets anyone see the product without an
// account, a GitHub connection, or any real data.

export type DemoRepo = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  starsCount: number;
  forksCount: number;
  isMonitored: boolean;
};

export const DEMO_REPOS: DemoRepo[] = [
  {
    id: "demo-1",
    name: "acme-api",
    fullName: "acme/acme-api",
    description: "Core REST API powering the Acme platform",
    private: false,
    starsCount: 342,
    forksCount: 41,
    isMonitored: true,
  },
  {
    id: "demo-2",
    name: "design-system",
    fullName: "acme/design-system",
    description: "Shared component library and design tokens",
    private: false,
    starsCount: 128,
    forksCount: 19,
    isMonitored: true,
  },
  {
    id: "demo-3",
    name: "mobile-app",
    fullName: "acme/mobile-app",
    description: "React Native app for iOS and Android",
    private: true,
    starsCount: 0,
    forksCount: 3,
    isMonitored: true,
  },
  {
    id: "demo-4",
    name: "docs",
    fullName: "acme/docs",
    description: "Public documentation site",
    private: false,
    starsCount: 56,
    forksCount: 12,
    isMonitored: false,
  },
];

export type DemoActivityItem = {
  id: string;
  eventType: string;
  action: string | null;
  actorLogin: string;
  summary: Record<string, unknown>;
  repositoryName: string;
  minutesAgo: number;
};

export const DEMO_ACTIVITY: DemoActivityItem[] = [
  {
    id: "e1",
    eventType: "pull_request",
    action: "opened",
    actorLogin: "jsmith",
    summary: { kind: "pull_request", number: 482, title: "Add rate limiting to auth endpoints" },
    repositoryName: "acme/acme-api",
    minutesAgo: 4,
  },
  {
    id: "e2",
    eventType: "star",
    action: null,
    actorLogin: "devrel_kate",
    summary: { kind: "star", starsCount: 342 },
    repositoryName: "acme/acme-api",
    minutesAgo: 18,
  },
  {
    id: "e3",
    eventType: "push",
    action: null,
    actorLogin: "mchen",
    summary: { kind: "push", branch: "main", commitCount: 3 },
    repositoryName: "acme/design-system",
    minutesAgo: 32,
  },
  {
    id: "e4",
    eventType: "issues",
    action: "opened",
    actorLogin: "priya-r",
    summary: { kind: "issue", number: 118, title: "Dark mode toggle flickers on Safari" },
    repositoryName: "acme/mobile-app",
    minutesAgo: 51,
  },
  {
    id: "e5",
    eventType: "release",
    action: "published",
    actorLogin: "jsmith",
    summary: { kind: "release", tagName: "v2.4.0", name: "v2.4.0 — Rate limiting & bugfixes" },
    repositoryName: "acme/acme-api",
    minutesAgo: 95,
  },
  {
    id: "e6",
    eventType: "fork",
    action: null,
    actorLogin: "oss_contributor",
    summary: { kind: "fork" },
    repositoryName: "acme/design-system",
    minutesAgo: 140,
  },
  {
    id: "e7",
    eventType: "workflow_run",
    action: "success",
    actorLogin: "github-actions",
    summary: { kind: "workflow_run", workflowName: "CI", status: "success" },
    repositoryName: "acme/acme-api",
    minutesAgo: 180,
  },
  {
    id: "e8",
    eventType: "follower",
    action: "followed",
    actorLogin: "new_follower_42",
    summary: { kind: "follower", followersBefore: 127, followersAfter: 128 },
    repositoryName: "acme/acme-api",
    minutesAgo: 210,
  },
];

export const DEMO_STATS = {
  repositoriesCount: DEMO_REPOS.length,
  monitoredCount: DEMO_REPOS.filter((r) => r.isMonitored).length,
  eventsTodayCount: DEMO_ACTIVITY.length,
  totalEventsCount: 1847,
};

export const DEMO_STATISTICS_COUNTS = {
  commits: 214,
  stars: 38,
  forks: 12,
  pullRequests: 27,
  issues: 19,
  releases: 4,
};

// 30 days of gently varying daily counts for the trend chart.
export const DEMO_DAILY_COUNTS: { date: string; count: number }[] = Array.from(
  { length: 30 },
  (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (29 - i));
    // Deterministic pseudo-variation so the chart looks organic without
    // being random (keeps the demo visually consistent between loads).
    const base = 8 + Math.round(6 * Math.sin(i / 3.5));
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6 ? -4 : 0;
    return {
      date: date.toISOString().slice(0, 10),
      count: Math.max(0, base + weekend),
    };
  }
);
