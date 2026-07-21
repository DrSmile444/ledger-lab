## 1. Types

- [ ] 1.1 Add `AlertTier` (`'low-balance' | 'overdraft'`), `AlertEvaluation`, and `AlertHistory` (last severity + timestamp + `recoveredSinceLastAlert`) to `src/models/overdraft-alert.schema.ts` — Zod schemas + inferred types, each with a JSDoc-less `.meta()` description (schemas document themselves via `.meta()`, not JSDoc)
- [ ] 1.2 Test: `tests/models/overdraft-alert.schema.spec.ts` — valid/invalid parse cases for each schema

## 2. Core rule

- [ ] 2.1 Implement `evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)` in `src/services/overdraft-alert.service.ts`, built on the existing `getAvailableBalanceMinorUnits` — JSDoc with `@param` for every parameter and `@returns`; import `getAvailableBalanceMinorUnits` via the `@services/*` alias, not a relative path
- [ ] 2.2 Test: `tests/services/overdraft-alert.service.spec.ts` — all 4 scenarios of "Balance alert trigger" (negative, below-threshold, at/above-threshold, pending-transaction effect)
- [ ] 2.3 Implement 24h same-severity suppression, including the recovered-then-dropped-again bypass and the tier-escalation-never-suppressed case
- [ ] 2.4 Test: all remaining scenarios of "Repeat-alert suppression" (fires after 24h, recovers-and-drops, no history, severity escalation)
- [ ] 2.5 Implement the future-dated-`lastAlertAt` guard (invalid ordering must not suppress)
- [ ] 2.6 Test: "Last-alert timestamp is ahead of the current evaluation time" scenario

## 3. Definition of done

- [ ] 3.1 `npm run typecheck && npm run lint && npm run test:coverage` all exit 0 — no exceptions, no disabled rules
- [ ] 3.2 Total coverage has not regressed below the 80% floor; if it would, add tests rather than remove or skip any existing test
