❯ clear
❯ npx playwright test e2e/public-smoke.spec.ts


Running 8 tests using 4 workers

  ✓  1 …ublic-smoke.spec.ts:19:5 › guest is redirected to login for threads route (3.9s)
  ✓  2 [chromium] › e2e/public-smoke.spec.ts:24:5 › contests page renders (4.2s)
  ✓  3 [chromium] › e2e/public-smoke.spec.ts:9:5 › home page renders (4.3s)
  ✓  4 …m] › e2e/public-smoke.spec.ts:14:5 › home page shows login CTA for guests (4.1s)
  ✓  5 …e2e/public-smoke.spec.ts:29:5 › marketplace shows login action for guests (3.2s)
  ✓  6 …lic-smoke.spec.ts:34:5 › guest is redirected to login for protected route (2.9s)
  ✓  7 [chromium] › e2e/public-smoke.spec.ts:39:5 › forgot password page renders (2.9s)
  ✓  8 …2e/public-smoke.spec.ts:45:5 › reset password page renders for token path (2.7s)

  8 passed (10.1s)

To open last HTML report run:

  npx playwright show-report

❯ npx playwright test e2e/authenticated-ui.spec.ts


Running 4 tests using 4 workers

  ✓  1 …enticated-ui.spec.ts:173:5 › authenticated admin can open admin dashboard (5.8s)
  ✓  2 …authenticated-ui.spec.ts:143:5 › authenticated user sees logout in header (5.7s)
  ✓  3 …-ui.spec.ts:159:5 › authenticated user is redirected away from login page (5.8s)
  ✓  4 …d-ui.spec.ts:123:5 › authenticated user can open compose panel on threads (5.6s)

  4 passed (8.9s)

To open last HTML report run:

  npx playwright show-report

❯ npm run lint && npm run typecheck

> frontend@0.1.0 lint
> next lint

✔ No ESLint warnings or errors

> frontend@0.1.0 typecheck
> tsc --noEmit


  ~/Doc/najatalk/frontend   main !23 ?6 ❯                  12s  system  02:40:23