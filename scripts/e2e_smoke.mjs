#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const loadBackendEnv = () => {
  const envPath = path.resolve(process.cwd(), "backend/.env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    const value = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = value;
  }
};

loadBackendEnv();

const BACKEND_BASE = (process.env.E2E_BACKEND_BASE || "http://localhost:8000").replace(/\/$/, "");
const API_BASE = `${BACKEND_BASE}/api`;
const isHostedBackend = /^https?:\/\//.test(BACKEND_BASE) && !/localhost|127\.0\.0\.1/.test(BACKEND_BASE);
const TIMEOUT_MS = Number.parseInt(process.env.E2E_TIMEOUT_MS || (isHostedBackend ? "25000" : "15000"), 10);
const RETRIES = Number.parseInt(process.env.E2E_RETRIES || (isHostedBackend ? "2" : "0"), 10);

const USER_EMAIL = String(process.env.E2E_USER_EMAIL || "").trim();
const USER_PASSWORD = String(process.env.E2E_USER_PASSWORD || "").trim();
const ADMIN_EMAIL = String(process.env.E2E_ADMIN_EMAIL || "").trim();
const ADMIN_PASSWORD = String(process.env.E2E_ADMIN_PASSWORD || "").trim();

const seededUserToken = String(process.env.E2E_USER_TOKEN || "").trim();
const seededAdminToken = String(process.env.E2E_ADMIN_TOKEN || "").trim();

const nowIso = () => new Date().toISOString();

const safeJson = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text.slice(0, 300) };
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const http = async ({ name, url, method = "GET", headers = {}, body, expectedStatus = [200], validate }) => {
  let attempt = 0;
  let lastResult = null;

  while (attempt <= RETRIES) {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await safeJson(res);
      const elapsedMs = Date.now() - started;

      let ok = expectedStatus.includes(res.status);
      let reason = ok ? "ok" : `unexpected status ${res.status}`;

      if (ok && typeof validate === "function") {
        const verdict = validate(payload);
        if (verdict !== true) {
          ok = false;
          reason = String(verdict || "validation failed");
        }
      }

      lastResult = { name, method, url, status: res.status, elapsedMs, ok, reason, payload };
      if (ok) return lastResult;
      if (attempt >= RETRIES) return lastResult;
    } catch (err) {
      lastResult = {
        name,
        method,
        url,
        status: 0,
        elapsedMs: Date.now() - started,
        ok: false,
        reason: err?.name === "AbortError" ? `timeout>${TIMEOUT_MS}ms` : err?.message || "request failed",
        payload: null,
      };
      if (attempt >= RETRIES) return lastResult;
    } finally {
      clearTimeout(timeout);
    }

    attempt += 1;
    await sleep(500 * attempt);
  }

  return lastResult || { name, method, url, status: 0, elapsedMs: 0, ok: false, reason: "unknown", payload: null };
};

const login = async ({ email, password, label }) => {
  if (!email || !password) {
    return { ok: false, reason: `${label} credentials missing`, token: "" };
  }
  const result = await http({
    name: `auth.login.${label}`,
    method: "POST",
    url: `${API_BASE}/auth/login`,
    headers: { "Content-Type": "application/json" },
    body: { email, password },
    expectedStatus: [200],
    validate: (payload) => (payload?.token ? true : "token missing in login response"),
  });

  return {
    ok: result.ok,
    reason: result.reason,
    token: result.payload?.token || "",
    trace: result,
  };
};

const results = [];
const push = (result) => {
  results.push(result);
  const status = result.ok ? "PASS" : "FAIL";
  console.log(`[${status}] ${result.name} ${result.status} ${result.elapsedMs}ms - ${result.reason}`);
};

console.log(`E2E smoke started at ${nowIso()}`);
console.log(`Backend: ${BACKEND_BASE}`);

push(
  await http({
    name: "public.health",
    url: `${BACKEND_BASE}/health`,
    expectedStatus: [200],
    validate: (payload) => (payload?.status === "ok" ? true : "health status not ok"),
  })
);

