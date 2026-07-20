import * as z from 'zod';

export const currencySchema = z
  .enum(['USD', 'EUR', 'GBP'])
  .meta({ description: 'ISO 4217 currency code supported by the ledger', example: 'USD', type: 'string' });

export const accountSchema = z.object({
  currency: currencySchema,
  id: z.string().trim().meta({ description: 'Unique account identifier', example: 'acc_1', type: 'string' }),
  ownerName: z.string().trim().meta({ description: 'Display name of the account holder', example: 'Alex Rivera', type: 'string' }),
  postedBalanceMinorUnits: z.int().meta({
    description: 'Balance from settled transactions only, in minor currency units (e.g. cents)',
    example: '250000',
    type: 'number',
  }),
});

export type Currency = z.infer<typeof currencySchema>;

export type Account = z.infer<typeof accountSchema>;
