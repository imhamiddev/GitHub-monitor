import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Better Auth core tables                                           */
/*  (names/shapes follow Better Auth's expected schema so the         */
/*  Drizzle adapter can be used directly)                             */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// OAuth / credential accounts (Better Auth "account" table).
// GitHub App connections are tracked separately in githubInstallation,
// this table only stores Better Auth's own login credentials/providers.
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"), // hashed, never plaintext
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Rate limiting table used by Better Auth's built-in rate limiter
// (persisted to survive across serverless invocations).
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull().default(0),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/*  GitHub App connection                                             */
/* ------------------------------------------------------------------ */

// One row per GitHub App installation connected by a user.
// installationId is what we use for server-to-server API calls
// (installation access tokens), independent of any user OAuth token.
export const githubInstallation = pgTable(
  "github_installation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    installationId: bigint("installation_id", { mode: "number" }).notNull(),
    githubAccountId: bigint("github_account_id", { mode: "number" }).notNull(),
    githubAccountLogin: text("github_account_login").notNull(),
    githubAccountType: text("github_account_type").notNull(), // "User" | "Organization"
    // Encrypted at rest (see lib/security/crypto.ts). Short-lived (~1h),
    // refreshed on demand — stored only as a small optimization/cache.
    encryptedAccessToken: text("encrypted_access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    status: text("status").notNull().default("active"), // active | suspended | revoked
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("github_installation_installation_id_idx").on(t.installationId),
    index("github_installation_user_id_idx").on(t.userId),
  ]
);

/* ------------------------------------------------------------------ */
/*  Repositories                                                      */
/* ------------------------------------------------------------------ */

export const repository = pgTable(
  "repository",
  {
    id: text("id").primaryKey(),
    installationId: text("installation_id")
      .notNull()
      .references(() => githubInstallation.id, { onDelete: "cascade" }),
    githubRepoId: bigint("github_repo_id", { mode: "number" }).notNull(),
    fullName: text("full_name").notNull(), // e.g. "owner/repo"
    name: text("name").notNull(),
    ownerLogin: text("owner_login").notNull(),
    description: text("description"),
    private: boolean("private").notNull().default(false),
    defaultBranch: text("default_branch").notNull().default("main"),
    starsCount: integer("stars_count").notNull().default(0),
    forksCount: integer("forks_count").notNull().default(0),
    openIssuesCount: integer("open_issues_count").notNull().default(0),
    watchersCount: integer("watchers_count").notNull().default(0),
    isMonitored: boolean("is_monitored").notNull().default(false),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("repository_github_repo_id_idx").on(t.githubRepoId),
    index("repository_installation_id_idx").on(t.installationId),
  ]
);

// One row per (repository, event type) — toggles whether that event
// type is tracked (stored and shown) for that repository's activity feed.
export const repositoryEventSetting = pgTable(
  "repository_event_setting",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // see lib/github/events.ts EVENT_TYPES
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [
    uniqueIndex("repo_event_setting_unique_idx").on(t.repositoryId, t.eventType),
  ]
);

/* ------------------------------------------------------------------ */
/*  Events (normalized, from webhooks)                                */
/* ------------------------------------------------------------------ */

export const githubEvent = pgTable(
  "github_event",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    // GitHub's X-GitHub-Delivery header — guarantees idempotency even
    // across retried webhook deliveries.
    githubDeliveryId: text("github_delivery_id").notNull(),
    eventType: text("event_type").notNull(),
    action: text("action"), // e.g. "opened", "closed", "merged"
    actorLogin: text("actor_login"),
    actorAvatarUrl: text("actor_avatar_url"),
    // Normalized, display-ready summary — NOT the raw GitHub payload.
    summary: jsonb("summary").$type<Record<string, unknown>>().notNull(),
    url: text("url"), // link to view on GitHub
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("github_event_delivery_id_idx").on(t.githubDeliveryId),
    index("github_event_repository_id_idx").on(t.repositoryId),
    index("github_event_created_at_idx").on(t.createdAt),
  ]
);

/* ------------------------------------------------------------------ */
/*  Follower snapshots (polled via Vercel Cron — GitHub has no        */
/*  "follow" webhook event)                                           */
/* ------------------------------------------------------------------ */

export const followerSnapshot = pgTable(
  "follower_snapshot",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    githubLogin: text("github_login").notNull(),
    capturedAt: timestamp("captured_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("follower_snapshot_unique_idx").on(t.userId, t.githubLogin)]
);

/* ------------------------------------------------------------------ */
/*  Webhook delivery log (defense-in-depth idempotency +              */
/*  short-lived debugging aid — cleaned up by retention job)          */
/* ------------------------------------------------------------------ */

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id").primaryKey(),
    githubDeliveryId: text("github_delivery_id").notNull(),
    eventType: text("event_type").notNull(),
    processedAt: timestamp("processed_at").notNull().defaultNow(),
    // Raw payload kept only briefly for debugging; purged by a
    // retention cron (see lib/db/retention.ts).
    rawPayload: jsonb("raw_payload"),
  },
  (t) => [uniqueIndex("webhook_delivery_delivery_id_idx").on(t.githubDeliveryId)]
);

