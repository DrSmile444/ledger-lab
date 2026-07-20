import { OVERALL_PROJECT_RELEASE_VERSION } from './version';

/**
 * Builds the startup banner shown when the ledger core boots.
 * @returns Human-readable name and release version.
 */
export function showHello() {
  return `Ledger Lab ${OVERALL_PROJECT_RELEASE_VERSION}`;
}

// eslint-disable-next-line no-console, lintlord/prefer-logger
console.info(showHello());
