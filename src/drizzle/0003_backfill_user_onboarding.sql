-- Backfill: mark all pre-existing users as already onboarded, so this
-- feature doesn't retroactively force the setup wizard on accounts
-- created before it existed.
INSERT INTO "user_onboarding" ("user_id", "completed_at")
SELECT "id", now() FROM "user"
ON CONFLICT ("user_id") DO NOTHING;
