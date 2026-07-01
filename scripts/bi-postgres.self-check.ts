import assert from "node:assert/strict";
import { Client } from "pg";

async function run() {
  const url = process.env.INTELIGENCIA_DB_URL;
  if (!url) {
    console.log("bi-postgres.self-check skipped (INTELIGENCIA_DB_URL not set)");
    return;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const count = await client.query(`
      select count(*)::int as total
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('core_metric_snapshots', 'core_campaign_snapshots', 'core_lead_snapshots')
    `);
    assert.ok((count.rows[0]?.total ?? 0) >= 1, "core BI snapshot tables are missing");

    const shape = await client.query(`
      select run_type, workspace_id
      from core_metric_snapshots
      order by snapshot_at desc
      limit 1
    `);
    assert.ok(shape.rows.length >= 0, "unable to query core_metric_snapshots");
    console.log("bi-postgres.self-check ok");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

