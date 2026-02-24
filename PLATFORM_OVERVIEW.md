# NaijaTalk Platform Overview

## What Is NaijaTalk?

NaijaTalk is a Nigerian digital platform where people can:
- talk (community discussions),
- trade (marketplace activity),
- and earn (tips, premium, and wallet flows),
all in one place.

It is designed to feel local, practical, and trustworthy, with strong operational controls behind the scenes.

Core identity:
- NaijaTalk is a trust-first, conversation-driven community marketplace for Nigeria.

## The Core Idea

Most platforms solve only one part of user life:
- social conversation only, or
- buying/selling only, or
- payments only.

NaijaTalk combines all three in one ecosystem:
- community engagement,
- commerce activity,
- and financial interactions.

This increases retention because users do not need to leave the platform to complete their journey.

## Why It Matters

NaijaTalk addresses common problems:
- low trust in online communities,
- weak moderation on user-generated platforms,
- scattered user journeys across multiple apps,
- poor visibility into money-related platform operations.

NaijaTalk’s approach is to build user-facing features and admin-grade operational tooling together.

## Vision

NaijaTalk aims to become Nigeria's most trusted digital community infrastructure, where conversation, commerce, and creator value can grow under transparent governance.

## What Users Can Do

- Create and join conversations (threads and replies)
- Discover and search relevant discussions
- Report harmful content
- Buy and sell through marketplace flows
- Tip creators
- Subscribe to premium benefits

Thread UX currently includes:
- Nested replies with collapsible branches
- Inline reply/report actions inside thread details
- Single active reply composer/report form to reduce UI clutter

## What Admins Can Do

NaijaTalk includes a full admin 360 dashboard with:
- user and ban management,
- thread and report moderation,
- payout reconciliation,
- premium payment audits,
- settlement rollups,
- wallet anomaly alerts,
- platform wallet oversight (credits/debits trail and entry-level 360),
- ads review and moderation workflows.
- contests governance (submission review, winner selection, prize-claim review).

This is not a “basic admin panel.” It is an operational control center.

## Trust and Governance

The platform prioritizes reliability and accountability through:
- role-based permissions,
- admin action logging,
- payment event verification,
- operational filtering and pagination for large datasets.

The goal is to reduce abuse, improve decision speed, and keep platform behavior auditable.

## Business and Platform Value

NaijaTalk creates value for multiple groups:

- Users: safer, richer community experience
- Creators: monetization pathways (tips, visibility, premium ecosystem)
- Sellers: commerce opportunities with better trust controls
- Operators: data visibility and workflow control
- Partners/Sponsors: structured platform with clear governance direction

## Revenue Model

Current and near-term monetization paths:
- Premium subscriptions
- Ad revenue
- Marketplace-related transaction fees
- Listing boost spend
- Potential future transaction margin products (with explicit policy controls)

## Deployment Model

NaijaTalk runs as split hosting:
- Frontend: Vercel (`https://najatalk-talk.vercel.app/`)
- Backend API: Render (`https://najatalk.onrender.com`)

This setup allows independent frontend/backend deployment while maintaining one product experience.

## Contest Model (Sponsor + Platform)

NaijaTalk contests support both:
- platform-funded contests, and
- sponsor-funded campaigns.

Admin runs the lifecycle from creation to archive:
- draft -> live -> closed -> archived,
- submission moderation,
- winner finalization,
- winner claim review and wallet credit confirmation.

This keeps brand campaigns transparent and keeps users informed about how winners are decided and paid.

## Current Focus

The current priority is scaling safely:
- reliability hardening for money flows,
- stronger abuse prevention,
- broader test coverage,
- and continued improvement of operational intelligence.

Release gate for thread stack:
- `npm run threads:ready`
- `npm run threads:ready:smoke` (optional)
- `npm run threads:ready:full` (optional, includes UI E2E)

## Contact and Project Docs

For detailed technical and roadmap documentation, see:
- `README.md`
- `NAIJATALK_PROJECT_PLAN.md`
- `MILESTONE.md`
- `Recap.md`
