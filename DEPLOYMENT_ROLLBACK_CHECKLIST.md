# NaijaTalk Deployment Rollback Checklist

Last updated: February 23, 2026

## Purpose

Use this checklist when a release introduces production instability and we need to quickly restore stable service.

## Release Topology

- Frontend: Vercel (`https://najatalk-talk.vercel.app/`)
- Backend: Render (`https://najatalk.onrender.com`)

## Rollback Triggers

Rollback immediately if any of these are true:

1. Auth, premium, payout, contest, or wallet flows have broken for many users.
2. Money-flow inconsistency is detected (ledger/wallet mismatch).
3. Error rate spike persists for more than 10 minutes after hotfix attempt.
4. Admin operations are blocked and no safe workaround exists.

## Pre-Rollback Snapshot

1. Capture incident timestamp and suspected release SHA.
2. Save current frontend deployment ID (Vercel).
3. Save current backend release ID (Render).
4. Export key logs around failure window.
5. Freeze risky admin actions temporarily:
   - payout approvals
   - contest claim approvals

## Frontend Rollback (Vercel)

1. Open Vercel project `najatalk-talk`.
2. Select the last known-good deployment.
3. Promote/redeploy it to production.
4. Validate:
   - `/`
   - `/threads`
   - `/premium`
   - `/admin`

## Backend Rollback (Render)

1. Open Render service for backend API.
2. Locate previous successful deploy.
3. Roll back to that version.
4. Validate API health:
   - `GET /api/health`
   - `GET /api/ready`
5. Validate critical endpoints with authenticated smoke checks:
   - premium verify status check
   - payout request (non-destructive test account)
   - admin payout list/details

## Post-Rollback Validation

1. Confirm frontend-backend compatibility (no schema/contract mismatch).
2. Confirm logs have returned near baseline.
3. Confirm no stuck `processing` premium records are accumulating.
4. Confirm payout queue can be viewed and acted on safely.
5. Confirm admin dashboard core sections load normally.

## Communication

1. Internal status note:
   - what was rolled back
   - when
   - current impact
2. External status message (if needed):
   - degraded period
   - recovery confirmed
   - user action required (if any)

## Follow-up Actions (within 24 hours)

1. Open root-cause issue with owner.
2. Add or update automated test covering failure mode.
3. Add release guardrail to prevent repeat.
4. Document final timeline in incident log.
