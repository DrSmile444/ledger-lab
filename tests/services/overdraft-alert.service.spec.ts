import { describe, expect, it } from 'vitest';

import type { Account } from '@models/account.schema';
import type { AlertHistory } from '@models/overdraft-alert.schema';
import type { Transaction } from '@models/transaction.schema';

import { evaluateBalanceAlert } from '@services/overdraft-alert.service';

const NOW = '2026-07-21T12:00:00.000Z';
const THRESHOLD = 5000;

const account: Account = {
  currency: 'USD',
  id: 'acc_1',
  ownerName: 'Alex Rivera',
  postedBalanceMinorUnits: 10_000,
};

/**
 * Builds a pending transaction on `account` for the given signed amount.
 * @param amountMinorUnits - Signed amount; negative is a debit.
 * @returns A pending transaction fixture.
 */
function buildPendingDebit(amountMinorUnits: number): Transaction {
  return {
    accountId: account.id,
    amountMinorUnits,
    createdAt: '2026-07-21T09:00:00.000Z',
    currency: account.currency,
    id: 'txn_1',
    status: 'pending',
  };
}

describe('overdraft-alert.service.ts', () => {
  describe('evaluateBalanceAlert', () => {
    describe('positive', () => {
      it('returns tier overdraft when available balance is negative', () => {
        const transactions = [buildPendingDebit(-15_000)];

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, null)).toStrictEqual({ tier: 'overdraft' });
      });

      it('returns tier low-balance when available balance is below threshold but non-negative', () => {
        const transactions = [buildPendingDebit(-6000)];

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, null)).toStrictEqual({ tier: 'low-balance' });
      });

      it('returns no tier when available balance meets or exceeds threshold', () => {
        expect(evaluateBalanceAlert(account, [], THRESHOLD, NOW, null)).toStrictEqual({ tier: null });
      });

      it('accounts for pending transactions when a posted balance above threshold would otherwise pass', () => {
        const transactions = [buildPendingDebit(-9000)];

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, null)).toStrictEqual({ tier: 'low-balance' });
      });

      it('fires again when 24 hours or more have passed since the last same-tier alert', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-20T11:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'low-balance' });
      });

      it('fires exactly at the 24-hour boundary', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-20T12:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'low-balance' });
      });

      it('fires again within 24 hours if the balance recovered above threshold and dropped again since the last alert', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-21T11:00:00.000Z', recoveredSinceLastAlert: true, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'low-balance' });
      });

      it('fires when no prior alert history exists', () => {
        const transactions = [buildPendingDebit(-9000)];

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, null)).toStrictEqual({ tier: 'low-balance' });
      });

      it('does not suppress when the tier escalates from low-balance to overdraft, even within the cooldown', () => {
        const transactions = [buildPendingDebit(-15_000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-21T11:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'overdraft' });
      });

      it('fires when the last alert is future-dated relative to now, instead of suppressing forever', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-21T13:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'low-balance' });
      });

      it('fires when the last alert is exactly at the current evaluation time, not just strictly after it', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: NOW, recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: 'low-balance' });
      });
    });

    describe('negative', () => {
      it('suppresses a same-tier low-balance alert that fired less than 24 hours ago with no recovery in between', () => {
        const transactions = [buildPendingDebit(-9000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-21T11:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: null });
      });

      it('suppresses a same-tier overdraft alert that fired less than 24 hours ago with no recovery in between', () => {
        const transactions = [buildPendingDebit(-15_000)];
        const lastAlert: AlertHistory = { lastAlertAt: '2026-07-21T11:00:00.000Z', recoveredSinceLastAlert: false, tier: 'overdraft' };

        expect(evaluateBalanceAlert(account, transactions, THRESHOLD, NOW, lastAlert)).toStrictEqual({ tier: null });
      });
    });
  });
});
