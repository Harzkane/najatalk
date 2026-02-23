# NaijaTalk Project Plan (Current State)

**Last Updated:** February 22, 2026  
**Product:** NaijaTalk (Forum + Marketplace + Wallet + Premium + Admin Ops)

---

## 1. Product Mission

Build and scale a Nigerian community platform that combines:
- Forum conversations and moderation
- Marketplace transactions with escrow-style controls
- User wallet economy (tips, payouts, premium)
- Strong admin governance and auditability

---

## 2. Current Platform Snapshot

### 2.1 Backend Surface (Live Modules)

Implemented API domains:
- `auth` (signup/login/email verification)
- `threads` (create/read/reply/search/report/engagement)
- `users` (profiles, bans, appeals, wallet ledger, payouts, admin user ops)
- `premium` (initiate/verify/webhook/admin premium audits)
- `marketplace` (listings, buy flow, shipping/release, favorites, boost)
- `ads` (create/review/approve/reject/impressions/clicks)
- `contests` (create/list/review/vote/winner-claim lifecycle)

Main API mount points are configured in `backend/index.js`.

### 2.2 Frontend Surface

Major web areas:
- Public/forum homepage and thread views
- Authentication and user profile flows
- Marketplace pages
- Wallet/premium pages
- Multi-section admin dashboard with section routing (`/admin` + `/admin/[section]`)

---

## 3. Completed Major Upgrades

## 3.1 Admin Dashboard 360 Expansion

Delivered sections now include:
- Overview
- Admin Actions
- Users
- Threads
- Moderation Reports
- Users & Bans
- Ads Review
- Payouts
- Premium Audit
- Settlement Rollups
- Wallet Alerts
- Platform Wallet
- Contests

### 3.2 Users & Access Governance

Implemented:
- Admin user listing with search/filter/pagination
- Role updates with guardrails (`user/mod/admin/super_admin` policies)
- Suspend/unsuspend workflows
- User 360 panel (stats + recent admin actions)
- Admin action logs with query/date filters + pagination

### 3.3 Threads Governance

Implemented:
- Admin thread listing with search/status filters + pagination
- Thread 360 details
- Thread admin controls: delete, lock/unlock, pin/unpin
- Report review and dismiss flows
- Like/bookmark/solved support in thread system

### 3.4 Payout Operations

Implemented:
- Payout queue with server-side filters/pagination
- Approve/reject payout actions
- Payout 360 details (wallet state + ledger trail)
- CSV/PDF export support in admin UI

### 3.5 Premium Audit Operations

Implemented:
- Admin premium payment audit table
- Filters: status/source/mismatch/date/query + pagination
- Premium payment 360 details
- Webhook verification pipeline and verification attempts tracking

### 3.6 Settlement Rollups (Phase 2)

Implemented:
- Rollup buckets (`daily/monthly`) with status/date/timezone filters
- Rollup CSV export
- Rollup bucket 360 drilldown endpoint and UI
- Drilldown pagination

### 3.7 Wallet Alerts (Phase 2)

Implemented:
- Wallet mismatch scanner
- Filters: search/severity/min-delta/date
- Server-side pagination
- Wallet mismatch 360 details (user/wallet/tx/ledger context)
- Jump from mismatch details to User 360

### 3.8 Users & Bans / Ads Review Hardening

Implemented now:
- `Users & Bans` upgraded with search, appeal-status filter, suspended-only toggle, date filters, pagination, summary cards
- `Ads Review` upgraded with search, status/type/date filters, pagination, summary cards
- New admin ads endpoint for scalable moderation review (`/api/ads/admin/review`)

### 3.9 Platform Wallet 360

Implemented:
- Platform wallet overview endpoint with net-flow summary
- Platform wallet entries endpoint with server-side pagination and filters (status, kind, date, query)
- Platform wallet entry details endpoint (`360`) with transaction/ledger/contest context
- Admin UI section and navigation for platform wallet operations

