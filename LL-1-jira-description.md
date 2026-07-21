# LL-1 — Draft Jira Description (not applied to Jira — no live ticket for this demo repo)

What/Why/How + Acceptance Criteria, in the team's standard Jira-description
format (`/jira` skill). This is the actual input the presenter reads live to
kick off `/opsx:propose` — the whole point is that a well-specified ask like
this one produces a clean, complete proposal on the first try.

## What

Add a business rule that evaluates whether an account should receive a
balance alert right now, based on its **available balance** (posted balance
minus pending debits) compared against a per-account threshold, in the
account's own currency. Two severities: `low-balance` (still non-negative,
below threshold) and `overdraft` (negative available balance). A
same-severity alert must not repeat more than once per 24 hours, unless the
balance recovered to/above threshold and dropped again since the last alert.

## Why

Account holders currently get no warning before going into overdraft, and no
signal that they're approaching it. The ledger already tracks everything
this rule needs — posted balance, pending-transaction status, currency — so
this is scoped to add exactly the missing decision logic, not new plumbing.
Getting the rule right up front (trigger condition, tiers, suppression
window, explicit non-goals) means the implementing agent doesn't have to
invent behavior for edge cases like pending transactions or repeat alerts.

## How

1. Add `src/models/overdraft-alert.schema.ts`: Zod schema for the alert tier
   (`low-balance` | `overdraft`), the evaluation result, and the alert-history
   input (last tier, its timestamp, and whether the balance recovered since).
2. Add `src/services/overdraft-alert.service.ts`: `evaluateBalanceAlert(account,
   transactions, thresholdMinorUnits, now, lastAlert)`, built on the existing
   `getAvailableBalanceMinorUnits` in `src/services/ledger.service.ts` — do
   not duplicate the balance math.
3. Trigger: available balance `< 0` → `overdraft`; `0 ≤` available balance
   `< threshold` → `low-balance`; otherwise no alert.
4. Suppression: if the last alert was the same tier, fired less than 24 hours
   ago, and the balance has not recovered to/above threshold and dropped
   again since — return no alert.
5. Cover both requirements with Vitest specs under
   `tests/services/overdraft-alert.service.spec.ts`, following the existing
   `positive`/`negative` describe convention.

## Acceptance criteria

- Available balance negative → tier `overdraft`.
- Available balance below threshold but non-negative → tier `low-balance`.
- Available balance at or above threshold → no alert.
- Pending transactions are factored into the trigger, not just posted balance.
- A same-tier alert fired less than 24h ago, with no recovery in between,
  does not fire again.
- A same-tier alert fired 24h or more ago fires again.
- If the balance recovered to/above threshold and dropped again since the
  last alert, the alert fires again even within 24h.
- A tier escalation (e.g. `low-balance` → `overdraft`) is never suppressed,
  regardless of cooldown.
- A last-alert timestamp at or after the current evaluation time must not
  suppress the alert (invalid ordering — clock skew or a stale record should
  never permanently silence a real alert).

## Out of scope

- Notification delivery channel (email/SMS/push).
- Per-account threshold configuration UI/API — the threshold is a function
  input, not a stored/configurable value in this change.
- Interest, fees, or other monetary consequences of being in overdraft.
- Cross-currency threshold conversion.
