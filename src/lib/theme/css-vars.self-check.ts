import assert from "node:assert/strict";
import { coreTenant } from "@tenants/core/config";
import { tenantThemeCss } from "./css-vars";

const css = tenantThemeCss(coreTenant.theme);
assert.ok(css.includes(":root{"), "expected a :root block");
assert.ok(css.includes(".dark{"), "expected a .dark block");
// CORE dark base is near-black charcoal; the .dark block must carry it.
const darkBlock = css.slice(css.indexOf(".dark{"));
assert.ok(darkBlock.includes("--background:0 0% 7%"), "expected charcoal dark background token");
assert.equal(coreTenant.theme.defaultMode, "dark", "CORE should default to dark mode");

console.log("css-vars.self-check ok");
