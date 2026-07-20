import { describe, expect, it } from 'vitest';

import { showHello } from '../src/main';
import { OVERALL_PROJECT_RELEASE_VERSION } from '../src/version';

describe('main.ts', () => {
  describe('showHello', () => {
    describe('positive', () => {
      it('returns the banner with the release version', () => {
        expect(showHello()).toBe(`Ledger Lab ${OVERALL_PROJECT_RELEASE_VERSION}`);
      });
    });
  });
});
