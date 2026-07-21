import * as z from 'zod';

export const alertTierSchema = z
  .enum(['low-balance', 'overdraft'])
  .meta({ description: 'Severity of a balance alert', example: 'low-balance', type: 'string' });

export const alertEvaluationSchema = z.object({
  tier: alertTierSchema
    .nullable()
    .meta({ description: 'Alert tier to raise, or null if no alert should fire', example: 'null', type: 'string' }),
});

export const alertHistorySchema = z
  .object({
    lastAlertAt: z.iso
      .datetime()
      .meta({ description: 'When the last alert of `tier` fired, ISO 8601', example: '2026-07-20T09:00:00.000Z', type: 'string' }),
    recoveredSinceLastAlert: z.boolean().meta({
      description: 'Whether the available balance rose back to/above threshold at some point after the last alert',
      example: 'false',
      type: 'boolean',
    }),
    tier: alertTierSchema,
  })
  .nullable()
  .meta({ description: 'The account’s last alert, or null if none has fired yet', example: 'null', type: 'object' });

export type AlertTier = z.infer<typeof alertTierSchema>;

export type AlertEvaluation = z.infer<typeof alertEvaluationSchema>;

export type AlertHistory = z.infer<typeof alertHistorySchema>;
