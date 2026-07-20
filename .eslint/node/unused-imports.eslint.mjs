import { defineConfig } from 'eslint/config';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * @description ESLint config for detecting and auto-removing unused imports.
 * @author Dmytro Vakulenko
 * @see https://github.com/sweepline/eslint-plugin-unused-imports
 */
export default defineConfig([
  {
    name: 'unused-imports',
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
]);
