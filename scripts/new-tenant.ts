/**
 * CLI: scaffold a new tenant under /tenants/<id>/.
 * Usage:  pnpm tenant:new -- --id=finu --name="Finu" --vertical=fintech
 */
import fs from "fs";
import path from "path";

function parseArgs() {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
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

fs.mkdirSync(path.join(root, "ai"), { recursive: true });
fs.mkdirSync(path.join(root, "domain"), { recursive: true });

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
    aiAgent: true, layoutBuilder: true, auditLog: false, impersonation: false,
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

fs.writeFileSync(path.join(root, "domain/index.ts"), `// Add vertical collections here.\nexport const ${id}Collections: any[] = [];\n`);

fs.writeFileSync(
  path.join(root, "pages.ts"),
  `// Seed pages — slugs must match config.roles[].defaultLandingPageSlug and nav routes.
import type { Page } from "@/collections/Pages";

export const ${id}Pages: Page[] = [
  {
    title: "Panel de administración",
    slug: "${adminOverviewSlug}",
    description: "Vista general de ${name}",
    allowedRoles: ["admin"],
    layout: [
      {
        blockType: "kpi-grid",
        title: "Indicadores",
        cards: [
          { label: "Usuarios", dataset: "count:users", format: "number", icon: "Users" },
        ],
      },
    ],
  },
  {
    title: "Mi perfil",
    slug: "profile",
    allowedRoles: ["admin", "member"],
    layout: [
      { blockType: "markdown", title: "Información personal", body: {} },
    ],
  },
];
`,
);

console.log(`✔ Tenant "${id}" created at tenants/${id}/`);
console.log("");
console.log("Next — register in src/lib/tenant.ts:");
console.log(`  import { ${id}Tenant } from "../../tenants/${id}/config";`);
console.log(`  // inside TENANT_REGISTRY:`);
console.log(`  ${id}: ${id}Tenant,`);
console.log("");
console.log("Then:");
console.log(`  TENANT_ID=${id} pnpm seed`);
console.log(`  Deploy with TENANT_ID=${id} (collections come from config.payloadCollections)`);
console.log("");
console.log("Run pnpm self-check — tenant-registry.self-check fails if registration is missing.");
