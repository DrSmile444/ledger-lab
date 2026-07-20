import { describe, expect, it } from 'vitest';

import type { Account } from '@models/account.schema';
import type { Transaction } from '@models/transaction.schema';

import { getAvailableBalanceMinorUnits } from '@services/ledger.service';

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
    createdAt: '2026-07-21T09:00:00.000Z',
    currency: account.currency,
    id: 'txn_1',
    status: 'pending',
    ...overrides,
  };
}

describe('ledger.service.ts', () => {
  describe('getAvailableBalanceMinorUnits', () => {
    describe('positive', () => {
      it('returns the posted balance when there are no transactions', () => {
        expect(getAvailableBalanceMinorUnits(account, [])).toBe(10_000);
      });

      it('subtracts pending debits from the posted balance', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -3000, id: 'txn_1' })];

        expect(getAvailableBalanceMinorUnits(account, transactions)).toBe(7000);
      });

      it('adds pending credits to the posted balance', () => {
        const transactions = [buildTransaction({ amountMinorUnits: 2000, id: 'txn_1' })];

        expect(getAvailableBalanceMinorUnits(account, transactions)).toBe(12_000);
      });

      it('ignores posted transactions since they are already reflected in the posted balance', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -5000, id: 'txn_1', status: 'posted' })];

        expect(getAvailableBalanceMinorUnits(account, transactions)).toBe(10_000);
      });

      it('ignores pending transactions belonging to a different account', () => {
        const transactions = [buildTransaction({ accountId: 'acc_2', amountMinorUnits: -5000, id: 'txn_1' })];

        expect(getAvailableBalanceMinorUnits(account, transactions)).toBe(10_000);
      });
    });

    describe('negative', () => {
      it('can return a negative available balance when pending debits exceed the posted balance', () => {
        const transactions = [buildTransaction({ amountMinorUnits: -15_000, id: 'txn_1' })];

        expect(getAvailableBalanceMinorUnits(account, transactions)).toBe(-5000);
      });
    });
  });
});
