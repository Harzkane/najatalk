// cd backend
// npm test

import test from "node:test";
import assert from "node:assert/strict";
import { buildHealthPayload, buildReadinessPayload } from "../utils/health.js";

test("buildHealthPayload returns core fields", () => {
  const payload = buildHealthPayload();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "najatalk-backend");
  assert.ok(typeof payload.timestamp === "string");
  assert.ok(typeof payload.uptimeSeconds === "number");
});

test("buildReadinessPayload maps mongo state to readiness", () => {
  const ready = buildReadinessPayload(1);
  assert.equal(ready.status, "ready");
  assert.equal(ready.checks.database.status, "up");

  const notReady = buildReadinessPayload(0);
  assert.equal(notReady.status, "not_ready");
  assert.equal(notReady.checks.database.status, "down");
});
