import { defineConfig } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

import { eslintLogger } from '../logger.mjs';
import { resolveTsconfigPath, resolveTsconfigPaths } from '../tsconfig.utils.mjs';

const logger = eslintLogger('ordered-imports');

/**
 * Builds the ordered-imports ESLint config, dynamically deriving import groups from tsconfig paths.
 * @param {{ rootDir?: string, tsconfig?: string }} [options]
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function createOrderedImportsConfig(options = {}) {
  const tsconfigPath = resolveTsconfigPath(options);
  const allPaths = resolveTsconfigPaths(tsconfigPath);

  let tsconfigPathsGroups = [];

  if (allPaths && Object.keys(allPaths).length > 0) {
    tsconfigPathsGroups = Object.keys(allPaths).map((key) => {
      const clearKey = key.replace('/*', '');

      return [`^${clearKey}(/.*|$)?`];
    });

    logger.info('Resolved tsconfig paths groups for ordered-imports:', tsconfigPathsGroups);
  } else {
    logger.info('No tsconfig paths found. Internal package import groups will not be generated.');
  }

  return defineConfig([
    {
      name: 'ordered-imports',
      plugins: {
        'simple-import-sort': simpleImportSort,
      },
      rules: {
        'simple-import-sort/exports': 'off',
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              // node: built-ins first
              ['^node'],
              // NestJS
              ['^@?nestjs'],
              // React and related
              ['^react', String.raw`^@?\w*react`, String.raw`^@?\w*jsx-runtime`],
              // All other npm packages
              [String.raw`^@?\w`],
              // Internal packages split by alias
              ...tsconfigPathsGroups,
              // Side-effect imports
              [String.raw`^\u0000`],
              // Parent imports — put `..` last
              [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
              // Other relative imports — same-folder and `.` last
              [String.raw`^\./(?=.*/)(?!/?$)`, String.raw`^\.(?!/?$)`, String.raw`^\./?$`],
              // Style imports
              [String.raw`^.+\.?(css)$`],
            ],
          },
        ],
      },
    },
  ]);
}

/**
 * @description ESLint config for dynamically resolved ordered imports using eslint-plugin-simple-import-sort. Automatically generates import groups from tsconfig path aliases.
 * @author Dmytro Vakulenko
 * @see https://github.com/lydell/eslint-plugin-simple-import-sort
 */
export default createOrderedImportsConfig();
