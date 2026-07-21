import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { alertEvaluationSchema, alertHistorySchema, alertTierSchema } from '@models/overdraft-alert.schema';

describe('overdraft-alert.schema.ts', () => {
  describe('alertTierSchema', () => {
    describe('positive', () => {
      it('parses low-balance and overdraft', () => {
        expect(alertTierSchema.parse('low-balance')).toBe('low-balance');
        expect(alertTierSchema.parse('overdraft')).toBe('overdraft');
      });
    });

    describe('negative', () => {
      it('throws ZodError for an unrecognized tier', () => {
        expect(() => alertTierSchema.parse('critical')).toThrow(z.ZodError);
      });
    });
  });

  describe('alertEvaluationSchema', () => {
    describe('positive', () => {
      it('parses a tier result', () => {
        expect(alertEvaluationSchema.parse({ tier: 'overdraft' })).toStrictEqual({ tier: 'overdraft' });
      });

      it('parses a null tier result', () => {
        expect(alertEvaluationSchema.parse({ tier: null })).toStrictEqual({ tier: null });
      });
    });

    describe('negative', () => {
      it('throws ZodError when tier is missing', () => {
        expect(() => alertEvaluationSchema.parse({})).toThrow(z.ZodError);
      });
    });
  });

  describe('alertHistorySchema', () => {
    describe('positive', () => {
      it('parses a full alert-history record', () => {
        const history = { lastAlertAt: '2026-07-20T09:00:00.000Z', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(alertHistorySchema.parse(history)).toStrictEqual(history);
      });

      it('parses null when there is no prior alert', () => {
        expect(alertHistorySchema.parse(null)).toBeNull();
      });
    });

    describe('negative', () => {
      it('throws ZodError for a malformed lastAlertAt', () => {
        const history = { lastAlertAt: 'not-a-date', recoveredSinceLastAlert: false, tier: 'low-balance' };

        expect(() => alertHistorySchema.parse(history)).toThrow(z.ZodError);
      });
    });
  });
});
