# NaijaTalk Master Guide

Last updated: February 23, 2026  
Audience: Users, admins, partners, contributors, and non-technical readers

---

## 1) What NaijaTalk Is

NaijaTalk is a Nigerian platform where people can:
- talk (forum/community discussions),
- trade (marketplace listings and transactions),
- and earn (tips, wallet flows, premium features),
all in one product.

Simple idea:
- Better than a basic forum.
- Safer than unmanaged community spaces.
- More useful because conversation, commerce, and wallet tools are connected.

---

## 2) Why NaijaTalk Exists

Many products handle only one thing:
- discussion only, or
- buying/selling only, or
- payments only.

NaijaTalk combines all three and adds strong operations/governance from day one:
- cleaner conversations,
- clearer moderation,
- better trust around money and payouts,
- stronger admin visibility.

---

## 3) Who It Is For

- Everyday users who want better local community discussions.
- Creators who want visibility and monetization options.
- Sellers who want community + commerce together.
- Admin/moderation teams who need audit-ready controls.
- Sponsors/brands running campaigns and contests.

---

## 4) What Users Can Do

### Community
- Create threads and replies.
- Search and discover conversations.
- Like, bookmark, and engage.
- Report harmful or abusive content.

### Marketplace
- Create/manage listings.
- Buy/sell through transaction flows.
- Track states like shipping/release.

### Wallet + Earnings
- Send and receive tips.
- View wallet ledger/history.
- Request payouts.

### Premium
- Subscribe to premium flows.
- Verify payment.
- View payment history.

### Contests
- Join live contests.
- Create contest entries (usually with your own thread/listing).
- Vote on approved entries.
- If you win: request prize payout and track claim status.

---

## 5) What Admins Can Do (Admin 360)

NaijaTalk has an operations-focused admin dashboard with sections for:
- Overview
- Users
- Threads
- Reports
- Users & Bans
- Ads Review
- Payout Reconciliation
- Premium Audit
- Settlement Rollups
- Wallet Alerts
- Platform Wallet 360
- Contests
- Risk Signals
- Admin Actions logs

Admin capabilities include:
- Role updates with guardrails.
- Ban/suspend/appeal handling.
- Thread moderation and report dismissal.
- Payout approve/reject + 360 details.
- Premium audit and mismatch investigation.
- Wallet anomaly investigation.
- Contest moderation (approve/reject/winner + claim review).
- Action logging for auditability.

---

## 6) Contest System (Simple End-to-End)

### How contest visibility works
- User submits entry -> status is `pending`.
- Admin reviews entry:
  - `approved` => visible to public for voting.
  - `rejected` => hidden from public leaderboard.
  - `winner` => winner selected; contest can close.

Why some users may not see Vote/Unvote:
- Vote buttons appear only for approved/winner entries.
- Pending entries are not publicly votable.

### Contest statuses
- `draft`: setup only, not open.
- `live`: open for submissions and voting (as configured).
- `closed`: ended.
- `archived`: history.

### Winner payout flow
1. Admin marks winner.
2. Winner submits prize claim details.
3. Admin reviews claim.
4. Admin approves claim and pays.
5. Winner wallet is credited and payout reference is recorded.

Important:
- Winning does not auto-credit wallet before claim review.

### Sponsor model
Contests can be:
- Platform-funded, or
- Sponsor-funded (brand campaign).

Admin still governs fairness, moderation, and payout workflow.

---

## 7) Trust, Safety, and Governance

Implemented safeguards include:
- Role-based access control.
- Admin action logs.
- Moderation report workflows.
- Payment webhook verification.
- Server-side pagination/filtering on heavy admin tables.
- Risk signal APIs (wallet/payout abuse and contest integrity indicators).

Public policy/governance pages are live:
- `/terms`
- `/privacy`
- `/moderation`
- `/contests/terms`
- `/contests/policy`

Governance process docs exist for:
- policy updates,
- release notes,
- signoff tracking,
- changelog history.

---

## 8) Technical Architecture (High Level)

