import { test, expect } from "@playwright/test";

// Requires authenticated session when PLAYWRIGHT_SESSION_COOKIE is set.
const cookie = process.env.PLAYWRIGHT_SESSION_COOKIE;

test.beforeEach(async ({ context }) => {
  if (!cookie) test.skip();
  await context.addCookies([
    {
      name: "payload-token",
      value: cookie!,
      domain: "localhost",
      path: "/",
    },
  ]);
});

test("sidebar lists agent nav groups", async ({ page }) => {
  await page.goto("/portal/admin/agents");
  await expect(page.getByText("Leah · Atribución")).toBeVisible();
  await expect(page.getByText("Qara · Leads")).toBeVisible();
  await expect(page.getByText("Inteligencia · Ventas BI")).toBeVisible();
});

const routes = [
  ["/portal/admin/agents", "Overview"],
  ["/portal/admin/agents/leah", "Leah"],
  ["/portal/admin/agents/qara", "Qara"],
  ["/portal/admin/agents/inteligencia", "Inteligencia"],
] as const;

for (const [path, fragment] of routes) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(fragment, { exact: false }).first()).toBeVisible();
  });
}
