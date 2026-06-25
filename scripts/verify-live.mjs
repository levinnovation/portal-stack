#!/usr/bin/env node
// Smoke test against a running portal-stack deploy (browser captures RSC/hydration errors).
import { chromium } from "@playwright/test";

const BASE = process.env.VERIFY_BASE_URL || "http://localhost:3000";
const COOKIE = process.env.VERIFY_SESSION_COOKIE;

const PAGES = [
  "/portal/admin/agents",
  "/portal/admin/agents/leah",
  "/portal/admin/agents/leah/contratos",
  "/portal/admin/agents/qara",
  "/portal/admin/agents/qara/control",
  "/portal/admin/agents/inteligencia",
  "/portal/admin/agents/inteligencia/segmentos",
  "/portal/admin/agents/inteligencia/equipo",
  "/portal/admin/agents/inteligencia/pauta",
  "/portal/admin/agents/inteligencia/predicciones",
  "/portal/admin/agents/inteligencia/diagnostico",
  "/portal/admin/agents/inteligencia/experimentos",
  "/portal/admin/agents/inteligencia/reportes",
];

const APIS = [
  "/api/health",
  "/api/agents/leah/kpis",
  "/api/agents/qara/kpis",
  "/api/agents/inteligencia/latest?run_type=weekly",
];

const FATAL = [
  "Functions cannot be passed directly to Client Components",
  "a server-side exception has occurred",
  "an error occurred in the server components render",
  "application error",
  "this page couldn't load",
  "this page couldn’t load",
];

const browser = await chromium.launch();
let failed = false;

async function checkApi(path) {
  const ctx = await browser.newContext();
  if (COOKIE) {
    await ctx.addCookies([
      { name: "payload-token", value: COOKIE, domain: new URL(BASE).hostname, path: "/" },
    ]);
  }
  const page = await ctx.newPage();
  const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  const status = resp?.status() ?? 0;
  const ok = path === "/api/health" ? status === 200 : status === 200 || status === 401 || status === 502;
  if (!ok) failed = true;
  console.log(`${ok ? "✓" : "✗"} API ${path} status=${status}`);
  await ctx.close();
}

for (const path of APIS) await checkApi(path);

for (const path of PAGES) {
  const ctx = await browser.newContext();
  if (COOKIE) {
    await ctx.addCookies([
      { name: "payload-token", value: COOKIE, domain: new URL(BASE).hostname, path: "/" },
    ]);
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  let status = 0;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
    status = resp?.status() ?? 0;
  } catch (e) {
    errors.push("navigation failed: " + String(e));
  }

  const html = (await page.content()).toLowerCase();
  const fatalHit = FATAL.find((m) => html.includes(m.toLowerCase()) || errors.some((e) => e.includes(m)));
  const hydrationErr = errors.find((e) => /#418|#419|#423|hydrat/i.test(e));
  const authRedirect = status === 200 && html.includes("/portal/auth");
  const ok =
    status > 0 &&
    status < 500 &&
    !fatalHit &&
    !hydrationErr &&
    (!authRedirect || !COOKIE);

  if (!ok) failed = true;
  console.log(
    `${ok ? "✓" : "✗"} ${path} status=${status}` +
      (authRedirect && !COOKIE ? " (needs VERIFY_SESSION_COOKIE)" : "") +
      (fatalHit ? ` FATAL="${fatalHit}"` : ""),
  );
  await ctx.close();
}

await browser.close();
console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
