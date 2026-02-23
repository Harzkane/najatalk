#!/usr/bin/env node
// npm run ops:synthetic
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
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value =
      (rawValue.startsWith("\"") && rawValue.endsWith("\"")) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    process.env[key] = value;
  }
};

loadBackendEnv();

const BACKEND_BASE = (
  process.env.SYNTH_BACKEND_BASE || "http://localhost:8000"
).replace(/\/$/, "");
const FRONTEND_BASE = (
  process.env.SYNTH_FRONTEND_BASE || "http://localhost:3000"
).replace(/\/$/, "");
const API_BASE = `${BACKEND_BASE}/api`;

const USER_EMAIL = String(process.env.SYNTH_USER_EMAIL || process.env.E2E_USER_EMAIL || "").trim();
const USER_PASSWORD = String(
  process.env.SYNTH_USER_PASSWORD || process.env.E2E_USER_PASSWORD || ""
).trim();
const ADMIN_EMAIL = String(
  process.env.SYNTH_ADMIN_EMAIL || process.env.E2E_ADMIN_EMAIL || ""
).trim();
const ADMIN_PASSWORD = String(
  process.env.SYNTH_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD || ""
).trim();

let USER_TOKEN = String(process.env.SYNTH_USER_TOKEN || process.env.E2E_USER_TOKEN || "").trim();
let ADMIN_TOKEN = String(process.env.SYNTH_ADMIN_TOKEN || process.env.E2E_ADMIN_TOKEN || "").trim();
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.SYNTH_TIMEOUT_MS || "12000",
  10,
);

const nowIso = () => new Date().toISOString();

const safeJson = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text.slice(0, 240) };
  }
};

const login = async ({ email, password, label }) => {
  if (!email || !password) return "";
  const payload = await runCheck({
    name: `auth.login.${label}`,
    url: `${API_BASE}/auth/login`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email, password },
    expect: {
      status: [200],
      validate: (res) => (res?.token ? true : "missing token"),
    },
  });
  const status = payload.ok ? "PASS" : "FAIL";
  console.log(
    `[${status}] ${payload.name} ${payload.status} ${payload.elapsedMs}ms - ${payload.reason}`,
  );
  return payload.ok ? String(payload?.sample?.token || "") : "";
};

const runCheck = async ({
  name,
  url,
  method = "GET",
  headers = {},
  body,
  expect,
}) => {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const elapsedMs = Date.now() - started;
    const payload = await safeJson(res);

    let ok = expect.status.includes(res.status);
    let reason = ok ? "ok" : `Unexpected status ${res.status}`;

    if (ok && typeof expect.validate === "function") {
      const verdict = expect.validate(payload);
      if (verdict !== true) {
        ok = false;
        reason = String(verdict || "validation failed");
      }
    }

    return {
      ts: nowIso(),
      name,
      url,
      method,
      status: res.status,
      elapsedMs,
      ok,
      reason,
      sample: payload,
    };
  } catch (err) {
    return {
      ts: nowIso(),
      name,
      url,
      method,
      status: 0,
      elapsedMs: Date.now() - started,
      ok: false,
      reason:
        err?.name === "AbortError"
          ? `timeout>${REQUEST_TIMEOUT_MS}ms`
          : err?.message || "request failed",
      sample: null,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const buildChecks = () => {
  const checks = [
    {
      name: "backend.health",
      url: `${BACKEND_BASE}/health`,
      expect: {
        status: [200],
        validate: (payload) =>
          payload?.status === "ok" ? true : "health status is not ok",
      },
    },
    {
      name: "backend.ready",
      url: `${BACKEND_BASE}/ready`,
      expect: {
        status: [200],
        validate: (payload) =>
          payload?.status === "ready"
            ? true
            : `readiness is ${payload?.status || "unknown"}`,
      },
    },
    {
      name: "api.threads",
      url: `${API_BASE}/threads`,
      expect: {
        status: [200],
        validate: (payload) =>
          Array.isArray(payload?.threads) ? true : "threads list missing",
      },
    },
    {
      name: "api.contests",
      url: `${API_BASE}/contests`,
      expect: {
        status: [200],
        validate: (payload) =>
          Array.isArray(payload?.contests) ? true : "contests list missing",
      },
    },
    {
      name: "frontend.home",
      url: `${FRONTEND_BASE}/`,
      expect: {
        status: [200],
        validate: () => true,
      },
    },
    {
      name: "frontend.contests",
      url: `${FRONTEND_BASE}/contests`,
      expect: {
        status: [200],
        validate: () => true,
      },
    },
  ];

  if (USER_TOKEN) {
    checks.push(
      {
        name: "api.users.me",
        url: `${API_BASE}/users/me`,
        headers: { Authorization: `Bearer ${USER_TOKEN}` },
        expect: {
          status: [200],
          validate: (payload) => (payload?._id ? true : "missing user id"),
        },
      },
      {
        name: "api.wallet.ledger",
        url: `${API_BASE}/users/me/wallet-ledger`,
        headers: { Authorization: `Bearer ${USER_TOKEN}` },
        expect: {
          status: [200],
          validate: (payload) =>
            Array.isArray(payload?.entries) || Array.isArray(payload?.ledger)
              ? true
              : "missing wallet ledger entries",
        },
      },
      {
        name: "api.premium.my_payments",
        url: `${API_BASE}/premium/my-payments`,
        headers: { Authorization: `Bearer ${USER_TOKEN}` },
        expect: {
          status: [200],
          validate: (payload) =>
            Array.isArray(payload?.rows) || Array.isArray(payload?.payments)
              ? true
              : "missing premium payments rows",
        },
      },
    );
  }

  if (ADMIN_TOKEN) {
    checks.push({
      name: "api.admin.sla_alerts.dispatch_dry_run",
      url: `${API_BASE}/users/admin/sla-alerts/dispatch?dryRun=true`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: {},
      expect: {
        status: [200],
        validate: (payload) =>
          payload?.thresholds ? true : "missing thresholds in sla dry-run",
      },
    });
  }

  return checks;
};

console.log(`Synthetic monitor started at ${nowIso()}`);
console.log(`Backend: ${BACKEND_BASE}`);
console.log(`Frontend: ${FRONTEND_BASE}`);

if (USER_EMAIL && USER_PASSWORD) {
  const token = await login({ email: USER_EMAIL, password: USER_PASSWORD, label: "user" });
  if (token) USER_TOKEN = token;
}
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const token = await login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, label: "admin" });
  if (token) ADMIN_TOKEN = token;
}

const checks = buildChecks();
console.log(`Checks: ${checks.length}`);

const results = [];
for (const check of checks) {
  // Sequential run keeps load predictable and easier to inspect in logs.
  // eslint-disable-next-line no-await-in-loop
  const result = await runCheck(check);
  results.push(result);
  const status = result.ok ? "PASS" : "FAIL";
  console.log(
    `[${status}] ${result.name} ${result.status} ${result.elapsedMs}ms - ${result.reason}`,
  );
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
