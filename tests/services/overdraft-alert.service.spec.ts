import { describe, expect, it } from 'vitest';

import type { Account } from '@models/account.schema';
import type { LastAlert } from '@models/overdraft-alert.schema';
import type { Transaction } from '@models/transaction.schema';

import { evaluateBalanceAlert } from '@services/overdraft-alert.service';

const now = '2026-07-21T09:00:00.000Z';
const thresholdMinorUnits = 5000;

const account: Account = {
  currency: 'USD',
  id: 'acc_1',
  ownerName: 'Alex Rivera',
  postedBalanceMinorUnits: 10_000,
};

/**
 * Builds a pending test transaction for `account`, with any fields overridden.
 * @param overrides - Fields to override on the default pending transaction.
 * @returns A complete transaction fixture.
 */
function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    accountId: account.id,
    amountMinorUnits: 0,
    createdAt: '2026-07-21T08:00:00.000Z',
    currency: account.currency,
    id: 'txn_1',
    status: 'pending',
    ...overrides,
  };
}

/**
 * Builds a test last-alert fixture, with any fields overridden.
 * @param overrides - Fields to override on the default last alert.
 * @returns A complete last-alert fixture.
 */
function buildLastAlert(overrides: Partial<LastAlert>): LastAlert {
  return {
    firedAt: '2026-07-20T12:00:00.000Z',
    recoveredSinceLastAlert: false,
    tier: 'low-balance',
    ...overrides,
  };
}

describe('overdraft-alert.service.ts', () => {
  describe('evaluateBalanceAlert', () => {
    describe('positive', () => {
      it('returns "overdraft" when available balance is negative', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -15_000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBe('overdraft');
      });

      it('returns "low-balance" when available balance is non-negative but below threshold', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBe('low-balance');
      });

      it('factors pending transactions into the trigger, not just posted balance', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -6000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBe('low-balance');
      });

      it('returns "low-balance" when available balance is exactly zero', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -10_000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBe('low-balance');
      });

      it('fires an overdraft alert when there is no prior alert', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -15_000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBe('overdraft');
      });

      it('fires a same-tier alert that was last fired 24 hours or more ago', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: '2026-07-20T09:00:00.000Z' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });

      it('fires a same-tier alert within 24 hours if the balance recovered since the last alert', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ recoveredSinceLastAlert: true });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });

      it('fires on escalation from low-balance to overdraft regardless of cooldown', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -15_000 })];
        const lastAlert = buildLastAlert({ firedAt: '2026-07-21T08:59:00.000Z', tier: 'low-balance' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('overdraft');
      });

      it('fires on de-escalation from overdraft to low-balance regardless of cooldown', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: '2026-07-21T08:59:00.000Z', tier: 'overdraft' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });

      it('fires when the last-alert timestamp equals the current evaluation time', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: now });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });

      it('fires when the last-alert timestamp is after the current evaluation time', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: '2026-07-22T09:00:00.000Z' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });

      it('fires when the last-alert timestamp is unparseable, treating it as an invalid record', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: 'not-a-date' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBe('low-balance');
      });
    });

    describe('negative', () => {
      it('returns null when available balance is at or above threshold', () => {
        expect(evaluateBalanceAlert(account, [], thresholdMinorUnits, now)).toBeNull();
      });

      it('returns null when available balance is exactly at the threshold', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -5000 })];

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now)).toBeNull();
      });

      it('returns null when available balance is at or above threshold even with a prior alert', () => {
        const lastAlert = buildLastAlert({});

        expect(evaluateBalanceAlert(account, [], thresholdMinorUnits, now, lastAlert)).toBeNull();
      });

      it('suppresses a same-tier alert fired less than 24 hours ago with no recovery since', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -8000 })];
        const lastAlert = buildLastAlert({ firedAt: '2026-07-20T12:00:00.000Z' });

        expect(evaluateBalanceAlert(account, transactions, thresholdMinorUnits, now, lastAlert)).toBeNull();
      });
    });
  });
});
