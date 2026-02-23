// cd backend
// npm test

import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../middleware/rateLimit.js";

const createMockReqRes = () => {
  const headers = {};
  const req = {
    ip: "127.0.0.1",
    headers: {},
  };
  const res = {
    statusCode: 200,
    body: null,
    setHeader: (key, value) => {
      headers[key] = value;
    },
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (payload) => {
      res.body = payload;
      return res;
    },
  };
  return { req, res, headers };
};

test("rate limiter allows requests within threshold", () => {
  const limiter = createRateLimiter({
    id: "test-allow",
    windowMs: 60_000,
    max: 2,
  });

  const { req, res } = createMockReqRes();
  let nextCalled = 0;
  const next = () => {
    nextCalled += 1;
  };

  limiter(req, res, next);
  limiter(req, res, next);

  assert.equal(nextCalled, 2);
  assert.equal(res.statusCode, 200);
});

test("rate limiter blocks requests above threshold", () => {
  const limiter = createRateLimiter({
    id: "test-block",
    windowMs: 60_000,
    max: 1,
    message: "blocked",
  });

  const { req, res } = createMockReqRes();
  let nextCalled = 0;
  const next = () => {
    nextCalled += 1;
  };

  limiter(req, res, next);
  limiter(req, res, next);

  assert.equal(nextCalled, 1);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body?.message, "blocked");
});
