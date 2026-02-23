# NaijaTalk Testing Master Guide

Last updated: February 23, 2026  
Audience: Product, QA, engineering, operations

---

## 1) Purpose

This file consolidates all NaijaTalk testing and validation workflows into one place:
- backend/unit reliability tests,
- synthetic checks,
- API e2e smoke checks,
- UI e2e browser checks,
- drill capture evidence commands.

Use this as the default test runbook.

---

## 2) Quick Start (Most Common)

From repo root:

```bash
npm test
npm run ops:synthetic
npm run ops:e2e:smoke
npm run ops:e2e:ui
```

For frontend gate:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
```

---

## 3) Test Layers

## 3.1 Backend Tests (unit/integration-style checks)

- Command: `npm test`
- Actual command: `npm test --prefix backend` -> `node --test`
- Core files:
  - `backend/test/health.test.js`
  - `backend/test/logger.test.js`
  - `backend/test/rateLimit.test.js`
  - `backend/test/payoutRules.test.js`
  - `backend/test/premiumReliability.test.js`
  - `backend/test/riskSignals.test.js`

Focus:
- health/readiness payload logic
- logging redaction
- rate-limit behavior
- payout guardrails
- premium verification safety
- risk signal computations

---

## 3.2 Synthetic Monitor (low-cost ops probes)

- Command: `npm run ops:synthetic`
- Script: `scripts/synthetic_monitor.mjs`
- Workflow: `.github/workflows/synthetic-monitor.yml`

Checks:
- `GET /health`
- `GET /ready`
- `GET /api/threads`
- `GET /api/contests`
- `GET /`
- `GET /contests`
- optional authenticated checks (`/api/users/me`, wallet ledger, premium payments)
- optional admin dry-run SLA dispatch

Use case:
- frequent availability/readiness visibility (every ~15 min in CI schedule).

---

## 3.3 API E2E Smoke

- Command: `npm run ops:e2e:smoke`
- Script: `scripts/e2e_smoke.mjs`
- Workflow: `.github/workflows/e2e-smoke.yml`

Coverage:
- public API health/readiness/threads/contests
- user auth + core user endpoints (if creds/token provided)
- admin auth + admin endpoints (if creds/token provided)

Use case:
- fast confidence check for core API journeys.

---

## 3.4 UI E2E (Playwright)

- Command: `npm run ops:e2e:ui`
- Script command: `npm run e2e:ui --prefix frontend`
- Config: `frontend/playwright.config.mjs`
- Workflow: `.github/workflows/ui-e2e.yml`

Spec files:
- `frontend/e2e/public-smoke.spec.ts`
- `frontend/e2e/authenticated-ui.spec.ts`
- `frontend/e2e/advanced-flows.spec.ts`

Coverage:
- public pages render
- authenticated compose/admin dashboard flows
- contest submit + vote flow
- admin payouts section flow

Use case:
- browser-level validation of critical user/admin experiences.

---

## 4) Environment Variables (Consolidated)

## 4.1 API Smoke (`ops:e2e:smoke`)

- `E2E_BACKEND_BASE` (default `http://localhost:8000`)
- `E2E_TIMEOUT_MS` (default `15000`)
- `E2E_RETRIES`
- `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_USER_TOKEN`, `E2E_ADMIN_TOKEN` (optional token fallback)

## 4.2 UI E2E (`ops:e2e:ui`)

- `E2E_UI_BASE_URL` (default `http://localhost:3000`)
- `E2E_UI_API_BASE` (default `http://localhost:8000/api`)
- `E2E_UI_ALLOW_MUTATIONS` (set `true` only for manual/local mutation tests)
- `E2E_UI_USER_EMAIL`, `E2E_UI_USER_PASSWORD`
- `E2E_UI_ADMIN_EMAIL`, `E2E_UI_ADMIN_PASSWORD`
- fallback support:
  - `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`
  - `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`

## 4.3 Synthetic

- `SYNTH_BACKEND_BASE` (default `http://localhost:8000`)
- `SYNTH_FRONTEND_BASE` (default `http://localhost:3000`)
- `SYNTH_TIMEOUT_MS`
- `SYNTH_USER_EMAIL`, `SYNTH_USER_PASSWORD`
- `SYNTH_ADMIN_EMAIL`, `SYNTH_ADMIN_PASSWORD`
- `SYNTH_USER_TOKEN`, `SYNTH_ADMIN_TOKEN`

Important credential rule:
- These accounts must already exist in the same database/environment you are testing.
- Example:
  - local backend => local DB users
  - hosted backend => hosted DB users

---

## 5) Recommended Local Full Test Sequence

```bash
# 1) Backend reliability
npm test

# 2) Frontend quality gate
npm run lint --prefix frontend
npm run build --prefix frontend

# 3) Ops probes
npm run ops:synthetic
npm run ops:e2e:smoke

# 4) Browser journey checks
npm run ops:e2e:ui
```

---

## 6) Production-Target Quick Runs

```bash
E2E_BACKEND_BASE=http://localhost:8000 npm run ops:e2e:smoke
E2E_BACKEND_BASE=https://najatalk.onrender.com npm run ops:e2e:smoke
```

Use caution with UI mutation flows against production-like environments:
- keep `E2E_UI_ALLOW_MUTATIONS=false` in scheduled workflows.

---

## 7) Drill Evidence Capture (Post-Action Validation)

These commands collect evidence logs after drill actions:

```bash
npm run ops:drill:rollback:capture -- evidence/drills/<timestamp>
npm run ops:drill:restore:capture -- evidence/drills/<timestamp>
```

Related files:
- `scripts/drill_capture_post_rollback.sh`
- `scripts/drill_capture_post_restore.sh`
- `scripts/create_drill_bundle.sh`
- `DRILL_EXECUTION_PACK.md`

Important:
- They capture validation output.
- They do not execute rollback/restore themselves.

---

## 8) Troubleshooting (Most Common)

1. `Backend Readiness` 404:
- backend uses `/ready`; verify test points to correct path.

2. Auth checks skipped or 401/400:
- missing/invalid credentials,
- account not verified,
- banned/suspended account,
- wrong DB for that environment.

3. UI tests flaky/timeouts:
- ensure frontend/backend both running,
- ensure correct `E2E_UI_BASE_URL` and `E2E_UI_API_BASE`,
- use stable selectors and avoid transient toast-only assertions.

4. Local `npx playwright test` from repo root fails URL navigation:
- use config explicitly:
  - `npx playwright test --config frontend/playwright.config.mjs`
  - or use `npm run ops:e2e:ui`.

---

## 9) Evidence and Readiness Docs

- `PRODUCTION_READINESS_GOVERNANCE_CHECKLIST.md`
- `GO_LIVE_EVIDENCE_SUMMARY.md`
- `OPS_EVIDENCE_LOG.md`
- `E2E_SMOKE_RUNBOOK.md`
- `UI_E2E_RUNBOOK.md`
- `SYNTHETIC_MONITORING_RUNBOOK.md`
- `DRILL_EXECUTION_PACK.md`

---

## 10) One-Line Summary

Run backend tests + frontend gate + synthetic + smoke + UI E2E, then capture drill evidence for operational sign-off.
