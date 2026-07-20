import { defineConfig } from 'eslint/config';

/**
 * @description ESLint config enforcing no process.env usage except in whitelisted paths.
 * Uses n/no-process-env from eslint-plugin-n, ensuring environment access is centralized.
 * @author Dmytro Vakulenko
 * @see https://github.com/eslint-community/eslint-plugin-n/blob/main/docs/rules/no-process-env.md
 */
export default defineConfig([
  {
    name: 'no-process-env/global',
    rules: {
      'n/no-process-env': 'error',
    },
  },
  {
    name: 'no-process-env/test-files',
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'n/no-process-env': 'warn',
    },
  },
  {
    name: 'no-process-env/allowed-files',
    files: ['src/config/**/*.ts', 'src/main.ts', 'eslint.config.js', 'scripts/**/*', 'database/**/*'],
    rules: {
      'n/no-process-env': 'off',
    },
  },
]);
