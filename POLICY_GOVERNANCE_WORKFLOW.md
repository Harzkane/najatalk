# Policy Governance Workflow

Last updated: February 23, 2026

## Scope
Applies to public policy documents:
- `/terms`
- `/privacy`
- `/moderation`
- `/contests/terms`
- `/contests/policy`

## Roles
- Policy owner: Platform owner (`Harz`)
- Reviewer: Ops/Governance reviewer (`Harz`, backup: delegated admin)
- Publisher: Frontend maintainer (admin release owner)

## Change Triggers
- New feature affecting user rights, moderation, money flow, or data handling
- Legal/compliance requirement updates
- Incident/postmortem requiring policy clarification

## Required Steps (must pass in order)
1. Draft change in source page and `POLICY_CHANGELOG.md`.
2. Open PR titled `policy: <area> <version>`.
3. Reviewer checks:
   - user-facing language clarity
   - enforcement mapping in admin actions
   - dates/version labels updated
4. Approve PR and merge.
5. Publish release note entry (see `POLICY_RELEASE_NOTES_PROCESS.md`).
6. Record sign-off in `POLICY_SIGNOFF_REGISTER.md`.

## Control Requirements
- Every policy page must include:
  - current version
  - last updated date
  - minimum one changelog entry
  - document owner and review cadence
- Every policy update must include a matching changelog entry.
- Policy updates cannot ship without a sign-off row.

## SLA
- SEV-1 policy gap discovered in production: patch + publish within 24 hours.
- Normal policy changes: complete sign-off within 5 business days.
