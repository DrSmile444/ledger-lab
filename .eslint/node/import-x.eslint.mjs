import { defineConfig } from 'eslint/config';
import importX, { createNodeResolver } from 'eslint-plugin-import-x';

/**
 * @description Owned import-hygiene ruleset using `eslint-plugin-import-x`.
 *
 * Replaces the `import/*` rules that previously arrived implicitly through `eslint-config-airbnb-base`
 * (which activated the legacy, flat-config-incompatible `eslint-plugin-import`). We migrated to
 * `eslint-plugin-import-x` — a maintained, flat-config-native fork — registered under the `import-x`
 * namespace, and enumerate only the rules airbnb had actually switched on, with airbnb's exact options.
 *
 * Import ordering is owned separately by `eslint-plugin-simple-import-sort` (ordered-imports.eslint.mjs),
 * so `import-x/order` is intentionally left disabled (default), as are resolution-dependent rules that
 * the project explicitly turned off under airbnb (`no-unresolved`, `extensions`, `prefer-default-export`).
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/un-ts/eslint-plugin-import-x
 */
export default defineConfig([
  {
    name: 'import-x',
    plugins: {
      'import-x': importX,
    },
    settings: {
      // Mirror the resolution/ignore settings airbnb-base previously provided, so import analysis
      // (and rules like no-named-as-default-member / no-cycle) behaves identically. In particular
      // `ignore: ['node_modules', ...]` keeps the analyzer from parsing third-party package exports,
      // which is what suppressed false positives on plugin imports under the old config.
      //
      // Resolution uses import-x's own bundled resolver (`createNodeResolver`, the v4-recommended API)
      // rather than the legacy `{ node: ... }` string resolver — the latter would require
      // `eslint-import-resolver-node`, which import-x does not depend on (it's only present here
      // transitively via another plugin). `extensions` reproduces airbnb's resolver extensions.
      'import-x/resolver-next': [createNodeResolver({ extensions: ['.mjs', '.js', '.json'] })],
      'import-x/extensions': ['.js', '.mjs', '.jsx'],
      'import-x/core-modules': [],
      'import-x/ignore': ['node_modules', String.raw`\.(coffee|scss|css|less|hbs|svg|json)$`],
    },
    rules: {
      // ── Static analysis ─────────────────────────────────────────────
      'import-x/named': 'error',
      'import-x/export': 'error',
      'import-x/no-named-as-default': 'error',
      'import-x/no-named-as-default-member': 'error',
      'import-x/no-mutable-exports': 'error',

      // ── Module systems ──────────────────────────────────────────────
      'import-x/no-amd': 'error',
      'import-x/no-import-module-exports': ['error', { exceptions: [] }],

      // ── Style / correctness ─────────────────────────────────────────
      'import-x/first': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-named-default': 'error',

      // ── Path / dependency hygiene ───────────────────────────────────
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'test/**',
            'tests/**',
            'spec/**',
            '**/__tests__/**',
            '**/__mocks__/**',
            'test.{js,jsx}',
            'test-*.{js,jsx}',
            '**/*{.,_}{test,spec}.{js,jsx}',
            '**/jest.config.js',
            '**/jest.setup.js',
            '**/vue.config.js',
            '**/webpack.config.js',
            '**/webpack.config.*.js',
            '**/rollup.config.js',
            '**/rollup.config.*.js',
            '**/gulpfile.js',
            '**/gulpfile.*.js',
            '**/Gruntfile{,.js}',
            '**/protractor.conf.js',
            '**/protractor.conf.*.js',
            '**/karma.conf.js',
            '**/.eslintrc.js',
          ],
          optionalDependencies: false,
        },
      ],
      'import-x/no-absolute-path': 'error',
      'import-x/no-dynamic-require': 'error',
      'import-x/no-webpack-loader-syntax': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-cycle': ['error', { maxDepth: Number.POSITIVE_INFINITY }],
      'import-x/no-useless-path-segments': ['error', { commonjs: true }],
      'import-x/no-relative-packages': 'error',
    },
  },
]);
