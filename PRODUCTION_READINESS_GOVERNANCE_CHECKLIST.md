# NaijaTalk Production Go/No-Go Checklist

Last updated: February 23, 2026 (drill capture evidence logged for rollback/restore validation)

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
  - `Done` baseline ops evidence log started (`OPS_EVIDENCE_LOG.md`)
  - `Done` restore validation capture evidence (`evidence/drills/20260223-042633/artifacts/restore-validation-2026-02-23T04:41:31Z.log`)
  - `In Progress` explicit backup/restore command timing + RTO/RPO evidence
- `In Progress` Deployment rollback checklist:
  - `Done` documented (`DEPLOYMENT_ROLLBACK_CHECKLIST.md`)
  - `Done` rollback validation capture evidence (`evidence/drills/20260223-042633/artifacts/rollback-validation-2026-02-23T04:40:46Z.log`)
  - `In Progress` real rollback action IDs/timings from Vercel + Render
- `In Progress` SLA dashboards for queues/failures/aging items:
  - `Done` Admin Overview SLA snapshot cards (API health, readiness, database status, uptime)
  - `Done` queue/failure/aging drill-down cards and threshold alert banners (payouts, premium audit, wallet mismatches)
  - `Done` external email alert routing with threshold + cooldown dispatch (`POST /api/users/admin/sla-alerts/dispatch`)
  - `In Progress` Slack/on-call escalation routing
    - `Done` Slack webhook alert dispatch support in SLA alert pipeline
    - `Done` on-call escalation matrix drafted (`ONCALL_ESCALATION_MATRIX.md`)
    - `Done` named owner assignment and escalation matrix ownership mapping
    - `In Progress` live escalation drill evidence
      - `Done` technical drill validation run (`ops:synthetic`, `ops:e2e:smoke`, `ops:e2e:ui` all green)
      - `In Progress` alert-channel acknowledgement evidence (Slack/email screenshots/log timestamps)
- `Done` Public governance pages are live and linked globally:
  - `Done` `/terms`, `/privacy`, `/moderation`, `/contests/terms`, `/contests/policy`
  - `Done` global footer links from all pages
  - `Done` version + change-log metadata blocks embedded in all public policy pages
  - `Done` policy governance workflow + release note process (`POLICY_GOVERNANCE_WORKFLOW.md`, `POLICY_RELEASE_NOTES_PROCESS.md`)
  - `Done` policy sign-off + changelog registers (`POLICY_SIGNOFF_REGISTER.md`, `POLICY_CHANGELOG.md`)

### P2 (Growth/Operational Maturity)

- `Done` Full e2e test suite across core user journeys.
  - `Done` API e2e smoke suite (`scripts/e2e_smoke.mjs`)
  - `Done` scheduled e2e smoke workflow (`.github/workflows/e2e-smoke.yml`)
  - `Done` browser/UI e2e coverage for thread/contest/payout UX
    - `Done` Playwright scaffolding + initial UI tests (`frontend/e2e/*.spec.ts`)
    - `Done` scheduled UI E2E workflow (`.github/workflows/ui-e2e.yml`)
    - `Done` contest submit/vote + admin payouts UI flow coverage (`frontend/e2e/advanced-flows.spec.ts`)
    - `Done` latest local run passed 7/7 (`npm run ops:e2e:ui`)
- `In Progress` Synthetic monitoring for key paths (`/api/health`, `/premium/verify`, `/users/me/wallet-ledger`, `/admin` critical pages).
  - `Done` synthetic monitor script (`scripts/synthetic_monitor.mjs`)
  - `Done` scheduled GitHub Action every 15 minutes (`.github/workflows/synthetic-monitor.yml`)
  - `Done` authenticated probe token management via credentials or tokens (`SYNTH_USER_*`, `SYNTH_ADMIN_*`, token fallback)
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

- Operational proof artifacts:
  - Live escalation drill evidence (Slack/email alert acknowledgement trace)
  - Rollback simulation execution evidence
  - Backup/restore drill execution evidence

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

Runbook shortcut:
- Generate drill evidence bundle with `bash scripts/create_drill_bundle.sh` and complete reports under `evidence/drills/<timestamp>/`.

1. Run one live SEV-1/SEV-2 escalation drill and attach alert + acknowledgement evidence.
2. Execute rollback drill on Vercel/Render and attach timestamps + validation output.
3. Execute backup/restore drill in sandbox and attach RTO/RPO evidence.
4. Run a production game-day simulation and capture fixes.