- Frontend: Next.js (React, TypeScript, Tailwind)
- Backend: Node.js + Express + Mongoose
- Database: MongoDB
- Auth: JWT
- Payments: Paystack (with signature verification)

API domains (mounted under `/api`):
- `/api/auth`
- `/api/threads`
- `/api/users`
- `/api/premium`
- `/api/marketplace`
- `/api/ads`
- `/api/contests`

Deployment:
- Frontend (Vercel): `https://najatalk-talk.vercel.app/`
- Backend (Render): `https://najatalk.onrender.com`

---

## 9) Operations, Monitoring, and Drills

### Continuous checks
- Synthetic monitor checks backend/frontend and key API paths.
- API E2E smoke checks core public/auth/admin flows.
- UI E2E (Playwright) checks key user/admin journeys.

### Admin low-cost health check
Admin Overview includes:
- `Ops Quick Check` (lightweight endpoint probes only).
- Safe for routine checks.
- Does not run heavy browser suites or rollback/restore scripts.

### Drill evidence commands (terminal/CI)
- `ops:drill:rollback:capture`: captures post-rollback validation evidence.
- `ops:drill:restore:capture`: captures post-restore validation evidence.

Important:
- These capture evidence after drill actions.
- They do not perform the actual rollback/restore for you.

---

## 10) Current Readiness Status

Current position:
- Ready for **controlled production user testing**.
- Not yet fully ready for **full public scale launch**.

Reason:
- Core reliability and admin governance are strong.
- A few operational proof artifacts remain.

Known green evidence:
- Synthetic: `10/10` pass.
- API E2E smoke: `13/13` pass.
- UI E2E: `7/7` pass.

Still required for full-scale go-live:
1. Live SEV drill acknowledgement evidence (email/Slack/on-call).
2. Real rollback execution IDs/timestamps (Vercel + Render).
3. Full backup/restore execution evidence with measured RTO/RPO.

---

## 11) Product and Business Positioning

Core product message:
- A modern Nigerian community platform with better quality, trust, and utility.

Value pillars:
- Cleaner, safer discussions.
- Community + marketplace + wallet in one place.
- Operational transparency and governance for reliability.

Monetization paths:
- Premium subscriptions
- Ads revenue
- Marketplace-related fees
- Listing boost spend
- Sponsor contest campaigns

---

## 12) Practical Playbooks

### For a normal user
1. Create account and profile.
2. Start/join threads.
3. Explore marketplace.
4. Join live contests and submit entries.
5. Vote on approved entries.
6. Use wallet/tips/payout features as needed.

### For an admin
1. Open `/admin` and review overview.
2. Run `Ops Quick Check`.
3. Process moderation queues.
4. Process payouts/premium audits.
5. Review wallet alerts/risk signals.
6. Manage contests and winner claims.
7. Capture operational drill evidence in terminal/CI.

---

## 13) Master Doc Map (If You Need Full Detail)

- `README.md`
- `PLATFORM_OVERVIEW.md`
- `NAIJATALK_PROJECT_PLAN.md`
- `PRODUCTION_READINESS_GOVERNANCE_CHECKLIST.md`
- `GO_LIVE_EVIDENCE_SUMMARY.md`
- `OPS_EVIDENCE_LOG.md`
- `CONTEST_FOR_USERS_SIMPLE_GUIDE.md`
- `CONTEST_LIFECYCLE_ADMIN_GUIDE.md`
- `CONTEST_SAMPLE_COMPLETION_GUIDE.md`
- `DRILL_EXECUTION_PACK.md`
- `TESTING_MASTER_GUIDE.md`
- `DEPLOYMENT_ROLLBACK_CHECKLIST.md`
- `BACKUP_RESTORE_DRILL.md`
- `INCIDENT_RUNBOOK_P0.md`
- `ONCALL_ESCALATION_MATRIX.md`
- `DATA_RETENTION_ARCHIVE_POLICY.md`

---

## 14) One-Line Summary

NaijaTalk is a trust-first Nigerian platform that unifies discussion, commerce, and wallet operations, with strong admin governance and growing production readiness.
