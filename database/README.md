# 🗄️ Database

The database is **PostgreSQL (Neon)**, accessed through **Drizzle ORM**.

| What | Where |
|------|-------|
| Tables / columns (source of truth) | [`src/lib/db/schema.ts`](../src/lib/db/schema.ts) |
| Migration files (SQL, applied in order) | [`src/drizzle/`](../src/drizzle) |
| DB connection | [`src/lib/db/index.ts`](../src/lib/db/index.ts) |
| Drizzle config | [`drizzle.config.ts`](../drizzle.config.ts) |
| All SQL in a single file (for reading / manual import) | [`database/full-schema.sql`](./full-schema.sql) |

## Tables

- **Auth:** `user`, `session`, `account`, `verification`, `rate_limit`
- **GitHub:** `github_installation`, `repository`, `repository_event_setting`, `github_event`, `follower_snapshot`, `webhook_delivery`
- **App state:** `user_onboarding`
- **Telegram:** `telegram_connection`, `telegram_chat_pref`, `telegram_group`, `telegram_milestone`, `telegram_outbox`

## Commands

```bash
npm run db:generate   # create a new migration after editing schema.ts
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:export     # regenerate database/full-schema.sql from migrations
npm run db:studio     # browse data in Drizzle Studio
```

> `src/drizzle/` and `schema.ts` must stay where they are — Drizzle and the app import from there.
> `database/full-schema.sql` is a generated reference copy; regenerate it with `npm run db:export` after adding a migration.