push(
  await http({
    name: "public.ready",
    url: `${BACKEND_BASE}/ready`,
    expectedStatus: [200],
    validate: (payload) => (payload?.status === "ready" ? true : `ready status is ${payload?.status}`),
  })
);

push(
  await http({
    name: "public.threads.list",
    url: `${API_BASE}/threads`,
    expectedStatus: [200],
    validate: (payload) => (Array.isArray(payload?.threads) ? true : "threads missing"),
  })
);

push(
  await http({
    name: "public.contests.list",
    url: `${API_BASE}/contests`,
    expectedStatus: [200],
    validate: (payload) => (Array.isArray(payload?.contests) ? true : "contests missing"),
  })
);

let userToken = seededUserToken;
let adminToken = seededAdminToken;

if (USER_EMAIL && USER_PASSWORD) {
  const userLogin = await login({ email: USER_EMAIL, password: USER_PASSWORD, label: "user" });
  if (userLogin.trace) push(userLogin.trace);
  if (userLogin.token) {
    userToken = userLogin.token;
  } else {
    // Credentials were provided but login failed; avoid falling back to stale token env values.
    userToken = "";
  }
}

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const adminLogin = await login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, label: "admin" });
  if (adminLogin.trace) push(adminLogin.trace);
  if (adminLogin.token) {
    adminToken = adminLogin.token;
  } else {
    // Credentials were provided but login failed; avoid falling back to stale token env values.
    adminToken = "";
  }
}

if (userToken) {
  const authHeaders = { Authorization: `Bearer ${userToken}` };
  push(
    await http({
      name: "user.me",
      url: `${API_BASE}/users/me`,
      headers: authHeaders,
      expectedStatus: [200],
      validate: (payload) => (payload?._id ? true : "missing user id"),
    })
  );

  push(
    await http({
      name: "user.wallet.ledger",
      url: `${API_BASE}/users/me/wallet-ledger`,
      headers: authHeaders,
      expectedStatus: [200],
      validate: (payload) => (Array.isArray(payload?.ledger) ? true : "missing wallet ledger"),
    })
  );

  push(
    await http({
      name: "user.premium.my_payments",
      url: `${API_BASE}/premium/my-payments`,
      headers: authHeaders,
      expectedStatus: [200],
      validate: (payload) => (Array.isArray(payload?.payments) ? true : "missing payments array"),
    })
  );

  push(
    await http({
      name: "user.premium.verify.validation",
      url: `${API_BASE}/premium/verify`,
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: {},
      expectedStatus: [400],
      validate: (payload) =>
        typeof payload?.message === "string" && payload.message.length > 0
          ? true
          : "missing validation message",
    })
  );
} else {
  console.log("[SKIP] user-authenticated checks (no user token/credentials provided)");
}

if (adminToken) {
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  push(
    await http({
      name: "admin.users.list",
      url: `${API_BASE}/users/admin/users?page=1&pageSize=5`,
      headers: adminHeaders,
      expectedStatus: [200],
      validate: (payload) => (Array.isArray(payload?.users) ? true : "users list missing"),
    })
  );

  push(
    await http({
      name: "admin.actions.list",
      url: `${API_BASE}/users/admin/actions?page=1&pageSize=5`,
      headers: adminHeaders,
      expectedStatus: [200],
      validate: (payload) => (Array.isArray(payload?.actions) ? true : "actions list missing"),
    })
  );

  push(
    await http({
      name: "admin.sla.dispatch.dry_run",
      url: `${API_BASE}/users/admin/sla-alerts/dispatch?dryRun=true`,
      method: "POST",
      headers: { ...adminHeaders, "Content-Type": "application/json" },
      body: {},
      expectedStatus: [200],
      validate: (payload) => (payload?.thresholds ? true : "missing thresholds in dry run"),
    })
  );
} else {
  console.log("[SKIP] admin checks (no admin token/credentials provided)");
}

const failed = results.filter((row) => !row.ok);
const summary = {
  ts: nowIso(),
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
};

console.log(`Summary: ${JSON.stringify(summary)}`);
if (failed.length) {
  process.exitCode = 1;
}