/* ------------------------------------------------------------------ */
/*  Onboarding state — tracks whether a user has been shown/completed */
/*  the post-signup setup wizard, so it only appears once.            */
/* ------------------------------------------------------------------ */

export const userOnboarding = pgTable("user_onboarding", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Telegram bot connection — one row per user. A row is created when */
/*  the user generates a link; chatId stays null until they open the  */
/*  bot via the deep link and the bot webhook confirms the token.     */
/* ------------------------------------------------------------------ */

export const telegramConnection = pgTable(
  "telegram_connection",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    // SHA-256 of the one-time deep-link token (never store it raw).
    linkTokenHash: text("link_token_hash"),
    linkTokenExpiresAt: timestamp("link_token_expires_at"),
    // Telegram private-chat id; null while the link is still pending.
    chatId: text("chat_id"),
    telegramUsername: text("telegram_username"),
    telegramFirstName: text("telegram_first_name"),
    notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
    connectedAt: timestamp("connected_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("telegram_connection_link_token_idx").on(t.linkTokenHash),
    uniqueIndex("telegram_connection_chat_id_idx").on(t.chatId),
  ]
);

/* ------------------------------------------------------------------ */
/*  Telegram extras                                                   */
/* ------------------------------------------------------------------ */

// Per-chat bot preferences (private chats, groups and guests alike).
export const telegramChatPref = pgTable("telegram_chat_pref", {
  chatId: text("chat_id").primaryKey(),
  language: text("language").notNull().default("en"), // "en" | "fa"
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Extra destinations (groups / channels) a user wants notifications in.
export const telegramGroup = pgTable(
  "telegram_group",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: text("chat_id").notNull(),
    chatType: text("chat_type").notNull(), // group | supergroup | channel
    title: text("title"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("telegram_group_chat_id_idx").on(t.chatId),
    index("telegram_group_user_id_idx").on(t.userId),
  ]
);

// Milestones already celebrated (e.g. "stars:owner/repo:100") so each
// one is announced only once.
export const telegramMilestone = pgTable(
  "telegram_milestone",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    reachedAt: timestamp("reached_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("telegram_milestone_user_key_idx").on(t.userId, t.key)]
);

// Short-lived queue used to merge bursts of events into one message.
// Rows are claimed atomically (claimed_at) by whichever invocation
// flushes first, and purged after a day.
export const telegramOutbox = pgTable(
  "telegram_outbox",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    repositoryName: text("repository_name"),
    eventType: text("event_type").notNull(),
    action: text("action"),
    actorLogin: text("actor_login"),
    summary: jsonb("summary").$type<Record<string, unknown>>().notNull(),
    url: text("url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    claimedAt: timestamp("claimed_at"),
  },
  (t) => [index("telegram_outbox_user_claimed_idx").on(t.userId, t.claimedAt)]
);

/* ------------------------------------------------------------------ */
/*  Alert rules — "tell me when X happens N times within M minutes"   */
/* ------------------------------------------------------------------ */

export const alertRule = pgTable(
  "alert_rule",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // null = applies to every repository of the user.
    repositoryId: text("repository_id").references(() => repository.id, { onDelete: "cascade" }),
    // GitHub event type to count ("workflow_run", "issues", …) or "any".
    eventType: text("event_type").notNull(),
    // Optional action filter ("failure", "opened", …); null = any action.
    action: text("action"),
    threshold: integer("threshold").notNull().default(1),
    windowMinutes: integer("window_minutes").notNull().default(60),
    // Minimum gap between two notifications of the same rule.
    cooldownMinutes: integer("cooldown_minutes").notNull().default(60),
    enabled: boolean("enabled").notNull().default(true),
    lastTriggeredAt: timestamp("last_triggered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("alert_rule_user_id_idx").on(t.userId)]
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  githubInstallations: many(githubInstallation),
}));

export const githubInstallationRelations = relations(
  githubInstallation,
  ({ one, many }) => ({
    user: one(user, {
      fields: [githubInstallation.userId],
      references: [user.id],
    }),
    repositories: many(repository),
  })
);

export const repositoryRelations = relations(repository, ({ one, many }) => ({
  installation: one(githubInstallation, {
    fields: [repository.installationId],
    references: [githubInstallation.id],
  }),
  eventSettings: many(repositoryEventSetting),
  events: many(githubEvent),
}));

export const githubEventRelations = relations(githubEvent, ({ one }) => ({
  repository: one(repository, {
    fields: [githubEvent.repositoryId],
    references: [repository.id],
  }),
}));
