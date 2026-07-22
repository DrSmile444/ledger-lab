import * as z from 'zod';

export const alertTierSchema = z
  .enum(['low-balance', 'overdraft'])
  .meta({ description: 'Severity of a balance alert', example: 'low-balance', type: 'string' });

export const evaluationResultSchema = z
  .union([alertTierSchema, z.null()])
  .meta({ description: 'Alert tier to fire, or null if no alert should fire right now', example: 'overdraft', type: 'string | null' });

export const lastAlertSchema = z.object({
  firedAt: z.iso
    .datetime()
    .meta({ description: 'When the last alert was fired, ISO 8601', example: '2026-07-21T09:00:00.000Z', type: 'string' }),
  recoveredSinceLastAlert: z.boolean().meta({
    description: 'Whether the available balance rose to/above threshold and dropped again since firedAt',
    example: 'false',
    type: 'boolean',
  }),
  tier: alertTierSchema,
});

export type AlertTier = z.infer<typeof alertTierSchema>;

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export type LastAlert = z.infer<typeof lastAlertSchema>;