### 3.10 Contest Lifecycle Hardening

Implemented:
- Contest submission moderation in admin 360 (`approve/reject/winner`)
- Winner claim request flow for users
- Admin claim review with approval/rejection notes
- Wallet credit on approved claim and payout reference tracking
- Guide docs for user flow, admin lifecycle, and sample completion

---

## 4. Core Domain Capabilities (Functional)

### 4.1 Forum & Community
- Thread creation, retrieval, replying, search
- Report system and moderation actions
- Engagement actions (like/bookmark/solved)

### 4.2 User Account & Profile
- Signup/login/email verification
- Profile completeness and profile update
- Public profile view
- Flair updates

### 4.3 Wallet Economy
- Tip send/verify/history checks
- Wallet ledger and statement export
- Payout request and admin payout decisions
- Ledger-aware admin reconciliation tooling
- Platform wallet operational visibility and 360 audit drilldown

### 4.4 Premium Subscription
- Payment initiation/verification
- Wallet-based premium subscribe path
- Paystack webhook handling with signature verification
- Admin audit and user payment history views

### 4.5 Marketplace
- Listing lifecycle (create/update/delete/read)
- Purchase and transaction paths
- Shipping/release actions
- Favorites and boosting
- Marketplace policy and platform wallet visibility

### 4.6 Advertising
- Ad creation with wallet budget lock
- Admin moderation/approval workflows
- Impression and click tracking
- Budget decrement and expiry logic

### 4.7 Contests
- Contest setup and publishing lifecycle
- User submission flow with ownership checks
- Voting on approved entries
- Winner claim and payout-review workflow

---

## 5. Quality, Security, and Governance State

In place:
- Auth middleware for protected endpoints
- Role/permission checks in admin-sensitive flows
- Admin action logging for governance events
- Paystack webhook signature verification
- Pagination support across most heavy admin datasets
- Payment reliability hardening for premium flows:
  - strict verification state checks (`initiated` only),
  - idempotent processing claim path (`initiated -> processing`),
  - explicit NGN currency enforcement,
  - reduced sensitive logging and rate-limited verify endpoint.

Needs further hardening:
- Unified rate limiting strategy across auth/write-heavy endpoints
- Broader automated testing coverage (unit + integration + e2e)
- Centralized structured audit telemetry and alerting
- Policy docs refresh aligned with current feature scope
- Contest anti-fraud controls for vote integrity and abuse-rate patterns

---

## 6. High-Priority Next Phases

## Phase 3: Operational Reliability
- Add automated reconciliation jobs + anomaly alerts for payouts/premium/wallet
- Add retry-safe idempotency patterns on money-moving endpoints
- Add admin SLA dashboard cards (queue age, stuck transactions, failure rates)

## Phase 4: Trust & Abuse Prevention
- Add stronger anti-spam/anti-abuse signals on thread/report flows
- Add moderated ban reason templates and escalation categories
- Add fraud heuristics for wallet/tip/ad abuse patterns

## Phase 5: Product Scale & UX
- Add caching and query optimization for high-traffic forum/listing views
- Expand admin bulk actions with safer guardrails and dry-run previews
- Improve mobile admin readability and dense-table ergonomics

---

## 7. Immediate Execution Checklist

1. Run full TypeScript/lint/build in local CI environment and fix any regressions.
2. Add integration tests for:
   - `/api/users/banned` filters/pagination
   - `/api/ads/admin/review` filters/pagination
   - payout rollup bucket drilldown
   - wallet mismatch details flow
3. Add a changelog process so plan/status stays aligned with shipped code.

---

## 8. Summary

NaijaTalk has moved from a basic forum direction into a multi-domain platform with:
- meaningful admin governance,
- financial operations visibility,
- premium/payment observability,
- and scalable moderation tooling.

Current priority is reliability and abuse-hardening so growth does not outpace control.
