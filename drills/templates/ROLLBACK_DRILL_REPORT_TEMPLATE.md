# Rollback Drill Report

- Drill ID: DRILL-ROLLBACK-<YYYYMMDD-HHMM>
- Date (UTC):
- Owner:
- Observer:

## Pre-Drill Snapshot
- Frontend deployment ID (current):
- Backend release ID (current):
- Candidate stable frontend deploy:
- Candidate stable backend release:

## Rollback Execution
### Frontend (Vercel)
- Action time:
- Target deployment:
- Result:

### Backend (Render)
- Action time:
- Target release:
- Result:

## Validation
- `GET /health`:
- `GET /ready`:
- `npm run ops:e2e:smoke` summary:
- Critical pages (`/`, `/threads`, `/admin`) checks:

## Recovery Metrics
- Time to rollback (front):
- Time to rollback (back):
- Total service stabilization time:

## Issues + Follow-ups
1.
2.

## Final Status
- Drill result: Pass | Partial | Fail
- Sign-off:
