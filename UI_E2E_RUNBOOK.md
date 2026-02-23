# UI E2E Runbook

## Purpose
Validate browser-level user journeys for threads, contests, and admin dashboard access.

## Implemented Assets
- Playwright config: `frontend/playwright.config.mjs`
- Tests:
  - `frontend/e2e/public-smoke.spec.ts`
  - `frontend/e2e/authenticated-ui.spec.ts`
  - `frontend/e2e/advanced-flows.spec.ts`
- Commands:
  - `npm run ops:e2e:ui`
  - `npm run e2e:ui --prefix frontend`
- Scheduled CI workflow:
  - `.github/workflows/ui-e2e.yml` (every 12 hours + manual dispatch)

## Test Coverage (Initial)
- Public pages render:
  - `/`
  - `/threads`
  - `/contests`
- Authenticated user path:
  - API login
  - Open `/threads`
  - Open compose panel and verify thread form appears
- Authenticated admin path:
  - API login
  - Open `/admin`
  - Verify dashboard heading + overview section
- Advanced contest flow:
  - Admin creates live contest via API
  - User creates thread via API
  - User submits contest entry via API
  - Admin approves submission via API
  - User opens `/contests` and votes through UI button
- Admin payouts flow:
  - Open `/admin/payouts`
  - Verify payout reconciliation section and decision controls visibility

## Environment Variables
- `E2E_UI_BASE_URL` (default `http://localhost:3000` local, workflow default points to Vercel)
- `E2E_UI_API_BASE` (default `http://localhost:8000/api`)
- `E2E_UI_ALLOW_MUTATIONS` (default `false`; set `true` only for local/manual advanced mutation flows)
- `E2E_UI_USER_EMAIL`, `E2E_UI_USER_PASSWORD` (optional; skips user-auth test if missing)
- `E2E_UI_ADMIN_EMAIL`, `E2E_UI_ADMIN_PASSWORD` (optional; skips admin-auth test if missing)
- Fallbacks supported: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`

Credential requirement:
- Authenticated UI tests only run if credentials belong to real users in the DB behind `E2E_UI_API_BASE`.
- For local API (`http://localhost:8000/api`), credentials must exist in local DB.
- For hosted API, credentials must exist in that hosted DB.
- Accounts should be verified and active (not banned/suspended), and admin tests require admin/super_admin role.

## Local Run
```bash
npm install --prefix frontend
npx playwright install --with-deps chromium --prefix frontend

E2E_UI_BASE_URL=http://localhost:3000 \
E2E_UI_API_BASE=http://localhost:8000/api \
E2E_UI_ALLOW_MUTATIONS=true \
E2E_UI_USER_EMAIL="user@example.com" \
E2E_UI_USER_PASSWORD="password" \
E2E_UI_ADMIN_EMAIL="admin@example.com" \
E2E_UI_ADMIN_PASSWORD="password" \
npm run ops:e2e:ui
```

Alternative command from repo root (supported after absolute URL patch):
```bash
npx playwright test --config frontend/playwright.config.mjs
```

## GitHub Secrets
- `E2E_UI_BASE_URL`
- `E2E_UI_API_BASE`
- `E2E_UI_USER_EMAIL`
- `E2E_UI_USER_PASSWORD`
- `E2E_UI_ADMIN_EMAIL`
- `E2E_UI_ADMIN_PASSWORD`

## Next Expansion
- Add wallet/premium success path assertions.
- Add contest winner claim + admin claim approval UI assertions.

## Safety Note
- `advanced-flows.spec.ts` creates contest/thread/submission records through API; keep `E2E_UI_ALLOW_MUTATIONS=false` in scheduled production workflows.
