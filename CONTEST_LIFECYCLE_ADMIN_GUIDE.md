# Contest Lifecycle Guide (Admin + Sponsor Model)

This document explains why admins create contests, how contests move through each phase, and where sponsors fit in.

## Short answer to your sponsor question

A contest can be:

1. **Platform-led**
- NaijaTalk creates and funds the contest itself.

2. **Sponsor-led (brand-funded)**
- A brand/sponsor funds the prize.
- NaijaTalk admin sets up and runs moderation, fairness, and payout workflow.

So yes, contests are commonly **for sponsors** (brand campaigns), and users submit entries while other users vote.

## Why Admin creates contests

Admin creates contests to:
- set campaign goal (engagement, UGC, brand awareness)
- define rules and legal terms
- control timeline and fairness
- prevent abuse/spam/fraud
- select or confirm winners safely
- close and archive cleanly for audit/history

Without admin control, contests become easy to abuse and hard to trust.

## Full lifecycle (start to finish)

## Phase 1: Planning

Admin defines:
- title, description, category
- prize amount and source (platform budget or sponsor budget)
- rules and eligibility
- terms/policy version
- start/end dates
- max submissions per user
- voting enabled or not

Output:
- contest exists as `draft`

## Phase 2: Launch

Admin sets contest status to `live`.

What this means:
- users can see contest publicly
- users can submit entries
- users can vote only on approved entries

## Phase 3: Submission Window

Users:
- submit their own thread/listing
- accept terms during submission

System:
- records submission as `pending`
- stores terms acceptance and policy snapshot for audit

## Phase 4: Review & Moderation

Admin opens `/admin/contests` -> `360` and reviews entries.

Admin decisions:
- `approved`: appears publicly in leaderboard
- `rejected`: hidden from public leaderboard
- `winner`: marks winner and closes contest

This phase is critical for quality and policy enforcement.

## Phase 5: Voting

After approvals:
- public users can vote/unvote approved entries
- users cannot vote their own submission
- votes are visible on leaderboard

Important:
- no approved entries = no visible vote buttons

## Phase 6: Winner Selection

Admin selects winner (manual or vote-informed, depending on campaign policy).

When winner is marked:
- submission status becomes `winner`
- contest moves to `closed`

## Phase 7: Closure & Reconciliation

Admin verifies:
- final winner record
- payout readiness (KYC/payment checks if required)
- moderation notes and audit trail

Winner payout operations:
- Winner submits claim request with identification details.
- Admin reviews claim in Contest 360.
- Admin can reject claim (with note) or approve claim.
- On approval, prize is credited to winner wallet and payout reference is stored.
- After a claim is marked `paid`, winner status should be treated as final and no further status toggles should be performed.

For sponsor campaigns:
- share proof/report (entries, reach, winner, timestamps)
- settle sponsor obligations

## Phase 8: Archive

Admin moves finished contests to `archived`.

Purpose:
- preserve history
- keep active views clean
- retain compliance evidence

## Contest statuses in simple terms

- `draft`: internal setup only
- `live`: open now
- `closed`: ended/no new activity
- `archived`: historical record

## Practical sponsor workflow (recommended)

1. Sponsor submits campaign brief + budget.
2. Admin converts brief into contest rules/terms.
3. Contest launched as `live`.
4. Community submits + votes.
5. Admin moderates and confirms winner.
6. Prize paid and campaign report shared.
7. Contest archived.

## Who does what

- **Sponsor/Brand**: funds prize, campaign objective, approval of brief.
- **Admin/Platform Ops**: creation, moderation, fairness, winner finalization, closure.
- **Admin/Platform Ops**: claim review, payment confirmation, and audit trail preservation.
- **Users/Creators**: submit entries.
- **Community**: vote on approved entries.

## Final model (one line)

Sponsor or platform funds the contest, admin governs trust and quality, users compete, community votes, winner is finalized, contest is closed and archived.
