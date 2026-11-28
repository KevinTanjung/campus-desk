import { test } from "node:test";
import assert from "node:assert/strict";
import { MongoNetworkError } from "mongodb";
import { readJson, errorResponse, HttpError, checkOrigin } from "../lib/http";

test("bounded streaming JSON rejects oversized bodies without waiting for a stream to close", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("a".repeat(17000)));
    },
  });
  const request = new Request("http://127.0.0.1/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(
    Promise.race([
      readJson(request),
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Body read stalled.")),
          1000,
        );
        timer.unref();
      }),
    ]),
    (error) => error instanceof HttpError && error.status === 413,
  );
});

test("invalid JSON and foreign origins fail, and database outages return a safe retry response", async () => {
  await assert.rejects(
    readJson(
      new Request("http://127.0.0.1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    ),
    (error) => error instanceof HttpError && error.status === 400,
  );
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://127.0.0.1", {
          headers: { origin: "https://other.example" },
        }),
      ),
    (error) => error instanceof HttpError && error.status === 403,
  );
  const response = errorResponse(
    new MongoNetworkError("Private database details"),
  );
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.match(text, /try again/);
  assert(!text.includes("Private database details"));
});
