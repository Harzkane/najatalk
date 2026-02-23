# NaijaTalk Contest Guide (Simple)

This guide explains contests in plain language.

## Why you did not see `Vote / Unvote`

What happened in your test is expected.

- User A submitted an entry.
- That new entry is **pending review** first.
- Public contest page shows only **approved/winner** entries in leaderboard.
- `Vote / Unvote` appears only on those approved entries.

So if admin has not approved User A's entry yet, User B will not see vote buttons.

## Simple contest flow

1. User joins a live contest.
2. User clicks `Create Thread for This Contest` (recommended).
3. User posts thread.
4. User returns to contest page with thread preselected.
5. User accepts terms and submits entry.
6. Entry goes to admin review queue (`pending`).
7. Admin sets it to `approved` (or `winner`).
8. Now everyone can see it in leaderboard.
9. Other users can click `Vote / Unvote`.
10. If winner requests payout and admin pays, claim status shows `paid`.

Alternative:
- User can still submit with listing picker or advanced ID/URL fields.
- The smooth default is thread creation flow from contest page.

## What each role can do

### Normal user
- View live contests.
- Submit own entry.
- Vote on approved entries from other users.
- Cannot vote own entry.
- If your entry is marked `winner`, request payout with your ID details.
- After payout is approved and paid, you can track the paid state on your winner entry.

### Admin
- Review entries in `/admin/contests` -> `360`.
- Approve, reject, or mark winner.
- Change contest status (`draft`, `live`, `closed`, `archived`).

## Your exact test (what to do next)

You already did:
- User A submitted entry.
- User B opened same contest.

Next required step:
1. Login as admin.
2. Open `/admin/contests`.
3. Open contest `360`.
4. Find User A submission.
5. Click `Approve`.

Then:
1. Login as User B.
2. Open `/contests` and select same contest.
3. You should now see User A in leaderboard with `Vote / Unvote`.

## Why submit form was still visible for User B

That is normal if contest is still `live`.

- A live contest allows every eligible user to submit their own entry.
- Form visibility does not mean voting is available.
- Voting depends on approved entries existing.

## Quick troubleshooting

If vote button still does not show:

1. Confirm contest status is `live`.
2. Confirm User A submission is `approved` (admin side).
3. Confirm User B is logged in.
4. Refresh contest details (`Refresh` button).
5. Confirm entry appears in leaderboard section.

## Plain-English status meanings

- `draft`: not open yet.
- `live`: open for submissions and voting window.
- `closed`: finished, no new submissions/votes.
- `archived`: history mode.

For users, the main thing is:
- **No approval = no public vote button yet.**

## Winner payout flow (simple)

1. Admin marks your submission as `winner`.
2. You will see `You won this contest` on your winner entry.
3. Click `Request Prize Payout`.
4. Submit required identification fields (name, phone, ID type, ID number).
5. Admin reviews your claim details.
6. If approved, prize is credited to your wallet and claim shows payment reference.

Important:
- Winning does not auto-credit wallet.
- You must submit the payout claim form first.
- Admin must approve the claim review for payment to happen.
