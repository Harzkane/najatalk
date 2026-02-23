# NaijaTalk Backup and Restore Drill

Last updated: February 23, 2026

## Objective

Verify that backups can be created and restored with acceptable data integrity and recovery time.

## Drill Frequency

- Recommended: monthly
- Mandatory before major schema or payment-flow changes

## Scope

- MongoDB primary data
- Critical collections:
  - `users`
  - `wallets`
  - `walletledgers`
  - `transactions`
  - `premiumpayments`
  - `contests`
  - `contestsubmissions`
  - `adminactionlogs`

## Pre-Drill Checklist

1. Identify drill owner and observer.
2. Record current app version + commit SHA.
3. Confirm low-risk maintenance window.
4. Notify stakeholders that this is a drill.

## Backup Procedure (example)

Use your managed Mongo backup if available. If using CLI:

```bash
mongodump --uri="$MONGO_URI" --out="./backup-drill/$(date +%F-%H%M%S)"
```

## Restore Procedure (staging/sandbox only)

Never restore into production for drill validation.

```bash
mongorestore --uri="$MONGO_RESTORE_URI" --drop ./backup-drill/<snapshot-folder>
```

## Validation Checks After Restore

1. Collection document counts are within expected range.
2. Sample critical records exist:
   - one premium payment
   - one payout transaction
   - one wallet ledger entry
3. App smoke checks pass against restored DB:
   - health/readiness
   - login
   - premium billing history read
   - admin payout list read

## Success Criteria

1. Backup completed successfully.
2. Restore completed successfully in sandbox.
3. Validation checks pass.
4. Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are recorded.

## Drill Report Template

- Date/time:
- Owner:
- Backup source:
- Restore target:
- RTO observed:
- RPO observed:
- Issues found:
- Corrective actions:
- Target completion date:

## Known Constraints

- Current repo does not include automated DB snapshot orchestration scripts yet.
- Drill execution depends on deployment environment tooling and Mongo hosting setup.
