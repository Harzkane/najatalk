PATH="/usr/local/opt/node@22/bin:$PATH"


https://github.com/flarum/framework?tab=readme-ov-file 

primetaker10@gmail.com
https://najatalk.onrender.com

Recommended Premium Upgrade Plan

Phase P1 (Data + Logic)
Add premiumStatus, premiumPlan, premiumStartedAt, premiumExpiresAt, nextBillingAt, cancelAtPeriodEnd; migrate from boolean-only entitlement.

Phase P2 (Payment Reliability) [Completed - February 22, 2026]
Implemented strict payment verification state gating, idempotent verify/webhook claim flow, explicit currency checks (NGN-only), structured non-sensitive logging, and verification-rate limiting.

Phase P3 (UX)
Split Premium page into sections/tabs: Subscription, Benefits, Billing History, Manage.

Phase P4 (Ops)
Add admin Premium reconciliation dashboard + export + mismatch detector (similar to wallet ops quality).

I can start implementing Phase P1 immediately in one pass (schema + migration-safe logic + endpoint updates + UI state wiring).



Pragmatic rollout

Phase 1: extract shared AdminShell (sidebar + topbar) and move current sections into routes/tabs.
Phase 2: redesign highest-traffic sections first (Moderation, Payouts, Ads).
Phase 3: add advanced workflows (bulk ops, saved views, keyboard shortcuts).
