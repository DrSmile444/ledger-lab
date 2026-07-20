import { defineConfig } from 'eslint/config';

import nestEslint from './nest/nest.eslint.mjs';
import nestNoProcessEnvironmentEslint from './nest/nest-no-process-env.eslint.mjs';
import { createNodeConfig } from './node.eslint.mjs';

/**
 * @typedef {import('./node.eslint.mjs').NodeConfigOptions} NodeConfigOptions
 */

/**
 * Creates the NestJS ESLint configuration: Node base + NestJS-specific rules.
 * @param {NodeConfigOptions} [options]
 * @returns {import('eslint').Linter.FlatConfig[]}
 *
 * @example
 * import { createNestConfig } from './.eslint/nest.eslint.mjs';
 * export default createNestConfig({ tsconfig: 'tsconfig.main.json' });
 */
export function createNestConfig(options = {}) {
  return defineConfig([...createNodeConfig(options), ...nestEslint, ...nestNoProcessEnvironmentEslint]);
}

export default createNestConfig();
