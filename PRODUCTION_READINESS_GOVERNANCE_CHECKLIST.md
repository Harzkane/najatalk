# NaijaTalk Production Go/No-Go Checklist

Last updated: February 23, 2026 (P2 monitoring and retention foundations added)

## 1. Decision Summary

- Current recommendation: **GO for controlled beta**, **NO-GO for full public scale launch**.
- Why:
  - Core reliability and admin governance are strong.
  - Some operational, compliance, and release-process controls still need completion.

## 2. Production Readiness Checklist

Mark each item as `Done` / `In Progress` / `Blocked`.

### P0 (Must-Have for Full Production)

- `Done` Backend health/readiness endpoints and tests are passing.
- `Done` Rate limiting is in place for auth, money, and write-heavy routes.
- `Done` Payment reliability hardening is in place (premium verify/webhook state checks + idempotent claim flow).
- `Done` Payout decision/request logic uses transactional safety.
- `Done` Frontend CI gate (lint + build + typecheck) enforced in repository CI workflow.
- `Done` Critical money-flow reliability tests added for premium verification rules and payout guardrail rules.
- `In Progress` Error monitoring + alert routing (Sentry/log alerts + owner on-call).
- `Done` Incident runbook for payments/webhook/queue spikes (`INCIDENT_RUNBOOK_P0.md`).

### P1 (Strongly Recommended Before Scale-Up)

- `Done` Admin 360 sections exist (users, threads, payouts, premium, wallet, contests, ads).
- `In Progress` Abuse/fraud detection heuristics:
  - `Done` backend risk-signal APIs for wallet/payout abuse and contest vote-integrity anomalies
  - `Done` admin UI surfacing (`Risk Signals` section in Admin dashboard)
  - `In Progress` playbook automation and enforcement workflows
- `In Progress` Backup and restore drill:
  - `Done` documented (`BACKUP_RESTORE_DRILL.md`)
  - `In Progress` restore drill execution evidence
- `In Progress` Deployment rollback checklist:
  - `Done` documented (`DEPLOYMENT_ROLLBACK_CHECKLIST.md`)
  - `In Progress` rollback simulation evidence
- `In Progress` SLA dashboards for queues/failures/aging items:
  - `Done` Admin Overview SLA snapshot cards (API health, readiness, database status, uptime)
  - `Done` queue/failure/aging drill-down cards and threshold alert banners (payouts, premium audit, wallet mismatches)
  - `Done` external email alert routing with threshold + cooldown dispatch (`POST /api/users/admin/sla-alerts/dispatch`)
  - `In Progress` Slack/on-call escalation routing

### P2 (Growth/Operational Maturity)

- `In Progress` Full e2e test suite across core user journeys.
  - `Done` API e2e smoke suite (`scripts/e2e_smoke.mjs`)
  - `Done` scheduled e2e smoke workflow (`.github/workflows/e2e-smoke.yml`)
  - `In Progress` browser/UI e2e coverage for thread/contest/payout UX
- `In Progress` Synthetic monitoring for key paths (`/api/health`, `/premium/verify`, `/users/me/wallet-ledger`, `/admin` critical pages).
  - `Done` synthetic monitor script (`scripts/synthetic_monitor.mjs`)
  - `Done` scheduled GitHub Action every 15 minutes (`.github/workflows/synthetic-monitor.yml`)
  - `In Progress` authenticated token management for production-grade probes
- `In Progress` Data retention and archive policy for logs/audit exports.
  - `Done` retention policy + runbook (`DATA_RETENTION_ARCHIVE_POLICY.md`)
  - `Done` retention eligibility report script (`backend/scripts/retention_report.mjs`)
  - `In Progress` archive execution + restore proof

## 3. Governance Scorecard

### What is strong now

- Role and permission controls across admin-sensitive endpoints.
- Admin action logging and operational 360 visibility.
- Payment webhook signature validation.
- Server-side pagination/filtering for heavy admin datasets.

### What still needs work

- Formal policy/legal coverage and publication:
  - Privacy Policy
  - Terms of Service
  - Contest Terms and Prize Rules
  - Moderation/Appeal Policy
- Operational governance:
  - Incident response ownership
  - Escalation timelines
  - Postmortem process
- Compliance/governance traceability:
  - Versioned policy changelog
  - Clear enforcement mapping between policy and admin actions

## 4. Go/No-Go Gates

Use this before each release:

1. **Gate A (Technical):** All backend tests pass + frontend lint/build/typecheck pass.
2. **Gate B (Money Flows):** Premium, payouts, and wallet reconciliation smoke tests pass.
3. **Gate C (Ops):** Monitoring and alert paths confirmed for production.
4. **Gate D (Governance):** Public policy pages are live and internally reviewed.
5. **Gate E (Rollback):** Rollback steps tested for both Vercel frontend and Render backend.

If any Gate A/B fails: **No-Go**.
If Gate C/D/E are incomplete: only **limited beta Go**.

## 5. Immediate Next Actions

1. Implement monitoring + alert routing ownership (Sentry/log stream + escalation owners).
2. Expand money-flow tests to full API integration/e2e (premium verify/webhook + payout decision/reversal).
3. Publish policy pages and link them from footer and contest flows.
4. Define on-call rotation and incident escalation matrix.
5. Run a production game-day simulation and capture fixes.
