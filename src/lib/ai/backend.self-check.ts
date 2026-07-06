import assert from "node:assert/strict";
import { resolveAIBackend } from "./backend";

const saved = process.env.AI_BACKEND;

function withEnv(value: string | undefined, fn: () => void) {
  if (value === undefined) delete process.env.AI_BACKEND;
  else process.env.AI_BACKEND = value;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env.AI_BACKEND;
    else process.env.AI_BACKEND = saved;
  }
}

assert.equal(resolveAIBackend({}), "local");
assert.equal(resolveAIBackend({ backend: "local" }), "local");
assert.equal(resolveAIBackend({ backend: "fastapi" }), "fastapi");

withEnv("fastapi", () => {
  assert.equal(resolveAIBackend({}), "fastapi");
  assert.equal(resolveAIBackend({ backend: "local" }), "local");
});

withEnv("local", () => {
  assert.equal(resolveAIBackend({}), "local");
});

withEnv("bogus", () => {
  assert.equal(resolveAIBackend({}), "local");
});

console.log("backend.self-check ok");
