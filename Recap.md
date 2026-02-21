https://github.com/flarum/framework?tab=readme-ov-file 


Recommended Premium Upgrade Plan

Phase P1 (Data + Logic)
Add premiumStatus, premiumPlan, premiumStartedAt, premiumExpiresAt, nextBillingAt, cancelAtPeriodEnd; migrate from boolean-only entitlement.

Phase P2 (Payment Reliability)
Implement strict payment state machine + idempotent verify/webhook handlers + currency checks + reduced sensitive logging.

Phase P3 (UX)
Split Premium page into sections/tabs: Subscription, Benefits, Billing History, Manage.

Phase P4 (Ops)
Add admin Premium reconciliation dashboard + export + mismatch detector (similar to wallet ops quality).

I can start implementing Phase P1 immediately in one pass (schema + migration-safe logic + endpoint updates + UI state wiring).