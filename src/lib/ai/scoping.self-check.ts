import assert from "node:assert/strict";
import { isStaffRole } from "./scoping";

assert.equal(isStaffRole("admin"), true);
assert.equal(isStaffRole("superadmin"), true);
assert.equal(isStaffRole("customer"), false);
assert.equal(isStaffRole("investor"), false);

console.log("scoping.self-check ok");
