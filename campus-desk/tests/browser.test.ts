import { test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError, authErrorMessage } from "../lib/browser";

test("a failed save with an expired session keeps the current page", async () => {
  const originalFetch = globalThis.fetch;
  let navigated = false;
  Object.assign(globalThis, {
    window: {
      location: {
        assign: () => {
          navigated = true;
        },
      },
    },
  });
  globalThis.fetch = async () =>
    Response.json({ error: { message: "Please log in." } }, { status: 401 });
  try {
    await assert.rejects(
      api("/api/requests", "POST", { title: "Draft" }),
      (error) => error instanceof ApiError && error.status === 401,
    );
    assert.equal(navigated, false);
  } finally {
    globalThis.fetch = originalFetch;
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("authentication failures distinguish throttling and service outages", () => {
  assert.match(authErrorMessage(429, false), /Too many/);
  assert.match(authErrorMessage(503, false), /unavailable/);
  assert.match(authErrorMessage(401, false), /incorrect/);
});
