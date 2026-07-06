import assert from "node:assert/strict";
import { getAuthCookieName, parseAuthCookie } from "./cookie-name";

assert.equal(getAuthCookieName(), "payload-token");

process.env.AUTH_COOKIE_NAME = "custom-token";
assert.equal(getAuthCookieName(), "custom-token");
delete process.env.AUTH_COOKIE_NAME;

assert.equal(parseAuthCookie("foo=1; payload-token=abc123; bar=2"), "abc123");
assert.equal(parseAuthCookie("foo=1", "custom-token"), null);
assert.equal(parseAuthCookie("custom-token=xyz", "custom-token"), "xyz");

console.log("cookie-name.self-check ok");
