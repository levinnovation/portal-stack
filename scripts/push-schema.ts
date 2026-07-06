/**
 * One-off: initialize Payload so the Postgres adapter's dev `push` creates any
 * missing tables for the current code's collections. Run against a dev DB to
 * materialize new-collection DDL (e.g. creative_assets) that can then be copied
 * to environments where push does not run (production).
 */
import { getPayload } from "payload";
import config from "@/payload.config";

const p = await getPayload({ config });
console.log("schema push complete for tenant", process.env.TENANT_ID);
// give push a tick to flush, then exit
await new Promise((r) => setTimeout(r, 500));
process.exit(0);
