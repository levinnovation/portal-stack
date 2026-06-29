import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";
import { tenantThemeCss } from "./css-vars";

const css = tenantThemeCss(coreTenant.theme);
assert.ok(css.includes(":root{"), "expected a :root block");
assert.ok(css.includes(".dark{"), "expected a .dark block");
assert.ok(css.includes("--background:258 76% 10%"), "expected midnight dark background token");

console.log("css-vars.self-check ok");
