/**
 * Runs ponytail self-checks (assert-based, no test framework).
 */
import { execSync } from "node:child_process";

const checks = [
  "src/lib/auth/cookie-name.self-check.ts",
  "src/lib/auth/portal-access.self-check.ts",
  "src/lib/ai/scoping.self-check.ts",
  "src/lib/ai/backend.self-check.ts",
  "src/lib/ai/fastapi-client.self-check.ts",
  "src/lib/tenant-collections.self-check.ts",
  "src/lib/tenant-registry.self-check.ts",
  "scripts/load-tenant-pages.self-check.ts",
  "src/lib/blocks/page-slug.self-check.ts",
  "src/lib/blocks/normalize-layout.self-check.ts",
  "src/lib/datasets/parse-inline.self-check.ts",
  "src/lib/integrations/credentials.self-check.ts",
  "scripts/nav-slugs.self-check.ts",
];

for (const file of checks) {
  execSync(`tsx ${file}`, { stdio: "inherit" });
}

console.log("[self-check] all ok");
