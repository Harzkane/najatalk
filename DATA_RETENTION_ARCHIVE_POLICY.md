# Data Retention & Archive Policy

## Purpose
Define retention windows and archive eligibility for audit-heavy collections to reduce cost and keep operational queries fast while preserving compliance evidence.

## Implemented Assets
- Report script: `backend/scripts/retention_report.mjs`
- Backend command: `npm run retention:report --prefix backend`
- Root shortcut: `npm run ops:retention:report`

## Retention Baseline
Defaults are configurable by env variables.

- `adminactionlogs`: 365 days (`RETENTION_ADMIN_ACTION_DAYS`)
- `walletledgers`: 3650 days (`RETENTION_WALLET_LEDGER_DAYS`)
- `transactions`: 3650 days (`RETENTION_TRANSACTION_DAYS`)
- `premiumpayments`: 1825 days (`RETENTION_PREMIUM_PAYMENT_DAYS`)
- `reports`: 730 days (`RETENTION_REPORT_DAYS`)
- `contestsubmissions`: 730 days (`RETENTION_CONTEST_SUBMISSION_DAYS`)

## How to Run
From repo root:
```bash
npm run ops:retention:report
```

Optional JSON output:
```bash
cd backend
RETENTION_REPORT_JSON=./retention-report.json npm run retention:report
```

## What the Report Shows
For each managed collection:
- existence check
- total document count
- archive-eligible count (older than cutoff)
- oldest/newest document timestamp

## Operational Cadence
- Run report weekly in production.
- Include report output in ops review and release readiness checks.
- Keep archive execution as controlled/manual until restore validation is completed.

## Next Step (P2 Completion)
- Add archive execution job (copy old docs to `*_archive` + checksum + delete source in batches).
- Add restore drill for archived records and document proof in `BACKUP_RESTORE_DRILL.md`.
