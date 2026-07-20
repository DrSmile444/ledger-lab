import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

/**
 * @description ESLint config for React projects: JSX runtime, hooks, and fast refresh rules.
 * @author Dmytro Vakulenko
 * @see https://github.com/jsx-eslint/eslint-plugin-react
 */
export default defineConfig([
  {
    name: 'react/settings',
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    name: 'react/rules',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    plugins: { react },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
    },
  },
]);
