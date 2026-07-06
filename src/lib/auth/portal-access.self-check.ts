import assert from "node:assert/strict";
import { canAccessPortalPrefix, portalPrefixForPath } from "./portal-access";

assert.equal(portalPrefixForPath("/portal/admin/projects"), "/portal/admin");
assert.equal(portalPrefixForPath("/portal/investor"), "/portal/investor");
assert.equal(portalPrefixForPath("/portal/profile"), null);

assert.equal(canAccessPortalPrefix("/portal/admin", "admin"), true);
assert.equal(canAccessPortalPrefix("/portal/admin", "customer"), false);
assert.equal(canAccessPortalPrefix("/portal/investor", "investor"), true);
assert.equal(canAccessPortalPrefix("/portal/investor", "admin"), true);

console.log("portal-access.self-check ok");
