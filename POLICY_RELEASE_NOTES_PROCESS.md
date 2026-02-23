# Policy Release Notes Process

Last updated: February 23, 2026

## Purpose
Ensure users and operators can track policy changes with clear rollout notes.

## Where to publish
- Primary: `README.md` release section (or project changelog section)
- Secondary: `POLICY_CHANGELOG.md`
- Optional: admin announcement thread on NaijaTalk

## Required fields per release note
- Date (UTC)
- Policy page(s) updated
- Version label(s)
- Summary of what changed
- User impact (what users/admins must do differently)
- Effective date

## Template
```md
## Policy Update - YYYY-MM-DD
- Pages: /terms, /privacy
- Versions: terms vYYYY.MM.DD, privacy vYYYY.MM.DD
- Summary: <short plain-language summary>
- User impact: <none | action required>
- Effective date: YYYY-MM-DD
```

## Release Gate
Do not mark governance gate complete for a release unless release notes are published for policy changes in that release.
