# NaijaTalk P0 Incident Runbook

Last updated: February 22, 2026

## Scope

P0 production incidents for:
- premium payments
- payout processing
- webhook delivery/verification
- queue/latency spikes on critical endpoints

## Severity

- `SEV-1`: money movement integrity risk, widespread outage, or auth bypass.
- `SEV-2`: degraded core flows (premium verify/payout actions failing for many users).
- `SEV-3`: partial feature degradation with workaround.

## Immediate Triage (first 10 minutes)

1. Confirm blast radius (`frontend`, `backend`, or both).
2. Check `/api/health` and `/api/ready`.
3. Check recent deploys (Vercel + Render).
4. Check logs for:
   - `premium.verify.error`
   - `premium.webhook.error`
   - payout decision/request failures
5. Freeze risky admin actions if integrity is uncertain.

## Premium Verify/Webhook Failure

1. Validate Paystack signature header handling in `/api/premium/webhook`.
2. Confirm `PAYSTACK_SECRET` and env consistency across instances.
3. Confirm payment state transitions are not stuck in `processing`.
4. Run targeted replay only for known-safe references.
5. If mismatch risk exists, halt auto-activation and move to manual review queue.

## Payout Failure

1. Inspect pending payout queue and recent admin decisions.
2. Confirm transactional writes are completing:
   - transaction status
   - wallet balance
   - wallet ledger
3. For failed/reversed payouts, verify refund ledger effect exists.
4. If inconsistency is detected, pause payout approvals and open reconciliation incident.

## Queue/Latency Spike

1. Identify endpoint hotspots and request classes.
2. Check rate limiter headers and block rates.
3. Scale backend service if CPU/memory bound.
4. Temporarily reduce non-critical jobs or heavy admin exports.

## Comms Template

- Internal:
  - "Incident open: <type>, severity <SEV>, started <time>, impact <summary>."
- External (if needed):
  - "We are investigating degraded service for <feature>. No action required from users yet."

## Exit Criteria

Incident can be closed when:
1. Error rate returns to baseline.
2. Money-flow consistency checks pass.
3. Backlog queue is drained or controlled.
4. Post-incident actions are logged with owners and deadlines.
