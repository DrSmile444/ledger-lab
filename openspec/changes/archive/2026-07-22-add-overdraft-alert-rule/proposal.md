## Why

Account holders currently get no warning before going into overdraft, and no signal that they're approaching it. The ledger already tracks everything needed to detect this (posted balance, pending-transaction status, currency) — this change adds only the missing decision logic, not new plumbing.

## What Changes

- Add a pure evaluation function that determines whether an account should receive a balance alert right now, based on available balance vs. a per-account threshold.
- Two severities: `low-balance` (non-negative, below threshold) and `overdraft` (negative available balance).
- Suppress a same-severity alert repeat within a 24-hour window, unless the balance recovered to/above threshold and dropped again since the last alert.
- Tier changes (escalation or de-escalation) are never suppressed.
- A last-alert timestamp at or after the current evaluation time is treated as invalid and never suppresses the alert.

## Capabilities

### New Capabilities
- `overdraft-alerting`: Evaluates whether an account's current available balance should trigger a `low-balance` or `overdraft` alert, applying a 24-hour same-tier suppression window with a recovery override.

### Modified Capabilities
(none — builds on top of the existing ledger balance calculation without changing its behavior)

## Impact

- New: `src/models/overdraft-alert.schema.ts` — Zod schema for the alert tier (`low-balance` | `overdraft`), the evaluation result, and the alert-history input.
- New: `src/services/overdraft-alert.service.ts` — `evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)`, built on the existing `getAvailableBalanceMinorUnits` in `src/services/ledger.service.ts`.
- New: `tests/services/overdraft-alert.service.spec.ts`.
- No changes to `src/models/account.schema.ts`, `src/models/transaction.schema.ts`, or `src/services/ledger.service.ts`.

## Out of scope

- Notification delivery channel (email/SMS/push).
- Per-account threshold configuration UI/API — the threshold is a function input, not a stored/configurable value.
- Interest, fees, or other monetary consequences of being in overdraft.
- Cross-currency threshold conversion.
- Persistence or computation of `recoveredSinceLastAlert` — it is supplied as an input; how a caller tracks it is a future design concern.
