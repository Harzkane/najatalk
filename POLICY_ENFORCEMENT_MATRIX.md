# Policy Enforcement Matrix

Last updated: February 23, 2026

| Policy Area | Clause Summary | Enforcement Surface | Admin Action(s) | Evidence Source |
|---|---|---|---|---|
| Terms of Service | Prohibit spam/fraud/abuse | Threads, reports, auth | Delete thread, lock thread, ban/suspend user | `adminactionlogs`, reports queue |
| Moderation & Appeals | Appeals allowed for banned users | Appeal flow | Approve/reject appeal, unban | banned users section, admin actions |
| Privacy Policy | Restrict sensitive payout/verification visibility | Admin 360 and payout/claim review | Access control by role, audit logging | endpoint auth checks + admin actions |
| Contest Terms | Require ownership/originality and anti-manipulation | Contest submission and review | Approve/reject/winner review statuses | contest submission history |
| Contest Policy | Monitor vote integrity and reverse abuse | Contest risk signals + moderation | Reject suspicious submissions, downgrade winners, sanctions | contest risk signals + admin actions |
| Payments/Wallet Governance | Prevent payout abuse and reconcile anomalies | Payout reconciliation, wallet mismatch, risk signals | Approve/reject payout, hold/review claim, investigate mismatch | payout ledger, platform wallet 360 |

## Notes
- Every enforcement action above is expected to produce an admin action log entry.
- Any policy text change must verify this matrix remains accurate.
