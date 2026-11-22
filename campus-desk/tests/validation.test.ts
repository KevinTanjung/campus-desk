import { test } from "node:test";
import assert from "node:assert/strict";
import {
  registrationSchema,
  requestSchema,
  requestPatchSchema,
  categorySchema,
  listSchema,
  statusSchema,
} from "../lib/validation";
const valid = {
  title: "Transcript request",
  description: "I need a transcript for my internship.",
  categoryId: "507f1f77bcf86cd799439011",
};
test("request validation trims strings and rejects protected or injected input", () => {
  assert.equal(
    requestSchema.parse({ ...valid, title: "  Transcript request  " }).title,
    valid.title,
  );
  assert.equal(requestSchema.parse(valid).location, "");
  for (const extra of [
    { reporterId: "other" },
    { status: "resolved" },
    { title: { $ne: "" } },
    { categoryId: "bad" },
  ]) {
    assert.equal(
      requestSchema.safeParse({ ...valid, ...extra }).success,
      false,
    );
  }
  assert.equal(requestPatchSchema.safeParse({}).success, false);
});
test("registration and category validation enforce exact boundaries", () => {
  assert.equal(
    registrationSchema.parse({
      name: " Alex ",
      email: "ALEX@EXAMPLE.COM",
      password: "a".repeat(12),
    }).email,
    "alex@example.com",
  );
  assert.equal(
    registrationSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "a".repeat(11),
    }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "a".repeat(12),
      role: "staff",
    }).success,
    false,
  );
  assert.equal(categorySchema.safeParse({ name: " " }).success, false);
});
test("list values are bounded and resolved updates require a note", () => {
  assert.equal(listSchema.parse({}).pageSize, 10);
  for (const input of [
    { page: 0 },
    { page: "1.5" },
    { pageSize: 51 },
    { sort: "$where" },
    { unknown: 1 },
  ])
    assert.equal(listSchema.safeParse(input).success, false);
  assert.equal(
    statusSchema.safeParse({ status: "resolved", resolutionNote: "" }).success,
    false,
  );
  assert.equal(
    statusSchema.safeParse({ status: "in_progress", resolutionNote: "" })
      .success,
    true,
  );
});
