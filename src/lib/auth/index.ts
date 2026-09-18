import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

/**
 * Better Auth handles ONLY platform identity (email/password login,
 * sessions, CSRF-safe cookies). It is intentionally separate from the
 * GitHub App connection (see lib/github/app.ts + githubInstallation
 * table) — a user can have a platform account without ever connecting
 * GitHub, and GitHub App installation tokens are managed independently
 * since they're short-lived and installation-scoped, not user-scoped.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // small team, can be tightened later
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  // Secure, httpOnly, SameSite cookies (Better Auth defaults already
  // set httpOnly + secure in production; sameSite=lax balances CSRF
  // protection with GitHub OAuth redirect flows).
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min — reduces DB round-trips per request
    },
  },

  // Persisted to the database (not in-memory): on Vercel's serverless
  // platform, each invocation can land on a different instance with
  // its own memory, so in-memory rate limiting would not actually
  // limit anything across requests. The rateLimit table in our schema
  // exists specifically for this.
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60, // seconds
    max: 10, // requests per window per IP+route
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
