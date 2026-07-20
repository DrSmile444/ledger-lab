import { defineConfig } from 'eslint/config';

import vueEslint from './vue/vue.eslint.mjs';
import vueOverridesEslint from './vue/vue-overrides.eslint.mjs';
import vueTsEslint from './vue/vue-ts.eslint.mjs';

/**
 * Creates the Vue.js ESLint configuration for JavaScript Vue SFCs.
 * Combine with createNodeConfig() for full coverage.
 *
 * @returns {import('eslint').Linter.FlatConfig[]}
 *
 * @example
 * import { createNodeConfig } from './.eslint/node.eslint.mjs';
 * import { createVueConfig } from './.eslint/vue.eslint.mjs';
 * export default defineConfig([...createNodeConfig(), ...createVueConfig()]);
 */
export function createVueConfig() {
  return defineConfig([...vueEslint, ...vueOverridesEslint]);
}

/**
 * Creates the Vue.js ESLint configuration for TypeScript Vue SFCs.
 * Chains `@typescript-eslint/parser` inside vue-eslint-parser for type-aware linting.
 *
 * Requires eslint-plugin-vue as a peer dependency.
 * Remember to include *.vue in your root eslint.config.mjs files glob and in tsconfig.json.
 * Combine with createNodeConfig() for full coverage.
 *
 * @returns {import('eslint').Linter.FlatConfig[]}
 *
 * @example
 * import { createNodeConfig } from './.eslint/node.eslint.mjs';
 * import { createVueTsConfig } from './.eslint/vue.eslint.mjs';
 * export default defineConfig([...createNodeConfig(), ...createVueTsConfig()]);
 */
export function createVueTsConfig() {
  return defineConfig([...vueEslint, ...vueTsEslint, ...vueOverridesEslint]);
}

export default createVueConfig();
