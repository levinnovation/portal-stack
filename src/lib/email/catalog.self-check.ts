import assert from "node:assert/strict";
import { interpolateEmailHtml } from "./interpolate";

assert.equal(interpolateEmailHtml("<p>{{name}}</p>", { name: "CORE" }), "<p>CORE</p>");
assert.equal(interpolateEmailHtml("<p>{{name}}</p>", { name: "<script>" }), "<p>&lt;script&gt;</p>");
assert.equal(interpolateEmailHtml("<p>{{missing}}</p>", {}), "<p></p>");

console.log("[email catalog] ok");
