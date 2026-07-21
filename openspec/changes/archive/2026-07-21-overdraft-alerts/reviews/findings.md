# Review findings: overdraft-alerts (regenerated from LL-1)

Two reviewers dispatched in parallel against the `checkpoint-2-apply` diff
(`src/models/overdraft-alert.schema.ts`, `src/services/overdraft-alert.service.ts`,
`tests/models/overdraft-alert.schema.spec.ts`, `tests/services/overdraft-alert.service.spec.ts`).

This time the implementation already included the future-dated-`lastAlertAt`
guard from the start (LL-1's acceptance criteria stated it explicitly, rather
than it surfacing later via review, as it did the first time this feature
was built). The guard's *direction* was right; its *boundary* wasn't.

## Security review

**Clean.** Specifically re-checked the exact class of bug found in the
previous build (suppression bypassed forever via clock skew / a stale
`lastAlertAt`) and confirmed the `hoursSinceLastAlert >= 0` guard closes it:
a future-dated timestamp now yields a negative delta, so the alert fires
(fail-open) rather than suppressing forever. No other permanent- or
silent-suppression paths found. No HIGH/MEDIUM findings.

## Code quality review

**HIGH — `overdraft-alert.service.ts` `isSuppressed` — off-by-one at the
future-dated boundary.**

The spec (and design.md) both state a last-alert timestamp *"at or after"*
the current evaluation time must not suppress. The implementation used
`hoursSinceLastAlert >= 0 && hoursSinceLastAlert < 24`. When `lastAlertAt`
equals `now` exactly, `hoursSinceLastAlert === 0`, so the guard evaluates
`0 >= 0 && 0 < 24` → `true` → **suppressed** — the opposite of "at or after
⇒ must fire." Only the equality point was wrong; the strictly-future case
already worked correctly.

- Fix: `hoursSinceLastAlert > 0 && hoursSinceLastAlert < 24` (strict `>`,
  not `>=`).

**MEDIUM — test gap hid the bug above.** The future-dated test used a
timestamp strictly after `now` (13:00 vs. `NOW` 12:00), never the exact-equal
case, which is precisely where the implementation was wrong. Added a test
with `lastAlertAt === NOW` asserting the alert still fires.

Everything else — the four trigger-tier scenarios, 24h suppression, the
recovery bypass, tier escalation, and the design rationale for
caller-supplied `recoveredSinceLastAlert` — checked out correctly on the
first pass, including the codebase's reuse/convention fit.

## Disposition

Both items addressed in `checkpoint-4-fixed`: boundary changed to strict
`>`, and a regression test added pinning `lastAlertAt === now` to fire.
