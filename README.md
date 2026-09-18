# GitHub Monitor

Track activity across your GitHub repositories — commits, stars, forks, pull
requests, issues, releases, deployments, and followers — in one dashboard,
with configurable per-repository notifications.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Auth | Better Auth (email/password) |
| Database | Vercel Postgres (Neon) + Drizzle ORM |
| GitHub integration | GitHub App (installation-based, not a plain OAuth App) |
| Follower tracking | Vercel Cron (hourly polling — GitHub has no "follow" webhook event) |
| Deployment | Vercel |

## Prerequisites

- Node.js 20+
- A Vercel account with a **Pro** plan (required for sub-daily Cron Jobs —
  the Hobby plan only allows once-daily crons, which isn't frequent enough
  for timely follower-change detection)
- A Vercel Postgres (Neon) database
- A GitHub App you control

## 1. Create the GitHub App

1. Go to GitHub Settings -> Developer settings -> GitHub Apps -> New GitHub App.
2. Homepage URL: your deployed app's URL (or http://localhost:3000 while testing).
3. Callback URL: https://<your-domain>/api/github/callback
4. Webhook URL: https://<your-domain>/api/webhooks/github
5. Webhook secret: generate one with `openssl rand -hex 32` and save it — you'll need it for GITHUB_WEBHOOK_SECRET.
6. Permissions (Repository):
   - Contents: Read-only
   - Metadata: Read-only
   - Pull requests: Read-only
   - Issues: Read-only
   - Actions: Read-only
   - Deployments: Read-only
7. Subscribe to events: push, star, fork, pull_request, pull_request_review, issues, issue_comment, release, create, delete, workflow_run, deployment, deployment_status, installation, installation_repositories.
8. Where can this GitHub App be installed?: Any account (or Only this account, if it's just for you).
9. Create the app, then:
   - Note the App ID and Client ID (top of the app's settings page).
   - Generate a Client secret.
   - Generate a Private key (downloads a .pem file) — you'll paste its contents into GITHUB_APP_PRIVATE_KEY.
   - Note the app's slug from its settings URL: github.com/settings/apps/<slug>

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in every value — each one is
documented inline in that file. In short, you'll need:

- DATABASE_URL — from your Vercel Postgres (Neon) integration
- BETTER_AUTH_SECRET, ENCRYPTION_KEY — random secrets (`openssl rand -base64 32`)
- GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET — from the GitHub App you created above
- CRON_SECRET — random secret Vercel uses to authenticate its own cron requests
- NEXT_PUBLIC_APP_URL, BETTER_AUTH_URL — your deployed URL (or http://localhost:3000 locally)

## 3. Install dependencies and run migrations

```bash
npm install
npx drizzle-kit push
```

This applies the schema in `src/lib/db/schema.ts` to your database.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Note that GitHub webhooks need a publicly
reachable URL — use a tunnel (e.g. `ngrok http 3000`) and update the GitHub
App's Webhook URL accordingly while testing locally.

## 5. Deploy to Vercel

1. Import this repository into Vercel.
2. Add all environment variables from `.env.example` in the Vercel project's
   Settings -> Environment Variables.
3. Set CRON_SECRET there too — Vercel automatically sends it as a Bearer
   token when invoking the scheduled route defined in `vercel.json`.
4. Upgrade the Vercel project to the Pro plan (required for the hourly cron
   schedule in `vercel.json`; on Hobby, Vercel will silently fall back to a
   once-daily run).
5. Deploy. Then update your GitHub App's Callback URL and Webhook URL to
   point at the production domain, if you haven't already.

## Project structure

```
src/
  app/                    Routes (App Router)
    (auth)/               Login, register - public
    (app)/                Dashboard, repositories, activity, notifications,
                           statistics, settings - session-protected
    api/
      auth/                Better Auth route handler
      github/              GitHub App connect/callback flow
      webhooks/github/     GitHub webhook receiver
      cron/followers/      Vercel Cron target for follower polling
  components/
    ui/                    shadcn/ui primitives
    <feature>/             Feature-specific components
  lib/
    auth/                  Better Auth config, session helper, validation
    db/                    Drizzle schema and connection
    github/                GitHub App client, webhook normalization, sync logic
    security/              Signature verification, encryption, CSRF state
    notifications/         Notification queries and settings
    activity/, dashboard/, statistics/   Page-specific data access
```

## Security notes

- GitHub webhook payloads are verified against X-Hub-Signature-256 using a
  timing-safe comparison before any processing occurs.
- Webhook deliveries are deduplicated via X-GitHub-Delivery (unique
  constraint), so retried deliveries never create duplicate events.
- Cached GitHub installation tokens are encrypted at rest (AES-256-GCM).
- The GitHub App installation flow is protected against CSRF with a signed,
  expiring state token bound to the initiating user's session.
- Every Server Action re-derives the session server-side and never trusts a
  user/repository id supplied by the client without an ownership check.
