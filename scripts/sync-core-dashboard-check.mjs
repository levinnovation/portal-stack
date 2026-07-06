#!/usr/bin/env node
/**
 * ponytail: parity check vs local core-dashboard clone (feat/inteligencia-ventas-bi).
 * Run: node scripts/sync-core-dashboard-check.mjs
 * Requires: /Users/soporte/projects/core-dashboard checked out on feat/inteligencia-ventas-bi
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CD = process.env.CORE_DASHBOARD_DIR || "/Users/soporte/projects/core-dashboard";

/** @type {Array<{ cd: string; ps: string | string[]; optional?: boolean }>} */
const MAP = [
  // Leah / Qara / Overview
  { cd: "app/overview/page.tsx", ps: "tenants/core/screens/agents-overview.tsx" },
  { cd: "app/leah/page.tsx", ps: "tenants/core/screens/leah-dashboard.tsx" },
  { cd: "app/leah/contratos/page.tsx", ps: "tenants/core/screens/leah-contratos.tsx" },
  { cd: "app/qara/page.tsx", ps: "tenants/core/screens/qara-dashboard.tsx" },
  { cd: "app/qara/control/page.tsx", ps: "tenants/core/screens/qara-control.tsx" },
  // Inteligencia screens
  { cd: "app/inteligencia/page.tsx", ps: "tenants/core/screens/inteligencia-comando.tsx" },
  { cd: "app/inteligencia/segmentos/page.tsx", ps: "tenants/core/screens/inteligencia-segmentos.tsx" },
  { cd: "app/inteligencia/equipo/page.tsx", ps: "tenants/core/screens/inteligencia-equipo.tsx" },
  { cd: "app/inteligencia/pauta/page.tsx", ps: "tenants/core/screens/inteligencia-pauta.tsx" },
  { cd: "app/inteligencia/predicciones/page.tsx", ps: "tenants/core/screens/inteligencia-predicciones.tsx" },
  { cd: "app/inteligencia/diagnostico/page.tsx", ps: "tenants/core/screens/inteligencia-diagnostico.tsx" },
  { cd: "app/inteligencia/experimentos/page.tsx", ps: "tenants/core/screens/inteligencia-experimentos.tsx" },
  { cd: "app/inteligencia/reportes/page.tsx", ps: "tenants/core/screens/inteligencia-reportes.tsx" },
  { cd: "app/inteligencia/error.tsx", ps: "src/app/(frontend)/portal/admin/agents/inteligencia/error.tsx" },
  // Sources
  { cd: "lib/sources/quickbase.ts", ps: "tenants/core/sources/quickbase.ts" },
  { cd: "lib/sources/hubspot.ts", ps: "tenants/core/sources/hubspot.ts" },
  { cd: "lib/sources/qara.ts", ps: "tenants/core/sources/qara.ts" },
  { cd: "lib/sources/langfuse.ts", ps: "tenants/core/sources/langfuse.ts" },
  { cd: "lib/sources/inteligencia.ts", ps: "tenants/core/sources/inteligencia.ts" },
  // APIs
  { cd: "app/api/health/route.ts", ps: "src/app/api/health/route.ts" },
  { cd: "app/api/leah/kpis/route.ts", ps: "src/app/api/agents/leah/kpis/route.ts" },
  { cd: "app/api/leah/contratos/route.ts", ps: "src/app/api/agents/leah/contratos/route.ts" },
  { cd: "app/api/leah/conversion/route.ts", ps: "src/app/api/agents/leah/conversion/route.ts" },
  { cd: "app/api/qara/kpis/route.ts", ps: "src/app/api/agents/qara/kpis/route.ts" },
  { cd: "app/api/qara/distribution/route.ts", ps: "src/app/api/agents/qara/distribution/route.ts" },
  { cd: "app/api/qara/schedule/route.ts", ps: "src/app/api/agents/qara/schedule/route.ts" },
  { cd: "app/api/qara/run/route.ts", ps: "src/app/api/agents/qara/run/route.ts" },
  { cd: "app/api/inteligencia/latest/route.ts", ps: "src/app/api/agents/inteligencia/latest/route.ts" },
  { cd: "app/api/inteligencia/timeseries/route.ts", ps: "src/app/api/agents/inteligencia/timeseries/route.ts" },
  { cd: "app/api/inteligencia/predictions/route.ts", ps: "src/app/api/agents/inteligencia/predictions/route.ts" },
  { cd: "app/api/inteligencia/diagnostics/route.ts", ps: "src/app/api/agents/inteligencia/diagnostics/route.ts" },
  { cd: "app/api/inteligencia/ab-tests/route.ts", ps: "src/app/api/agents/inteligencia/ab-tests/route.ts" },
  { cd: "app/api/inteligencia/report/route.ts", ps: "src/app/api/agents/inteligencia/report/route.ts" },
  // Inteligencia components
  { cd: "components/inteligencia/kri-card.tsx", ps: "tenants/core/components/inteligencia/kri-card.tsx" },
  { cd: "components/inteligencia/recommendation-card.tsx", ps: "tenants/core/components/inteligencia/recommendation-card.tsx" },
  { cd: "components/inteligencia/ab-test-card.tsx", ps: "tenants/core/components/inteligencia/ab-test-card.tsx" },
  { cd: "components/inteligencia/whatif-simulator.tsx", ps: "tenants/core/components/inteligencia/whatif-simulator.tsx" },
  // BI charts (new)
  { cd: "components/charts/combo.tsx", ps: "src/components/portal/charts/combo.tsx" },
  { cd: "components/charts/funnel.tsx", ps: "src/components/portal/charts/funnel.tsx" },
  { cd: "components/charts/gauge.tsx", ps: "src/components/portal/charts/gauge.tsx" },
  { cd: "components/charts/heatmap.tsx", ps: "src/components/portal/charts/heatmap.tsx" },
  { cd: "components/charts/pareto.tsx", ps: "src/components/portal/charts/pareto.tsx" },
  { cd: "components/charts/scatter.tsx", ps: "src/components/portal/charts/scatter.tsx" },
  { cd: "components/charts/waterfall.tsx", ps: "src/components/portal/charts/waterfall.tsx" },
  { cd: "components/charts/forecast-line.tsx", ps: "src/components/portal/charts/forecast-line.tsx" },
  { cd: "components/charts/anomaly-timeline.tsx", ps: "src/components/portal/charts/anomaly-timeline.tsx" },
  // Layout
  { cd: "components/layout/auto-refresh.tsx", ps: "src/components/portal/auto-refresh.tsx" },
  { cd: "components/layout/live-clock.tsx", ps: "src/components/portal/live-clock.tsx" },
  { cd: "scripts/verify-live.mjs", ps: "scripts/verify-live.mjs", optional: true },
  { cd: "docs/DATA_SOURCES.md", ps: "docs/DATA_SOURCES.md", optional: true },
];

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

let missing = 0;
let ok = 0;

console.log(`core-dashboard: ${CD}`);
console.log(`portal-stack:   ${ROOT}\n`);

if (!fs.existsSync(CD)) {
  console.error("Missing core-dashboard clone. Set CORE_DASHBOARD_DIR or clone to /Users/soporte/projects/core-dashboard");
  process.exit(1);
}

for (const { cd, ps, optional } of MAP) {
  const psPaths = Array.isArray(ps) ? ps : [ps];
  const cdPath = path.join(CD, cd);
  const cdOk = fs.existsSync(cdPath);
  const psOk = psPaths.some((p) => exists(p));

  if (!psOk) {
    missing++;
    console.log(`MISSING  ${optional ? "(optional) " : ""}${cd} -> ${psPaths.join(" | ")}`);
  } else if (!cdOk) {
    console.log(`WARN     CD missing ${cd}`);
  } else {
    ok++;
    console.log(`OK       ${cd}`);
  }
}

console.log(`\n${ok} mapped, ${missing} missing in portal-stack`);
if (missing > 0) process.exit(1);
console.log("sync-core-dashboard-check ok");
