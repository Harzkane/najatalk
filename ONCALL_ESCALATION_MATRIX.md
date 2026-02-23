# On-Call Escalation Matrix

## Purpose
Define ownership and escalation flow for production incidents and SLA threshold breaches.

## Severity Levels
- `SEV-1`: Complete outage, payment corruption risk, security incident.
- `SEV-2`: Core feature degraded (auth, threads, contests, payouts) with significant user impact.
- `SEV-3`: Partial degradation, non-critical admin/reporting issues.

## Primary Owners
- Platform Owner: Harz (overall incident commander)
- Backend Owner: Harz (API/payments/wallet paths)
- Frontend Owner: Harz (web app and admin dashboard availability)
- Data/Ops Owner: Harz (backups, restore drills, retention/archive controls)

## Alert Sources
- SLA dashboard cards + threshold alerts (`/admin`)
- Email alerts (`SLA_ALERT_EMAIL_TO`)
- Slack webhook alerts (`SLA_ALERT_SLACK_WEBHOOK_URL` or `SLA_ALERT_SLACK_WEBHOOK_URLS`)
- Synthetic monitoring workflows (`Synthetic Monitor`, `E2E Smoke`, `UI E2E`)

## Escalation Timeline
- `SEV-1`:
  - Acknowledge: within 5 minutes
  - Mitigation action start: within 10 minutes
  - Update cadence: every 15 minutes
- `SEV-2`:
  - Acknowledge: within 15 minutes
  - Mitigation action start: within 30 minutes
  - Update cadence: every 30 minutes
- `SEV-3`:
  - Acknowledge: within 4 hours
  - Mitigation action start: next business window

## Escalation Path
1. Alert received in email/Slack/GitHub workflow failure.
2. Primary owner acknowledges and opens incident note.
3. If no acknowledgement in SLA window, escalate to Platform Owner.
4. For payment/wallet anomalies, follow `INCIDENT_RUNBOOK_P0.md` immediately.
5. Post-incident: record root cause, customer impact, and prevention actions.

## Required Incident Record Fields
- Incident ID and timestamp (UTC)
- Severity and owner
- Detection source
- Impact summary
- Mitigation actions and timeline
- Recovery time
- Follow-up tasks and owners

## Postmortem Linkage
- Process reference: `POSTMORTEM_PROCESS.md`
- Money-flow incidents: `INCIDENT_RUNBOOK_P0.md`

## Launch Requirement
For full-scale go-live:
- Named humans assigned to each owner role above.
- Slack + email alert channels verified by a live drill.
- At least one completed incident simulation evidence attached.
