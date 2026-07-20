import { defineConfig } from 'eslint/config';

import jestEslint from './jest/jest.eslint.mjs';

/**
 * @description Opt-in ESLint config for Jest test files.
 * Use vitest.eslint.mjs instead if your project uses Vitest.
 * @author Dmytro Vakulenko
 */
export default defineConfig([...jestEslint]);
