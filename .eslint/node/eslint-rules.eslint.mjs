import { defineConfig } from 'eslint/config';

/**
 * @description ESLint overrides for config files at the project root and in .eslint/.
 * These files import devDependencies and don't need type-safe rules applied.
 * @author Dmytro Vakulenko
 */
export default defineConfig([
  {
    name: 'eslint-rules/config-files',
    files: ['./.eslint/**/*.{js,mjs,cjs,ts,tsx}', './eslint.config.mjs', './vitest.config.ts', './*.config.{ts,js,mjs,cjs}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-missing-import': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/tag-lines': 'off',
      'depend/ban-dependencies': 'off',
      // Config files may call functions from unresolved devDeps — not a real issue
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]);
