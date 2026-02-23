// cd backend
// npm test

import test from "node:test";
import assert from "node:assert/strict";
import { redactSensitive } from "../utils/logger.js";

test("redactSensitive redacts nested secrets", () => {
  const input = {
    password: "secret123",
    token: "abc",
    profile: {
      email: "demo@example.com",
      authorization: "Bearer 123",
    },
  };

  const result = redactSensitive(input);

  assert.equal(result.password, "[REDACTED]");
  assert.equal(result.token, "[REDACTED]");
  assert.equal(result.profile.authorization, "[REDACTED]");
  assert.equal(result.profile.email, "demo@example.com");
});
