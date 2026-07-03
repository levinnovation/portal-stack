import pg from "pg";

// Idempotently add the `theme_preference` column that Payload's `themePreference`
// select field expects. Mirrors the existing `role` enum column (NOT NULL DEFAULT).
// ponytail: one-off schema sync because prod runs `next start` (no Drizzle push,
// no migrations). Replace with proper Payload migrations if schema drift recurs.
const c = new pg.Client({ connectionString: process.env.DATABASE_URI });
await c.connect();

await c.query(`DO $$ BEGIN
  CREATE TYPE enum_users_theme_preference AS ENUM ('system', 'light', 'dark');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

await c.query(
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference enum_users_theme_preference NOT NULL DEFAULT 'system'`,
);

const r = await c.query(
  "select column_name, is_nullable, column_default from information_schema.columns where table_name = 'users' and column_name = 'theme_preference'",
);
console.log("RESULT:", JSON.stringify(r.rows));

await c.end();
