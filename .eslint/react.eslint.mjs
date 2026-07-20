import { defineConfig } from 'eslint/config';

import reactEslint from './react/react.eslint.mjs';
import reactOverridesEslint from './react/react-overrides.eslint.mjs';

/**
 * @typedef {import('./node.eslint.mjs').NodeConfigOptions} NodeConfigOptions
 */

/**
 * Creates the React ESLint configuration.
 * Combine with createNodeConfig() or createNestConfig() for full coverage:
 *
 * @example
 * import { createNodeConfig } from './.eslint/node.eslint.mjs';
 * import { createReactConfig } from './.eslint/react.eslint.mjs';
 * export default defineConfig([...createNodeConfig(), ...createReactConfig()]);
 *
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function createReactConfig() {
  return defineConfig([...reactEslint, ...reactOverridesEslint]);
}

export default createReactConfig();
