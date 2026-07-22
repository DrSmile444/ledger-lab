## 1. Alert schema

- [x] 1.1 Create `src/models/overdraft-alert.schema.ts`: `alertTierSchema` enum (`low-balance` | `overdraft`), `evaluationResultSchema` (tier or `null`), and `lastAlertSchema` (`tier`, `firedAt`, `recoveredSinceLastAlert`), each with `.meta()` descriptions matching the existing schema style; export inferred types via `z.infer`.
- [x] 1.2 Write `tests/models/overdraft-alert.schema.spec.ts` covering valid parses and rejections for each schema, following the `positive`/`negative` describe convention.

## 2. Evaluation service

- [x] 2.1 Create `src/services/overdraft-alert.service.ts` exporting `evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)`, calling `getAvailableBalanceMinorUnits` from `@services/ledger.service` for the balance and returning `AlertTier | null` per the tier-classification rule in design.md.
- [x] 2.2 Implement the suppression branch inside `evaluateBalanceAlert`: no-alert short-circuit, absent-`lastAlert` fire, tier-mismatch fire, invalid-ordering (`firedAt >= now`) fire, 24h-elapsed fire, `recoveredSinceLastAlert` fire, else suppress.
- [x] 2.3 Add the JSDoc comment (`@param` for every parameter, `@returns`) on `evaluateBalanceAlert`.

## 3. Test coverage

- [x] 3.1 Write `tests/services/overdraft-alert.service.spec.ts` with a `describe('overdraft-alert.service.ts')` → `describe('evaluateBalanceAlert')` → `positive`/`negative` structure, using a `buildTransaction`-style fixture helper consistent with `tests/services/ledger.service.spec.ts`.
- [x] 3.2 Cover every scenario in `specs/overdraft-alerting/spec.md`: negative balance → overdraft; non-negative-below-threshold → low-balance; at/above threshold → no alert; pending transaction shifts the trigger; same-tier suppressed within 24h without recovery; same-tier fires at/after 24h; recovery lifts suppression within 24h; escalation and de-escalation both fire regardless of cooldown; `firedAt` equal to or after `now` fires anyway.

## 4. Verification

- [x] 4.1 Run `npm run typecheck && npm run lint && npm run test:coverage` and confirm all three exit 0, with total coverage at or above the existing 80% floor.
