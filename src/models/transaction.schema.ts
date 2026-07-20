import * as z from 'zod';

import { currencySchema } from './account.schema';

export const transactionStatusSchema = z
  .enum(['pending', 'posted'])
  .meta({ description: 'Whether the transaction has settled (posted) or is still in flight (pending)', example: 'posted', type: 'string' });

export const transactionSchema = z.object({
  accountId: z.string().trim().meta({ description: 'Account this transaction belongs to', example: 'acc_1', type: 'string' }),
  amountMinorUnits: z.int().meta({
    description: 'Signed amount in minor currency units; negative is a debit, positive is a credit',
    example: '-1500',
    type: 'number',
  }),
  createdAt: z.iso
    .datetime()
    .meta({ description: 'When the transaction was created, ISO 8601', example: '2026-07-21T09:00:00.000Z', type: 'string' }),
  currency: currencySchema,
  id: z.string().trim().meta({ description: 'Unique transaction identifier', example: 'txn_1', type: 'string' }),
  status: transactionStatusSchema,
});

export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export type Transaction = z.infer<typeof transactionSchema>;
