import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';

/**
 * @description ESLint config for Vitest test files. Applies recommended Vitest rules,
 * sets up Vitest globals, and relaxes rules impractical in test code.
 * @author Dmytro Vakulenko
 * @see https://github.com/vitest-dev/eslint-plugin-vitest
 */
export default defineConfig([
  {
    name: 'vitest/recommended',
    files: ['tests/**', 'test/**', '**/*.spec.{js,ts,jsx,tsx}'],
    extends: [vitest.configs.recommended],
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-process-env': 'off',
      'vitest/consistent-test-filename': ['error', { pattern: String.raw`\.spec\.(js|ts|jsx|tsx)$` }],
      'vitest/max-nested-describe': ['error', { max: 3 }],
      'vitest/valid-title': 'off',
      'vitest/prefer-describe-function-title': 'off',
    },
  },
  {
    name: 'vitest/typescript-overrides',
    files: ['tests/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]);
