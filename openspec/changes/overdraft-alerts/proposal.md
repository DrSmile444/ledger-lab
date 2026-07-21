## Why

Account holders currently get no warning before going into overdraft, and no
signal that they're approaching it. The ledger already tracks everything a
balance-alert rule needs — posted balance, pending-transaction status,
currency — so this adds exactly the missing decision logic, not new plumbing.

## What Changes

- Add `evaluateBalanceAlert`: given an account and its transactions, decide
  whether a balance alert should fire right now and at which severity.
- Trigger: **available balance** (posted balance minus pending debits,
  `getAvailableBalanceMinorUnits`) compared against a per-account threshold,
  in the account's own currency (no cross-currency conversion).
- Two severities: **low-balance** (available balance ≥ 0 and below
  threshold) and **overdraft** (available balance < 0).
- Suppression: a same-severity alert must not repeat within 24 hours of the
  last alert of that severity, unless the balance recovered to/above
  threshold and dropped again since. A last-alert timestamp at or after the
  current evaluation time is invalid ordering and must not suppress.

## Capabilities

### New Capabilities

- `overdraft-alerts`: Evaluates an account's available balance against a
  per-account threshold and returns the alert severity (if any), with 24h
  same-severity suppression.

### Modified Capabilities

_None._

## Impact

- New `src/models/overdraft-alert.schema.ts`: Zod schema for the alert
  severity, the evaluation result, and the alert-history input.
- New `src/services/overdraft-alert.service.ts`: `evaluateBalanceAlert`,
  built on the existing `getAvailableBalanceMinorUnits` in
  `src/services/ledger.service.ts` — no duplicated balance math.
- No changes to `Account`/`Transaction` schemas — the existing
  `postedBalanceMinorUnits`, transaction `status`, and `currency` fields
  already cover everything this rule needs.

## Out of scope

- Notification delivery channel (email/SMS/push) — this proposal only
  decides *whether* and *at what severity* to alert, not how it's sent.
- Per-account threshold configuration UI/API — the threshold is a function
  input, not a stored/configurable value in this change.
- Interest, fees, or other monetary consequences of being in overdraft.
- Cross-currency threshold conversion.
