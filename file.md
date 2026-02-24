❯ npm run threads:ready

> threads:ready
> bash scripts/thread_readiness_check.sh

==> Thread readiness: backend tests

> ci:backend
> npm test --prefix backend


> backend@1.0.0 test
> node --test

✔ buildHealthPayload returns core fields (4.371238ms)
✔ buildReadinessPayload maps mongo state to readiness (0.320313ms)
✔ redactSensitive redacts nested secrets (2.390498ms)
✔ toKobo converts naira to kobo (2.23469ms)
✔ validatePayoutAmount rejects invalid/minimum amounts (0.33345ms)
✔ validatePayoutAmount accepts valid payout values (0.28215ms)
✔ canCreatePendingPayout enforces max three pending payouts rule (0.209278ms)
✔ getVerificationStateDecision enforces strict verifiable state (2.541254ms)
✔ evaluatePremiumPaymentChecks passes only when all checks match (0.289268ms)
✔ evaluatePremiumPaymentChecks returns precise failure reasons (0.163447ms)
✔ rate limiter allows requests within threshold (2.835159ms)
✔ rate limiter blocks requests above threshold (0.374213ms)
✔ computeUserRiskSignal returns high severity for repeated payout and tip concentration (3.280744ms)
✔ computeUserRiskSignal returns none when metrics are normal (0.257245ms)
✔ computeContestRiskSignal returns high severity on integrity anomalies (0.475539ms)
✔ computeContestRiskSignal returns low/none for healthy contest metrics (0.268121ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 916.157547
==> Thread readiness: frontend lint/typecheck/build

> ci:frontend
> npm run lint --prefix frontend && npm run typecheck --prefix frontend && npm run build --prefix frontend


> frontend@0.1.0 lint
> next lint


./src/app/page.tsx
177:6  Warning: React Hook useMemo has a missing dependency: 'categories'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/threads/ThreadCard.tsx
143:9  Warning: The 'threadReplies' conditional could make the dependencies of useMemo Hook (at line 197) change on every render. To fix this, wrap the initialization of 'threadReplies' in its own useMemo() Hook.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules

> frontend@0.1.0 typecheck
> tsc --noEmit

e2e/advanced-flows.spec.ts:150:43 - error TS2339: Property '_id' does not exist on type '{}'.

150   const contestId = contestJson?.contest?._id;
                                              ~~~

e2e/advanced-flows.spec.ts:160:40 - error TS2339: Property '_id' does not exist on type '{}'.

160   const threadId = threadJson?.thread?._id;
                                           ~~~

e2e/advanced-flows.spec.ts:177:52 - error TS2339: Property '_id' does not exist on type '{}'.

177   const submissionId = submissionJson?.submission?._id;
                                                       ~~~


Found 3 errors in the same file, starting at: e2e/advanced-flows.spec.ts:150

❯ npm run threads:ready:smoke

> threads:ready:smoke
> bash scripts/thread_readiness_check.sh --with-smoke

==> Thread readiness: backend tests

> ci:backend
> npm test --prefix backend


> backend@1.0.0 test
> node --test

✔ buildHealthPayload returns core fields (3.069344ms)
✔ buildReadinessPayload maps mongo state to readiness (0.315965ms)
✔ redactSensitive redacts nested secrets (1.618291ms)
✔ toKobo converts naira to kobo (2.100018ms)
✔ validatePayoutAmount rejects invalid/minimum amounts (0.262696ms)
✔ validatePayoutAmount accepts valid payout values (0.261228ms)
✔ canCreatePendingPayout enforces max three pending payouts rule (0.198724ms)
✔ getVerificationStateDecision enforces strict verifiable state (2.511892ms)
✔ evaluatePremiumPaymentChecks passes only when all checks match (0.271214ms)
✔ evaluatePremiumPaymentChecks returns precise failure reasons (0.157695ms)
✔ rate limiter allows requests within threshold (2.482868ms)
✔ rate limiter blocks requests above threshold (0.333508ms)
✔ computeUserRiskSignal returns high severity for repeated payout and tip concentration (2.523631ms)
✔ computeUserRiskSignal returns none when metrics are normal (0.270692ms)
✔ computeContestRiskSignal returns high severity on integrity anomalies (0.585173ms)
✔ computeContestRiskSignal returns low/none for healthy contest metrics (0.575388ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 805.358467
==> Thread readiness: frontend lint/typecheck/build

> ci:frontend
> npm run lint --prefix frontend && npm run typecheck --prefix frontend && npm run build --prefix frontend


> frontend@0.1.0 lint
> next lint


./src/app/page.tsx
177:6  Warning: React Hook useMemo has a missing dependency: 'categories'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/threads/ThreadCard.tsx
143:9  Warning: The 'threadReplies' conditional could make the dependencies of useMemo Hook (at line 197) change on every render. To fix this, wrap the initialization of 'threadReplies' in its own useMemo() Hook.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules

> frontend@0.1.0 typecheck
> tsc --noEmit

e2e/advanced-flows.spec.ts:150:43 - error TS2339: Property '_id' does not exist on type '{}'.

150   const contestId = contestJson?.contest?._id;
                                              ~~~

e2e/advanced-flows.spec.ts:160:40 - error TS2339: Property '_id' does not exist on type '{}'.

160   const threadId = threadJson?.thread?._id;
                                           ~~~

e2e/advanced-flows.spec.ts:177:52 - error TS2339: Property '_id' does not exist on type '{}'.

177   const submissionId = submissionJson?.submission?._id;
                                                       ~~~


Found 3 errors in the same file, starting at: e2e/advanced-flows.spec.ts:150

❯ npm run threads:ready:full

> threads:ready:full
> bash scripts/thread_readiness_check.sh --with-smoke --with-ui

==> Thread readiness: backend tests

> ci:backend
> npm test --prefix backend


> backend@1.0.0 test
> node --test

✔ buildHealthPayload returns core fields (3.400513ms)
✔ buildReadinessPayload maps mongo state to readiness (0.302276ms)
✔ redactSensitive redacts nested secrets (2.266635ms)
✔ toKobo converts naira to kobo (1.881537ms)
✔ validatePayoutAmount rejects invalid/minimum amounts (0.259939ms)
✔ validatePayoutAmount accepts valid payout values (0.263051ms)
✔ canCreatePendingPayout enforces max three pending payouts rule (0.215668ms)
✔ getVerificationStateDecision enforces strict verifiable state (2.574478ms)
✔ evaluatePremiumPaymentChecks passes only when all checks match (0.326307ms)
✔ evaluatePremiumPaymentChecks returns precise failure reasons (0.153371ms)
✔ rate limiter allows requests within threshold (1.65625ms)
✔ rate limiter blocks requests above threshold (0.21631ms)
✔ computeUserRiskSignal returns high severity for repeated payout and tip concentration (2.333625ms)
✔ computeUserRiskSignal returns none when metrics are normal (0.164882ms)
✔ computeContestRiskSignal returns high severity on integrity anomalies (0.206686ms)
✔ computeContestRiskSignal returns low/none for healthy contest metrics (0.215163ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 582.755578
==> Thread readiness: frontend lint/typecheck/build

> ci:frontend
> npm run lint --prefix frontend && npm run typecheck --prefix frontend && npm run build --prefix frontend


> frontend@0.1.0 lint
> next lint


./src/app/page.tsx
177:6  Warning: React Hook useMemo has a missing dependency: 'categories'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/threads/ThreadCard.tsx
143:9  Warning: The 'threadReplies' conditional could make the dependencies of useMemo Hook (at line 197) change on every render. To fix this, wrap the initialization of 'threadReplies' in its own useMemo() Hook.  react-hooks/exhaustive-deps

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules

> frontend@0.1.0 typecheck
> tsc --noEmit

e2e/advanced-flows.spec.ts:150:43 - error TS2339: Property '_id' does not exist on type '{}'.

150   const contestId = contestJson?.contest?._id;
                                              ~~~

e2e/advanced-flows.spec.ts:160:40 - error TS2339: Property '_id' does not exist on type '{}'.

160   const threadId = threadJson?.thread?._id;
                                           ~~~

e2e/advanced-flows.spec.ts:177:52 - error TS2339: Property '_id' does not exist on type '{}'.

177   const submissionId = submissionJson?.submission?._id;
                                                       ~~~


Found 3 errors in the same file, starting at: e2e/advanced-flows.spec.ts:150


  ~/Doc/najatalk   main !1 ?2 ❯                                                          8s  system  00:09:04