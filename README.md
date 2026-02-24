# NaijaTalk

NaijaTalk is a Nigerian community platform where people can talk, trade, and earn in one place.

People can:

- discuss topics (threads and replies),
- buy and sell safely (marketplace flow),
- support creators (tips),
- use premium features,
- and trust that moderation and financial operations are monitored by a strong admin system.

Core identity:

- NaijaTalk is a modern Nigerian conversation platform built around clarity, trust, and community quality.

Primary user positioning:

- NaijaTalk helps Nigerians have better discussions in a cleaner, safer, and more rewarding forum experience.

Platform positioning (operators/partners):

- NaijaTalk combines community, commerce, and wallet-enabled operations with strong governance visibility.

## Current Metrics Snapshot

> Update this block monthly with real numbers.

- Snapshot date: `YYYY-MM-DD`
- Registered users: `TBD`
- Monthly active users (MAU): `TBD`
- Total threads: `TBD`
- Total contest entries: `TBD`
- Marketplace listings: `TBD`
- Gross wallet volume (₦): `TBD`
- Payouts processed (count / ₦): `TBD`

## Business Snapshot

### Why It Matters

- Most platforms isolate discussion, commerce, or payments; NaijaTalk combines all three.
- Trust and governance are built in early through admin 360 operations.
- This reduces moderation blind spots and improves platform reliability as usage grows.

### Who It’s For

- Users who want safer conversations and transparent moderation.
- Creators who want engagement plus monetization paths.
- Sellers who need community + commerce in one flow.
- Sponsors/partners that need measurable campaign and governance signals.

### How NaijaTalk Makes Money

- Premium subscriptions
- Ad revenue
- Marketplace-related transaction fees
- Listing boost spend
- Future transaction-margin products (policy-controlled)

## Live Environments

- Frontend (Vercel): `https://najatalk-talk.vercel.app/`
- Backend API (Render): `https://najatalk.onrender.com`

## For Everyone (Non-Technical)

If you are not a developer, here is what NaijaTalk means in simple terms:

- It is a community platform for real conversations, not just posting.
- It includes a marketplace so people can buy/sell with better trust controls.
- It includes wallet features so users can tip and receive payouts.
- It includes premium subscriptions for additional value.
- It includes active admin oversight to reduce abuse, fraud risk, and confusion.

### Why NaijaTalk Is Different

- Community + commerce + wallet, in one product.
- Admin tools are not basic; they include deep 360 views for users, threads, payouts, premium, and wallet alerts.
- The platform is designed for operational visibility, not only user-facing screens.

### Vision

NaijaTalk aims to become Nigeria's most trusted digital community infrastructure, where conversation, commerce, and creator value can grow under transparent governance.

### Who Benefits

- Users: safer discussions, clearer moderation, more transparency.
- Creators: tipping and premium-driven value.
- Sellers: listing and transaction flows with stronger controls.
- Moderators/Admins: dashboards and audit tools for faster decisions.
- Partners/Investors: clearer operational signals and governance direction.

## Platform Overview

- Community users and creators
- Buyers and sellers
- Moderators and trust/safety operators
- Product, operations, and engineering teams
- Potential partners and sponsors

## Product Capabilities

### Community
- Threads, replies, search
- Reports and moderation actions
- Likes, bookmarks, solved threads
- Recursive reply tree with collapse/expand controls
- Single-active inline composer/report flow on thread details

### Marketplace
- Listing create/update/delete/read
- Buy flow with escrow-style lifecycle
- Shipping/release actions
- Favorites and boosted listings

### Wallet and Money
- Wallet ledger and statement PDF
- Tipping and tip verification
- Payout request flow
- Admin payout decisions and reconciliation tooling

### Premium
- Premium initiation + verification
- Wallet-based premium subscription
- Premium billing history
- Admin premium payment audit

### Ads
- Ad creation with wallet budget lock
- Impression/click tracking
- Admin ads review and moderation queue

### Admin 360 Dashboard
- Overview
- Users, bans, and suspensions
- Threads and moderation reports
- Admin action logs
- Payouts + 360 details
- Premium Audit + 360 details
- Settlement Rollups + bucket drilldown + CSV
- Wallet Alerts + filters + pagination + 360 details
- Platform Wallet + filters + pagination + 360 details
- Ads Review + filters + pagination
- Contests + submission review + winner payout claim review

## Trust, Safety, and Governance

NaijaTalk is built with the assumption that platforms need strong controls from day one.

Current protections include:
- moderation/report workflows,
- role-based access controls for admin actions,
- admin action logs for auditability,
- payment webhook verification,
- server-side pagination for heavy operational datasets.

This improves accountability and helps reduce operational blind spots.

## How the Platform Is Deployed

NaijaTalk is split-hosted:
- Frontend on Vercel
- Backend on Render

This means frontend and backend are deployed independently but work together through API configuration.

## Architecture

- Frontend: Next.js (App Router), React, TypeScript, Tailwind
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JWT
- Payments: Paystack (with webhook signature verification)

Repository structure:
- `frontend/` web app
- `backend/` API server

## API Surface

Mounted under `/api` in `backend/index.js`:
- `/api/auth`
- `/api/threads`
- `/api/users`
- `/api/premium`
- `/api/marketplace`
- `/api/ads`
- `/api/contests`

## Quick Questions (FAQ)

### Is this only a forum?
No. It is a forum + marketplace + wallet + premium + admin operations platform.

### Can non-technical people understand the product value?
Yes. You can use the “For Everyone” section above to explain it clearly to users, partners, or investors.

### Is moderation handled seriously?
Yes. There are dedicated admin sections for users/bans, reports, threads, payouts, premium audits, wallet alerts, and ads review.

## Local Development

### Prerequisites
- Node.js 18+
- npm
- MongoDB URI

### Install
```bash
npm run install:all
```

### Quality Gates (Production Readiness)
Run these before deployment:

```bash
npm run threads:ready
```

Optional extended checks:

```bash
npm run threads:ready:smoke
npm run threads:ready:full
```

### Environment Variables

Backend (`backend/.env`):
- `MONGO_URI`
- `JWT_SECRET`
- `PAYSTACK_SECRET`
- `FRONTEND_URL` (example: `https://najatalk-talk.vercel.app`)

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` (example: `https://najatalk.onrender.com/api`)

### Run
```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Common Commands

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run ci:p0
```

## Documentation Map

- Non-technical platform brief: `PLATFORM_OVERVIEW.md`
- Platform plan/status: `NAIJATALK_PROJECT_PLAN.md`
- Milestones: `MILESTONE.md`
- Delivery recap: `Recap.md`
- Contest user guide: `CONTEST_FOR_USERS_SIMPLE_GUIDE.md`
- Contest lifecycle guide: `CONTEST_LIFECYCLE_ADMIN_GUIDE.md`
- Contest sample completion guide: `CONTEST_SAMPLE_COMPLETION_GUIDE.md`
- Deployment rollback checklist: `DEPLOYMENT_ROLLBACK_CHECKLIST.md`
- Backup and restore drill: `BACKUP_RESTORE_DRILL.md`
- P0 incident runbook: `INCIDENT_RUNBOOK_P0.md`
- Personal background/context: `ABOUT_ME.md`
- Feature notes:
  - `Hustle_Frontend.md`
  - `Hustle_Backend.md`
  - `Hustle_Figma.md`

## Contributing

1. Create a focused branch.
2. Keep behavior changes scoped and testable.
3. Run lint/tests before PR.
4. Update docs for API/flow changes.
