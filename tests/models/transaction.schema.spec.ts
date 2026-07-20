import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { transactionSchema } from '@models/transaction.schema';

describe('transaction.schema.ts', () => {
  describe('transactionSchema', () => {
    describe('positive', () => {
      it('parses a valid posted transaction', () => {
        const transaction = {
          accountId: 'acc_1',
          amountMinorUnits: -1500,
          createdAt: '2026-07-21T09:00:00.000Z',
          currency: 'USD',
          id: 'txn_1',
          status: 'posted',
        };

        expect(transactionSchema.parse(transaction)).toStrictEqual(transaction);
      });

      it('parses a valid pending transaction', () => {
        const transaction = {
          accountId: 'acc_1',
          amountMinorUnits: 5000,
          createdAt: '2026-07-21T09:00:00.000Z',
          currency: 'EUR',
          id: 'txn_2',
          status: 'pending',
        };

        expect(transactionSchema.parse(transaction)).toStrictEqual(transaction);
      });
    });

    describe('negative', () => {
      it('throws ZodError for an invalid status', () => {
        const transaction = {
          accountId: 'acc_1',
          amountMinorUnits: -1500,
          createdAt: '2026-07-21T09:00:00.000Z',
          currency: 'USD',
          id: 'txn_1',
          status: 'settled',
        };

        expect(() => transactionSchema.parse(transaction)).toThrow(z.ZodError);
      });

      it('throws ZodError for a malformed createdAt', () => {
        const transaction = {
          accountId: 'acc_1',
          amountMinorUnits: -1500,
          createdAt: 'not-a-date',
          currency: 'USD',
          id: 'txn_1',
          status: 'posted',
        };

        expect(() => transactionSchema.parse(transaction)).toThrow(z.ZodError);
      });
    });
  });
});
