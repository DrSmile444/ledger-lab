# Ledger Lab

A minimal, in-memory banking ledger core — **accounts** and **transactions**, nothing
else. No HTTP layer, no database. It exists as a clean, quality-gated base for
demoing a spec-driven, agent-assisted development workflow end to end
(explore → propose → apply → review → archive → commit) using [OpenSpec](openspec/)
and Claude Code.

`main` stays at this baseline permanently. Feature work built on top of it during a
demo lives on branches, never merged back here.

## What's here

- **`src/models/`** — `Account` (multi-currency, posted balance) and `Transaction`
  (posted/pending status), as Zod schemas with inferred types.
- **`src/services/ledger.service.ts`** — `getAvailableBalanceMinorUnits`: posted
  balance adjusted for pending transactions. Deliberately the only business logic
  here — everything else is domain data.
- **`openspec/`** — spec-driven change workflow config and history.
- **`.claude/`** — OpenSpec skills/commands (`opsx:explore`, `opsx:propose`,
  `opsx:apply`, `opsx:archive`) and the strict lint/test harness from
  [typescript-boilerplate](https://github.com/DrSmile444/typescript-boilerplate),
  which this repo is seeded from.

## Getting started

```bash
npm install
npm run typecheck && npm run lint && npm run test:coverage
```

All three must pass before anything is considered done — this is enforced via
`openspec/config.yaml`, not manual discipline.

## Why multi-currency and pending transactions are already modeled

Real banking edge cases — a purchase that hasn't settled yet, an account held in a
currency other than USD — are exactly what separates a vague feature ask from a
well-scoped one. Baking them into the domain model up front means a new feature
built on top only has to add its own business rule, not first invent the plumbing
to support it.

## License

ISC.
