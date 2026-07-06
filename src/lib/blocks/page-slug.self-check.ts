import assert from "node:assert/strict";
import { navPathToSlugCandidates, resolvePageSlugCandidates } from "./page-slug";

assert.deepEqual(resolvePageSlugCandidates("projects", "/portal/admin"), ["projects", "admin-projects"]);
assert.deepEqual(resolvePageSlugCandidates("distributions", "/portal/investor"), ["distributions", "investor-distributions"]);
assert.equal(resolvePageSlugCandidates("admin-overview", "/portal/admin")[0], "admin-overview");

const adminProjects = navPathToSlugCandidates("/portal/admin/projects", "/portal/admin");
assert.ok(adminProjects.includes("admin-projects"));

console.log("page-slug.self-check ok");
