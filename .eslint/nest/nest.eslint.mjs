import eslintNestJs from '@darraghor/eslint-plugin-nestjs-typed';
import { defineConfig } from 'eslint/config';

/**
 * @description ESLint config for NestJS projects using `@darraghor/eslint-plugin-nestjs-typed`.
 * @author Dmytro Vakulenko
 * @see https://github.com/darraghoriordan/eslint-plugin-nestjs-typed
 */
export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [...eslintNestJs.configs.flatRecommended],
  },
  {
    name: 'nestjs/overrides',
    files: ['**/*.ts'],
    rules: {
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'off',
      '@darraghor/nestjs-typed/api-enum-property-best-practices': 'off',
      'max-classes-per-file': 'off',
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
  {
    name: 'nestjs/module-files',
    files: ['**/*.module.*'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    name: 'nestjs/model-entity-files',
    files: ['**/models/**/*.ts', '**/entities/**/*.ts'],
    rules: {
      '@darraghor/nestjs-typed/param-decorator-name-matches-route-param': 'off',
      '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'off',
      '@darraghor/nestjs-typed/should-specify-forbid-unknown-values': 'off',
      '@darraghor/nestjs-typed/api-property-matches-property-optionality': 'off',
    },
  },
]);
