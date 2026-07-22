import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { alertTierSchema, evaluationResultSchema, lastAlertSchema } from '@models/overdraft-alert.schema';

describe('overdraft-alert.schema.ts', () => {
  describe('alertTierSchema', () => {
    describe('positive', () => {
      it('parses "low-balance"', () => {
        expect(alertTierSchema.parse('low-balance')).toBe('low-balance');
      });

      it('parses "overdraft"', () => {
        expect(alertTierSchema.parse('overdraft')).toBe('overdraft');
      });
    });

    describe('negative', () => {
      it('throws ZodError for an unsupported tier', () => {
        expect(() => alertTierSchema.parse('critical')).toThrow(z.ZodError);
      });
    });
  });

  describe('evaluationResultSchema', () => {
    describe('positive', () => {
      it('parses a valid tier', () => {
        expect(evaluationResultSchema.parse('overdraft')).toBe('overdraft');
      });

      it('parses null', () => {
        expect(evaluationResultSchema.parse(null)).toBeNull();
      });
    });

    describe('negative', () => {
      it('throws ZodError for an unsupported value', () => {
        expect(() => evaluationResultSchema.parse('none')).toThrow(z.ZodError);
      });
    });
  });

  describe('lastAlertSchema', () => {
    describe('positive', () => {
      it('parses a valid last alert', () => {
        const lastAlert = {
          firedAt: '2026-07-21T09:00:00.000Z',
          recoveredSinceLastAlert: false,
          tier: 'low-balance',
        };

        expect(lastAlertSchema.parse(lastAlert)).toStrictEqual(lastAlert);
      });
    });

    describe('negative', () => {
      it('throws ZodError for an invalid tier', () => {
        const lastAlert = {
          firedAt: '2026-07-21T09:00:00.000Z',
          recoveredSinceLastAlert: false,
          tier: 'critical',
        };

        expect(() => lastAlertSchema.parse(lastAlert)).toThrow(z.ZodError);
      });

      it('throws ZodError for a malformed firedAt', () => {
        const lastAlert = {
          firedAt: 'not-a-date',
          recoveredSinceLastAlert: false,
          tier: 'low-balance',
        };

        expect(() => lastAlertSchema.parse(lastAlert)).toThrow(z.ZodError);
      });

      it('throws ZodError for a non-boolean recoveredSinceLastAlert', () => {
        const lastAlert = {
          firedAt: '2026-07-21T09:00:00.000Z',
          recoveredSinceLastAlert: 'no',
          tier: 'low-balance',
        };

        expect(() => lastAlertSchema.parse(lastAlert)).toThrow(z.ZodError);
      });
    });
  });
});
