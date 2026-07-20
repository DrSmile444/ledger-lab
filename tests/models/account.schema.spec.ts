import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { accountSchema } from '@models/account.schema';

describe('account.schema.ts', () => {
  describe('accountSchema', () => {
    describe('positive', () => {
      it('parses a valid account', () => {
        const account = {
          currency: 'USD',
          id: 'acc_1',
          ownerName: 'Alex Rivera',
          postedBalanceMinorUnits: 250_000,
        };

        expect(accountSchema.parse(account)).toStrictEqual(account);
      });
    });

    describe('negative', () => {
      it('throws ZodError for an unsupported currency', () => {
        const account = {
          currency: 'JPY',
          id: 'acc_1',
          ownerName: 'Alex Rivera',
          postedBalanceMinorUnits: 250_000,
        };

        expect(() => accountSchema.parse(account)).toThrow(z.ZodError);
      });

      it('throws ZodError for a non-integer balance', () => {
        const account = {
          currency: 'USD',
          id: 'acc_1',
          ownerName: 'Alex Rivera',
          postedBalanceMinorUnits: 250_000.5,
        };

        expect(() => accountSchema.parse(account)).toThrow(z.ZodError);
      });
    });
  });
});
