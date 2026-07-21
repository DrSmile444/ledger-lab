## Business rule (plain language)

Given an account and its transactions, compute the **available balance**
(posted balance minus pending debits — `getAvailableBalanceMinorUnits`).
Compare it against the account's threshold:

- available balance **< 0** → severity `overdraft`
- **0 ≤** available balance **< threshold** → severity `low-balance`
- available balance **≥ threshold** → no alert

If the same severity already fired for this account within the last 24
hours, and the balance hasn't recovered to/above the threshold and dropped
again since then, suppress the repeat alert. A last-alert timestamp at or
after the current evaluation time is invalid ordering (clock skew, a stale
record) and must never suppress — treat it as if no prior alert exists.

## Context

The ledger baseline (`main`) already models `Account.postedBalanceMinorUnits`,
multi-currency, and `Transaction.status` (`posted`/`pending`). This change
adds one pure business-rule function on top — no schema changes, no new
dependencies, no HTTP/DB layer.

## Goals / Non-Goals

**Goals:**
- A single pure function, `evaluateBalanceAlert`, that returns the severity
  (or none) for one evaluation, given explicit inputs (account, transactions,
  threshold, current time, last-alert history).
- Deterministic and easy to test — no wall-clock reads inside the function.
- Correct under invalid/anomalous last-alert data (future-dated timestamp).

**Non-Goals:**
- Sending the alert anywhere (see proposal's Out of scope).
- Persisting alert history — the caller owns that; this function only reads
  the history it's given and returns whether *this* evaluation should alert.
- Multi-currency threshold conversion.

## Decisions

- **Pure function over a stateful service class.** Alternative considered: a
  class holding alert history internally. Rejected — a pure function keeps
  the 24h-suppression logic trivially testable (pass in `now` and the last
  alert timestamp/severity explicitly) and matches the existing
  `getAvailableBalanceMinorUnits` style in this codebase.
- **Threshold as a function parameter, not account field.** Alternative
  considered: adding `alertThresholdMinorUnits` to `Account`. Rejected for
  this slice — the proposal's Out of scope excludes threshold configuration,
  and keeping it as a parameter avoids a schema migration for a value this
  change doesn't yet need to persist.
- **Two severities, not a continuous score.** A simple enum (`'low-balance' |
  'overdraft'`) is enough to route to different notification copy later,
  without over-engineering a severity scale nothing yet consumes.
- **Suppression state (`recoveredSinceLastAlert`) is caller-supplied, not
  derived internally.** Alternative considered: deriving recovery by
  replaying transaction history inside the function. Rejected — this
  function evaluates one point in time; detecting "recovered, then dropped
  again" needs a history of evaluations over time, which is the caller's
  concern (see Non-Goals), not this function's.

## Risks / Trade-offs

- [Risk] Suppression state (last alert severity + timestamp +
  recovered-since flag) must be supplied by the caller on every call, which
  is easy to get wrong (e.g. passing stale history). → Mitigation: the
  function's own tests cover both "history present" and "no history" cases
  explicitly; the type signature makes the parameter's shape and meaning
  unambiguous.
- [Risk] A `lastAlertAt` at or after the current evaluation time (clock
  skew between whatever writes and reads alert history, a replayed/stale
  record) could make a naive time-delta calculation negative, which would
  be trivially "less than 24h" and suppress the alert forever. → Mitigation:
  explicitly normalize this case — a negative or zero time-since-last-alert
  is treated as "not suppressed," per the acceptance criteria — and cover it
  with a dedicated test.
- [Risk] A threshold of zero or a negative threshold is nonsensical input.
  → Mitigation: validate the threshold is a non-negative integer at the call
  site (Zod, consistent with the rest of the domain) rather than inside the
  pure function, keeping the function itself simple.
