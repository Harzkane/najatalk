# Synthetic Monitoring Runbook

## Purpose
Run scheduled probes against critical NaijaTalk endpoints and fail fast when availability/readiness regresses.

## Implemented Assets
- Script: `scripts/synthetic_monitor.mjs`
- CI schedule: `.github/workflows/synthetic-monitor.yml` (every 15 minutes + manual dispatch)
- Local command: `npm run ops:synthetic`

## Checked Paths
- Backend:
  - `GET /health`
  - `GET /ready`
  - `GET /api/threads`
  - `GET /api/contests`
- Frontend:
  - `GET /`
  - `GET /contests`
- Authenticated checks (if token or credentials are provided):
  - `GET /api/users/me`
  - `GET /api/users/me/wallet-ledger`
  - `GET /api/premium/my-payments`
- Admin check (if token or credentials are provided):
  - `POST /api/users/admin/sla-alerts/dispatch?dryRun=true`

## Env Variables
For local/script usage:
- `SYNTH_BACKEND_BASE` (default `http://localhost:8000`)
- `SYNTH_FRONTEND_BASE` (default `http://localhost:3000`)
- `SYNTH_USER_EMAIL` + `SYNTH_USER_PASSWORD` (optional)
- `SYNTH_ADMIN_EMAIL` + `SYNTH_ADMIN_PASSWORD` (optional)
- `SYNTH_USER_TOKEN` (optional fallback)
- `SYNTH_ADMIN_TOKEN` (optional fallback)
- `SYNTH_TIMEOUT_MS` (default `12000`)

For GitHub Actions secrets:
- `SYNTH_BACKEND_BASE`
- `SYNTH_FRONTEND_BASE`
- `SYNTH_USER_EMAIL` + `SYNTH_USER_PASSWORD` (optional)
- `SYNTH_ADMIN_EMAIL` + `SYNTH_ADMIN_PASSWORD` (optional)
- `SYNTH_USER_TOKEN` (optional fallback)
- `SYNTH_ADMIN_TOKEN` (optional fallback)

Credential requirement:
- Credential values must belong to real users in the same DB backing `SYNTH_BACKEND_BASE`.
- If credentials are present, monitor uses fresh login tokens first.

## Operational Response
If a scheduled run fails:
1. Check failing check name and status line in workflow logs.
2. Validate service health manually (`/health`, `/ready`).
3. Check recent deploys on Render/Vercel.
4. If payments/wallet/admin checks fail, use `INCIDENT_RUNBOOK_P0.md` for escalation.

## Notes
- `ready` must return HTTP 200 for pass. A 503 should be treated as actionable.
- Script exits non-zero if any probe fails.
