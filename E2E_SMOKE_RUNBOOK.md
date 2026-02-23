# E2E Smoke Runbook

## Purpose
Validate critical NaijaTalk API journeys in one lightweight suite that can run locally and on schedule.

## Script
- `scripts/e2e_smoke.mjs`
- Root command: `npm run ops:e2e:smoke`
- CI workflow: `.github/workflows/e2e-smoke.yml`

## Coverage
Public checks:
- `GET /health`
- `GET /ready`
- `GET /api/threads`
- `GET /api/contests`

User-auth checks (if user creds/token provided):
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/users/me/wallet-ledger`
- `GET /api/premium/my-payments`
- `POST /api/premium/verify` (validation path, expects `400` for missing reference)

Admin checks (if admin creds/token provided):
- `POST /api/auth/login`
- `GET /api/users/admin/users`
- `GET /api/users/admin/actions`
- `POST /api/users/admin/sla-alerts/dispatch?dryRun=true`

## Environment Variables
- `E2E_BACKEND_BASE` (default `http://localhost:8000`)
- `E2E_TIMEOUT_MS` (default `15000`)
- `E2E_RETRIES` (default `0` local, `2` hosted URL)
- `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` (optional)
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (optional)
- `E2E_USER_TOKEN` (optional; skips login if provided)
- `E2E_ADMIN_TOKEN` (optional; skips login if provided)

Credential requirement:
- `E2E_USER_*` and `E2E_ADMIN_*` must be real users already created in the same database used by `E2E_BACKEND_BASE`.
- If `E2E_BACKEND_BASE=http://localhost:8000`, users must exist in local DB.
- If `E2E_BACKEND_BASE` points to Render/production, users must exist there.
- Accounts should be `isVerified=true`, not banned, and not suspended.

## Local Example
```bash
E2E_BACKEND_BASE=http://localhost:8000 \
E2E_USER_EMAIL="user@example.com" \
E2E_USER_PASSWORD="password" \
E2E_ADMIN_EMAIL="admin@example.com" \
E2E_ADMIN_PASSWORD="password" \
npm run ops:e2e:smoke
```

Quick backend-target runs:
```bash
E2E_BACKEND_BASE=http://localhost:8000 npm run ops:e2e:smoke
E2E_BACKEND_BASE=https://najatalk.onrender.com npm run ops:e2e:smoke
```

If `E2E_USER_*` / `E2E_ADMIN_*` are not configured, login checks may fail or authenticated checks will be skipped.  
For full pass coverage, provide valid user/admin credentials or tokens.

Local convenience:
- `scripts/e2e_smoke.mjs` auto-loads `backend/.env` if present.
- Exported shell vars still take priority and will not be overridden.
- When credentials are provided, script prefers fresh login tokens over static `E2E_*_TOKEN` values.

## GitHub Secrets (for scheduled workflow)
- `E2E_BACKEND_BASE`
- `E2E_USER_EMAIL` + `E2E_USER_PASSWORD`
- `E2E_ADMIN_EMAIL` + `E2E_ADMIN_PASSWORD`

or token-based:
- `E2E_USER_TOKEN`
- `E2E_ADMIN_TOKEN`

## Failure Response
1. Check failing endpoint/status in workflow logs.
2. If auth failures: rotate or refresh test credentials/tokens.
3. If admin SLA dry-run fails: inspect `/api/users/admin/sla-alerts/dispatch` and `users` controller logs.
4. Escalate using `INCIDENT_RUNBOOK_P0.md` for money/admin path failures.
