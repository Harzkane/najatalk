# Contest Sample Completion Guide

This guide shows the exact steps to complete the seeded sample contests created by `scripts/contest_real_samples.sh`.

## Seeded contests and expected behavior

- `Lagos Hustle Story Challenge` (`live`): users can submit and vote.
- `Best Marketplace Listing Copy` (`live`): users can submit and vote.
- `Naija Product Idea Sprint` (`live`): users can submit and vote.
- `Campus Survival Guide (Draft)` (`draft`): cannot accept public submissions until admin sets `live`.
- `Best Jollof Debate Thread (Closed)` (`closed`): read-only for public users.
- `Tech Career Ask-Me-Anything (Archived)` (`archived`): read-only/history state.

## Key platform rules (important)

- A user must be logged in to submit or vote.
- A submission needs at least one of: `threadId` or `listingId`.
- Users can only submit their own thread/listing.
- Users cannot vote for their own submission.
- `maxSubmissionsPerUser` is `1` per contest in these samples.
- Public leaderboard only shows `approved` or `winner` submissions.
- Marking a submission as `winner` in admin closes that contest.

## Roles to use for testing

- `Admin account`: review, approve/reject, mark winner, change contest status.
- `User A` (you are already logged in): creates entries and submits.
- `User B` (optional but recommended): votes on User A entries.

## Part 1: Complete the 3 live contests as a normal user

1. Open `http://localhost:3000/contests`.
2. Keep filter on `Live`.
3. For each live contest:
   - Click the contest on the left list.
   - Recommended: click `Create Thread for This Contest`, publish your thread, then return with thread preselected.
   - Open and read `Contest Terms` and `Privacy & Policy` links in the right panel.
   - On the right panel, fill `Submission title` and `Short summary`.
   - Add `threadId` (or `listingId`) that belongs to your logged-in user.
   - Tick the terms acceptance checkbox.
   - Click `Submit Entry`.
4. Repeat for all 3 live contests.

### How to fill `Submit Entry` correctly

- Recommended:
  - Use `Pick from my threads` or `Pick from my listings` dropdowns first.
  - These show content owned by your logged-in account.
- `Submission title`:
  - Short headline for your entry (example: `How I Scaled My Campus Side Hustle`).
- `Short summary`:
  - 1-3 sentences explaining what your thread/listing is about.
- `threadId`:
  - Advanced fallback only (if not using picker).
  - Use this if your entry is a thread/post.
  - You can paste either the raw ID or full thread URL.
  - Get it by opening your thread and copying the ID from URL:
    - Example URL: `/threads/699a3beb50cc9a04f29a38aa`
    - `threadId` = `699a3beb50cc9a04f29a38aa`
- `listingId`:
  - Advanced fallback only (if not using picker).
  - Use this if your entry is a marketplace listing.
  - You can paste either the raw ID or full listing URL.
  - Get it by opening your listing and copying the ID from URL:
    - Example URL: `/marketplace/699a4f0a50cc9a04f29a3c11`
    - `listingId` = `699a4f0a50cc9a04f29a3c11`
- Required input rule:
  - Provide at least one of `threadId` or `listingId`.
  - You can provide both, but each ID must belong to your account.

### Common errors and fixes

- `threadId or listingId is required`:
  - Add at least one valid ID.
- `You fit submit only your own thread/listing`:
  - Use an ID from content created by your logged-in user.
- `Submission limit reached for this contest`:
  - This sample uses max `1` submission per user per contest.
- `You must accept contest terms before submitting`:
  - Tick the terms checkbox before submitting.

Success check:
- You get a success message after each submit.
- If you try a second submit to the same contest, you should see submission limit error (expected).

## Part 2: Approve and publish entries in admin

1. Login as admin and open `http://localhost:3000/admin/contests`.
2. Find each live contest and click `360`.
3. In submissions table:
   - Click `Approve` for valid entries.
   - Use `Reject` for invalid ones.
   - Use `Winner` only when you are ready to close that contest.
4. Refresh `http://localhost:3000/contests`, open each contest, confirm approved entries show in leaderboard.

## Part 3: Voting pass (recommended with second user)

1. Login as `User B` (not the author).
2. Open each live contest in `/contests`.
3. Click `Vote / Unvote` on approved entries.
4. Confirm vote count increases.

Notes:
- If vote fails, check contest is still `live` and voting is enabled.
- Author account cannot vote own entry by design.

## Part 4: Close contest lifecycle properly

1. Go back to admin `Contest 360`.
2. Pick top entry and click `Winner`.
3. Confirm contest status becomes `closed`.
4. In admin list, optionally move old finished samples to `archived`.

Success check:
- Winner entry is visible as winner in admin.
- Contest no longer accepts submissions/votes after closure.

## Part 5: Winner claim and payout

1. Login as winner user.
2. Open the contest and locate your `winner` entry.
3. Click `Request Prize Payout` and submit identification details.
4. Login as admin -> `/admin/contests` -> open `360`.
5. Find winner row with `Prize Claim: pending_review`.
6. Choose:
   - `Approve Claim + Pay` to credit winner wallet.
   - `Reject Claim` if details are not sufficient.

Success check:
- Winner sees claim status `paid` with payout reference.
- Winner wallet ledger includes `contest_prize_paid` credit.
- Treat paid winner as final state for that submission.

## Part 6: Platform Wallet verification (admin)

1. Open `http://localhost:3000/admin/platformWallet`.
2. Filter `Entry Kind` to `Contest Prize Paid`.
3. Search with payout reference from claim result.
4. Open `360` on the matching row.
5. Confirm entry details: amount, user, contest metadata, and reference.

Success check:
- Paid claim appears in Platform Wallet entries.
- Platform Wallet 360 shows a consistent audit record for the payout.

## Draft and closed sample handling

- `Campus Survival Guide (Draft)`:
  - Admin can set status to `live` when ready.
  - Then users can submit/vote during its date window.
- `Best Jollof Debate Thread (Closed)` and `Tech Career Ask-Me-Anything (Archived)`:
  - Keep as historical samples for UI/status testing.

## Quick completion checklist

- [ ] User A submitted valid entry to all 3 live contests.
- [ ] Admin approved at least 1 entry per live contest.
- [ ] User B voted on approved entries.
- [ ] Admin marked winner for each completed live contest.
- [ ] Contest statuses moved correctly (`live` -> `closed` -> optional `archived`).
- [ ] Draft/closed/archived samples still available for status-filter testing.

## Optional: rerun fresh sample data

If you want a new clean batch of sample contests:

```bash
bash scripts/contest_real_samples.sh
```

Then repeat this guide from Part 1.
