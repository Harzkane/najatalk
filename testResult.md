❯ clear
❯ npx playwright test e2e/public-smoke.spec.ts


Running 16 tests using 4 workers

  ✓   1 [chromium] › e2e/public-smoke.spec.ts:35:5 › guest can open threads route (4.7s)
  ✓   2 [chromium] › e2e/public-smoke.spec.ts:41:5 › guest can search from homepage (5.1s)
  ✓   3 [chromium] › e2e/public-smoke.spec.ts:30:5 › home page shows login CTA for guests (5.3s)
  ✓   4 [chromium] › e2e/public-smoke.spec.ts:25:5 › home page renders (5.0s)
  ✓   5 [chromium] › e2e/public-smoke.spec.ts:59:5 › guest can filter by category from homepage (2.3s)
  ✓   6 [chromium] › e2e/public-smoke.spec.ts:69:5 › guest can open a thread detail page (4.1s)
  ✓   7 [chromium] › e2e/public-smoke.spec.ts:78:5 › guest clicking reply redirects to login (8.2s)
  ✓   8 [chromium] › e2e/public-smoke.spec.ts:85:5 › guest clicking report redirects to login (7.3s)
  ✓   9 [chromium] › e2e/public-smoke.spec.ts:92:5 › guest clicking like redirects to login (6.3s)
  ✓  10 [chromium] › e2e/public-smoke.spec.ts:99:5 › guest clicking save redirects to login (6.0s)
  ✓  11 [chromium] › e2e/public-smoke.spec.ts:107:5 › guest clicking tip redirects to login (7.0s)
  ✓  12 [chromium] › e2e/public-smoke.spec.ts:114:5 › contests page renders (2.7s)
  ✓  13 [chromium] › e2e/public-smoke.spec.ts:119:5 › marketplace shows login action for guests (2.6s)
  ✓  14 [chromium] › e2e/public-smoke.spec.ts:124:5 › guest is redirected to login for protected route (5.0s)
  ✓  15 [chromium] › e2e/public-smoke.spec.ts:130:5 › forgot password page renders (3.7s)
  ✓  16 [chromium] › e2e/public-smoke.spec.ts:136:5 › reset password page renders for token path (3.6s)

  16 passed (23.8s)

To open last HTML report run:

  npx playwright show-report


  ~/Doc/najatalk/frontend   main !35 ?14 ❯                                                    27s  system  00:30:39