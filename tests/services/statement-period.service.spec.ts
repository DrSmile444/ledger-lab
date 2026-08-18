import { describe, expect, it } from 'vitest';

import type { Transaction } from '@models/transaction.schema';

import { isInStatementPeriod } from '@services/statement-period.service';

const PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
const PERIOD_END = new Date('2026-08-01T00:00:00.000Z');

/**
 * Builds a test transaction with any fields overridden.
 * @param overrides - Fields to override on the default transaction fixture.
 * @returns A complete transaction fixture.
 */
function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    accountId: 'acc_1',
    amountMinorUnits: -1000,
    createdAt: '2026-07-15T12:00:00.000Z',
    currency: 'USD',
    id: 'txn_1',
    status: 'posted',
    ...overrides,
  };
}

describe('statement-period.service.ts', () => {
  describe('isInStatementPeriod', () => {
    describe('positive', () => {
      it('includes a transaction created in the middle of the period', () => {
        const transaction = buildTransaction({ createdAt: '2026-07-15T12:00:00.000Z' });

        expect(isInStatementPeriod(transaction, PERIOD_START, PERIOD_END)).toBe(true);
      });

      it('includes a transaction created exactly at the period start', () => {
        const transaction = buildTransaction({ createdAt: PERIOD_START.toISOString() });

        expect(isInStatementPeriod(transaction, PERIOD_START, PERIOD_END)).toBe(true);
      });
    });

    describe('negative', () => {
      it('excludes a transaction created exactly at the period end (belongs to the next period)', () => {
        const transaction = buildTransaction({ createdAt: PERIOD_END.toISOString() });

        expect(isInStatementPeriod(transaction, PERIOD_START, PERIOD_END)).toBe(false);
      });

      it('excludes a transaction created before the period start', () => {
        const transaction = buildTransaction({ createdAt: '2026-06-30T23:59:59.000Z' });

        expect(isInStatementPeriod(transaction, PERIOD_START, PERIOD_END)).toBe(false);
      });
    });
  });
});
