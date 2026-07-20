import { defineConfig } from 'eslint/config';

/**
 * @description Overrides for React/JSX files to relax rules that conflict with React patterns.
 * @author Dmytro Vakulenko
 */
export default defineConfig([
  {
    name: 'react/overrides',
    files: ['**/*.jsx', '**/*.tsx', '**/*.ts'],
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
]);
