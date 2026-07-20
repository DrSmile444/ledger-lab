import { defineConfig } from 'eslint/config';

/**
 * @description Overrides for Vue SFCs: enforces PascalCase filenames per the Vue 3 official style guide (priority A).
 * @author Dmytro Vakulenko
 * @see https://vuejs.org/style-guide/rules-strongly-recommended#single-file-component-filename-casing
 */
export default defineConfig([
  {
    name: 'vue/overrides',
    files: ['**/*.vue'],
    rules: {
      'unicorn/filename-case': ['error', { case: 'pascalCase' }],
    },
  },
]);
