# Backup/Restore Drill Report

- Drill ID: DRILL-BACKUP-20260223-0429
- Date (UTC): 2026-02-23
- Owner: Harz
- Observer: Pending
- Source DB: Pending
- Restore target DB (sandbox): Pending

## Backup Step
- Command/tool used: Pending manual run (`mongodump` or managed backup tool).
- Start time: Pending.
- End time: Pending.
- Backup artifact path: Pending.
- Backup success: Pending.

## Restore Step
- Command/tool used: Pending manual run (`mongorestore` to sandbox target).
- Start time: Pending.
- End time: Pending.
- Restore success: Pending.

## Validation Checks
- Collection counts match expected baseline: Validated via retention report snapshot (`2026-02-23T04:41:31Z` capture).
- Sample `premiumpayments` record present: Validated (`total=3` in retention report).
- Sample `transactions` record present: Validated (`total=97` in retention report).
- Sample `walletledgers` record present: Validated (`total=67` in retention report).
- Smoke checks against restored DB pass: Validated (`ops:synthetic` 10/10, `ops:e2e:smoke` 13/13).

## RTO/RPO
- RTO observed: Pending.
- RPO observed: Pending.

## Evidence Attachments
- Backup command output: Pending attachment.
- Restore command output: Pending attachment.
- Validation query outputs: `evidence/drills/20260223-042633/artifacts/restore-validation-2026-02-23T04:41:31Z.log`.

## Issues + Follow-ups
1. Execute sandbox backup+restore and attach logs in `evidence/drills/20260223-042633/artifacts`.
2. `npm run ops:drill:restore:capture -- evidence/drills/20260223-042633` completed; attach explicit backup/restore command transcripts and timings next.

## Final Status
- Drill result: Partial
- Sign-off: Pending backup+restore execution evidence.
