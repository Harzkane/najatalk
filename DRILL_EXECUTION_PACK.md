# Drill Execution Pack

Last updated: February 23, 2026

Use this pack to close the final full-scale go-live blockers:
1. Live escalation drill evidence
2. Rollback drill execution evidence
3. Backup/restore drill execution evidence

## 1. Generate a timestamped drill bundle

```bash
bash scripts/create_drill_bundle.sh
```

This creates:
- `evidence/drills/<timestamp>/SEV_ESCALATION_DRILL_REPORT.md`
- `evidence/drills/<timestamp>/ROLLBACK_DRILL_REPORT.md`
- `evidence/drills/<timestamp>/BACKUP_RESTORE_DRILL_REPORT.md`

## 2. Run SEV escalation drill (recommended first)

Suggested trigger path:
- Trigger admin dry-run SLA alert and verify external routing logs

```bash
npm run ops:synthetic
npm run ops:e2e:smoke
```

Record evidence in `SEV_ESCALATION_DRILL_REPORT.md`:
- alert fired timestamp
- owner acknowledgement timestamp
- mitigation start timestamp
- recovery validation output

## 3. Run rollback drill

Follow `DEPLOYMENT_ROLLBACK_CHECKLIST.md`.

After rollback action(s), validate quickly:

```bash
npm run ops:e2e:smoke
npm run ops:e2e:ui
```

Or capture both into the current drill bundle automatically:

```bash
npm run ops:drill:rollback:capture -- evidence/drills/<timestamp>
```

Record in `ROLLBACK_DRILL_REPORT.md`:
- frontend/backend target versions
- rollback start/end time
- validation outputs

## 4. Run backup/restore drill (sandbox only)

Follow `BACKUP_RESTORE_DRILL.md`.

Example commands:

```bash
mongodump --uri="$MONGO_URI" --out="./backup-drill/$(date -u +%F-%H%M%S)"
mongorestore --uri="$MONGO_RESTORE_URI" --drop ./backup-drill/<snapshot-folder>
```

Record in `BACKUP_RESTORE_DRILL_REPORT.md`:
- artifact path
- restore target
- validation query outputs
- RTO/RPO

Optional post-restore capture helper:

```bash
npm run ops:drill:restore:capture -- evidence/drills/<timestamp>
```

## 5. Final closeout

Update:
- `OPS_EVIDENCE_LOG.md`
- `PRODUCTION_READINESS_GOVERNANCE_CHECKLIST.md`

Set full-scale go-live only after all 3 drill reports are complete and signed off.
