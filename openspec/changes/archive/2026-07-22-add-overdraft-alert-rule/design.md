## Context

The ledger core (`src/models/account.schema.ts`, `src/models/transaction.schema.ts`, `src/services/ledger.service.ts`) already computes available balance via `getAvailableBalanceMinorUnits(account, transactions)` (posted balance + pending debits/credits for that account). This change adds a decision rule on top of that number — it does not touch the balance calculation itself.

**Core business rule, in plain language:**

1. Compute available balance for the account.
2. Classify it into a tier:
   - available balance `< 0` → `overdraft`
   - `0 <= available balance < threshold` → `low-balance`
   - available balance `>= threshold` → no alert, regardless of history
3. If no tier applies, stop — no alert, no suppression logic runs.
4. If there is no prior alert (`lastAlert` is absent), fire the alert for the computed tier.
5. If the prior alert's tier differs from the computed tier (either direction — escalating low-balance→overdraft or de-escalating overdraft→low-balance), fire immediately. A tier change is never suppressed, because suppression is defined as "same-severity alert repeating," and a different tier is a different signal the holder hasn't seen yet.
6. If the prior alert's tier matches the computed tier, apply suppression:
   - If `lastAlert.firedAt` is at or after `now`, treat the record as invalid (clock skew or stale/corrupt data) and fire anyway — a broken timestamp must never permanently silence a real alert.
   - Else if fewer than 24 hours have elapsed since `lastAlert.firedAt` **and** the balance has not recovered to/above threshold and dropped again since (`lastAlert.recoveredSinceLastAlert` is `false`), suppress — no alert.
   - Otherwise (24h elapsed, or a recovery happened), fire.

```
available balance
   │
   ├─ >= threshold ───────────────────────────────► no alert
   │
   └─ < threshold → tier = overdraft | low-balance
        │
        ├─ lastAlert absent ─────────────────────► FIRE
        ├─ lastAlert.tier != tier ────────────────► FIRE (escalation or de-escalation)
        ├─ lastAlert.firedAt >= now ──────────────► FIRE (invalid ordering)
        ├─ now - lastAlert.firedAt >= 24h ────────► FIRE
        ├─ lastAlert.recoveredSinceLastAlert ─────► FIRE
        └─ else ──────────────────────────────────► SUPPRESS
```

## Goals / Non-Goals

**Goals:**
- Deterministic, pure evaluation of whether to fire a balance alert right now, given the account, its transactions, a threshold, the current time, and (optionally) the last alert fired.
- Reuse `getAvailableBalanceMinorUnits` — no duplicated balance math.
- Cover every branch of the decision tree above with Vitest specs under the existing `positive`/`negative` convention.

**Non-Goals:**
- Tracking or persisting alert history across calls — `lastAlert` is a caller-supplied input, not state this change reads or writes.
- Computing `recoveredSinceLastAlert` from transaction/balance history — the caller supplies it as a fact. How a future caller derives and stores this value is deferred; it requires tracking balance movement between calls, which is out of scope for a single-point-in-time evaluator.
- Threshold configuration, storage, or retrieval.
- Notification delivery, currency conversion, interest/fees.

## Decisions

**D1 — Result shape: `AlertTier | null`.**
The evaluation result is the tier itself (`'low-balance' | 'overdraft'`) when an alert should fire, or `null` when it shouldn't. Considered a discriminated union (`{ shouldAlert: false } | { shouldAlert: true; tier }`) but rejected: the tier enum already has exactly two "alert" values, and `null` for "no alert" keeps the schema and call sites simpler with no loss of information.

**D2 — `lastAlert` field names: `{ tier, firedAt, recoveredSinceLastAlert }`.**
Matches the Jira wording ("last tier, its timestamp, and whether the balance recovered since") directly, so the schema is self-documenting against the source requirement. `firedAt` (not `timestamp`) to be explicit about what event the timestamp marks.

**D3 — De-escalation is treated the same as escalation.**
The acceptance criteria only give an escalation example (`low-balance` → `overdraft`), but the suppression rule is scoped to "same-severity alert repeating." Any tier change — in either direction — is therefore a different signal and always fires. Confirmed with the requester rather than left as an inferred edge case.

**D4 — No currency cross-check between account and transactions.**
`getAvailableBalanceMinorUnits` already filters transactions by `accountId` + `status` only, not `currency`. This change builds on that function as-is and does not add a guard, consistent with "cross-currency threshold conversion" being explicitly out of scope in the proposal. Any currency-consistency guarantee is the existing ledger's responsibility, not this rule's.

**D5 — `now` and `lastAlert` are explicit parameters, not read from the system clock or a store.**
Keeps `evaluateBalanceAlert` pure and matches the existing service style (no I/O in `src/services/`), and makes every suppression-window and clock-skew test deterministic.

## Risks / Trade-offs

- **[Risk]** Callers may misuse `recoveredSinceLastAlert` — e.g. always passing `false`, silently disabling the recovery-override path — since this change has no way to verify the flag against real history. **Mitigation:** JSDoc on the schema field states explicitly that it must reflect whether the balance crossed back to/above threshold and dropped again since `firedAt`, and out-of-scope note in the proposal flags that computing it correctly is the caller's responsibility.
- **[Risk]** A permissive "invalid ordering fires anyway" rule (D-tree step for `firedAt >= now`) could cause duplicate alerts if a caller's clock is merely a little ahead rather than genuinely corrupt. **Mitigation:** Accepted trade-off per the acceptance criteria — the cost of an occasional extra alert is lower than the cost of a stale/corrupt record permanently silencing a real one. This also covers unparseable `firedAt`/`now` strings: `isSuppressed` treats a `NaN` timestamp the same as an invalid ordering (fires), so a malformed record can never fall through to the recovery check and get suppressed.
- **[Risk]** No currency guard (D4) means a hypothetical mixed-currency transaction set would silently produce a misleading available balance. **Mitigation:** Pre-existing behavior inherited from `ledger.service.ts`, not introduced by this change; fixing it is a separate, ledger-level concern.
- **[Risk]** `AlertTier | null` (D1) conflates "balance healthy, no alert needed" with "balance unhealthy but suppressed" — a caller can't distinguish the two from the return value alone. **Mitigation:** Accepted as a deliberate simplification for this evaluator's scope (a single point-in-time decision, not an audit trail); a future caller needing to distinguish the reason for `null` should wrap or extend this function rather than infer intent from the result shape.
- **[Risk]** Because any tier change always fires (D3), an account whose balance oscillates across a tier boundary (e.g. overdraft → low-balance → overdraft) within the 24h window will re-fire on every crossing, not just once per day. **Mitigation:** Accepted trade-off — required directly by the acceptance criteria ("a tier escalation... is never suppressed, regardless of cooldown"); rate-limiting tier-change alerts specifically is a product decision for a future change, not this one.
