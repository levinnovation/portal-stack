/**
 * CLI: scaffold a new tenant under /tenants/<id>/.
 * Usage:  pnpm tenant:new -- --id=finu --name="Finu" --vertical=fintech
 */
import fs from "fs";
import path from "path";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function registerTenantInRegistry(id: string) {
  const registryPath = path.resolve("tenants/registry.ts");
  let src = fs.readFileSync(registryPath, "utf8");
  const importLine = `import { ${id}Tenant } from "./${id}/config";`;
  if (!src.includes(importLine)) {
    src = src.replace(
      'import { finuTenant } from "./finu/config";',
      `import { finuTenant } from "./finu/config";\n${importLine}`,
    );
  }
  const entry = `  ${id}: ${id}Tenant,`;
  if (!src.includes(entry)) {
    src = src.replace(
      "  finu: finuTenant,",
      `  finu: finuTenant,\n${entry}`,
    );
  }
  fs.writeFileSync(registryPath, src);
}

const args = parseArgs();
const id = args.id;
const name = args.name || id;
const vertical = args.vertical || "generic";

if (!id) {
  console.error("Usage: pnpm tenant:new -- --id=<id> --name=<name> --vertical=<realestate|fintech|generic>");
  process.exit(1);
}

const root = path.resolve("tenants", id);
if (fs.existsSync(root)) {
  console.error(`Tenant "${id}" already exists at ${root}`);
  process.exit(1);
}

const adminOverviewSlug = `${id}-admin-overview`;
const exportName = `${id}Pages`;

fs.mkdirSync(path.join(root, "ai"), { recursive: true });
fs.mkdirSync(path.join(root, "domain"), { recursive: true });
fs.mkdirSync(path.join(root, "screens"), { recursive: true });
fs.mkdirSync(path.join(root, "sources"), { recursive: true });

fs.writeFileSync(
  path.join(root, "screens/README.md"),
  `# Custom screens for ${name}\n\nSee tenants/_default/screens/README.md and tenants/core/screens/agents-overview.tsx.\n`,
);
fs.writeFileSync(
  path.join(root, "sources/README.md"),
  `# BFF sources for ${name}\n\nSee tenants/_default/sources/README.md. Use resolveIntegrationToken() for secrets.\n`,
);

fs.writeFileSync(
  path.join(root, "config.ts"),
  `import type { TenantConfig } from "@/lib/tenant";
import { ${id}Collections } from "./domain";

export const ${id}Tenant: TenantConfig = {
  id: "${id}",
  name: "${name}",
  description: "TODO: describe ${name}",
  verticals: ["${vertical}"],
  theme: {
    brand: "${name.toUpperCase()}",
    colors: {
      background: "0 0% 100%",
      foreground: "240 10% 4%",
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      primaryGlow: "240 5% 26%",
      accent: "240 5% 65%",
      accentForeground: "240 5.9% 10%",
      accentSoft: "240 5% 96%",
      success: "142 71% 45%",
      warning: "38 92% 50%",
      destructive: "0 84% 60%",
      border: "240 6% 90%",
      ring: "240 5% 65%",
    },
    fonts: { display: "Inter, system-ui, sans-serif", sans: "Inter, system-ui, sans-serif" },
    radius: "0.5rem",
  },
  features: {
    chat: true, excel: false, quickbase: false, documents: true,
    aiAgent: true, layoutBuilder: true, navFromDb: false, auditLog: false, impersonation: false,
  },
  ai: {
    enabled: true, provider: "openai", model: "gpt-4o-mini",
    systemPromptFile: "tenants/${id}/ai/prompts.ts",
    maxStepsPerTurn: 5, temperature: 0.3,
  },
  auth: { provider: "local", cookieName: "payload-token", sessionDays: 7 },
  roles: [
    {
      key: "admin",
      label: "Admin",
      homePath: "/portal/admin",
      defaultLandingPageSlug: "${adminOverviewSlug}",
      nav: [
        { to: "/portal/admin", label: "Resumen", icon: "LayoutDashboard", end: true },
        { to: "/portal/profile", label: "Perfil", icon: "User" },
      ],
    },
  ],
  payloadCollections: ${id}Collections,
};
`,
);

fs.writeFileSync(
  path.join(root, "ai/prompts.ts"),
  `export const systemPrompt = "Eres el asistente de ${name}.";
export const toolsDescription = "Sin tools configurados todavía.";
export const agentName = "${name} Assistant";
export const agentGreeting = "Hola, ¿en qué puedo ayudarte?";
`,
);

fs.writeFileSync(path.join(root, "domain/index.ts"), `export const ${id}Collections: import("payload").CollectionConfig[] = [];\n`);

fs.writeFileSync(
  path.join(root, "pages.ts"),
  `import type { Page } from "@/collections/Pages";

export const ${exportName}: Page[] = [
  {
    title: "Panel de administración",
    slug: "${adminOverviewSlug}",
    description: "Vista general de ${name}",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        title: "Indicadores",
        cards: [{ label: "Usuarios", dataset: "count:users", format: "number", icon: "Users" }],
      },
    ],
  },
  {
    title: "Mi perfil",
    slug: "profile",
    allowedRoles: ["admin", "member"],
    layout: [{ blockType: "markdown", title: "Información personal", body: {} }],
  },
];
`,
);

registerTenantInRegistry(id);

console.log(`✔ Tenant "${id}" created at tenants/${id}/`);
console.log(`✔ Registered in tenants/registry.ts`);
console.log("");
console.log("Next:");
console.log(`  Edit tenants/${id}/config.ts (theme, roles, nav)`);
console.log(`  TENANT_ID=${id} pnpm seed`);
console.log(`  pnpm self-check`);
console.log("");
console.log("Custom screens: tenants/" + id + "/screens/ + route in src/app/(frontend)/portal/…");
console.log("See docs/FORK.md for the full fork checklist.");
