import { defineConfig } from 'eslint/config';

/**
 * @description Owned "best practices" ruleset that replaces `eslint-config-airbnb-base`.
 *
 * Background: airbnb-base is effectively unmaintained, predates flat config, and only worked
 * here through `FlatCompat` plus `package.json` `overrides` forcing ESLint 10 onto it. We removed
 * the dependency entirely and inlined the rules the project actually relies on as an explicitly
 * owned set. Every rule below is a core ESLint rule (no plugin), copied with airbnb's exact options
 * so behavior is preserved.
 *
 * What was intentionally NOT carried over from airbnb (documented for future maintainers):
 *  - Formatting rules — delegated to Prettier / `@stylistic` (see stylistic.eslint.mjs, prettier.eslint.mjs).
 *  - `import/*` rules — moved to the owned import-x config (import-x.eslint.mjs).
 *  - `no-buffer-constructor` — covered by `n/no-deprecated-api` (eslint-plugin-n, recommended-module).
 *  - `no-new-object` — replaced by the modern core rule `no-object-constructor` below.
 *  - `lines-around-directive` — deprecated formatting rule; with ESM (`strict: never`) there are no
 *    directive prologues to pad, so it had no effect.
 *  - `lines-between-class-members` — migrated to `@stylistic/lines-between-class-members` (stylistic.eslint.mjs).
 *  - `no-return-await` — deprecated in ESLint core; on TS files `@typescript-eslint/return-await`
 *    (typed, smarter) replaces it, and re-adding the deprecated core rule for .js/.mjs is not worth it.
 *  - `no-new-symbol` — deprecated in core; superseded by `no-new-native-nonconstructor`, which the
 *    `@eslint/js` recommended config already enables (it catches `new Symbol()` and more).
 *
 * NOTE on the "base rules with typed variants" block below: airbnb applied its rules to every file
 * (it had no `files` filter). Several of those rules have typed `@typescript-eslint` replacements that
 * run on TS files only (tseslint-rules.eslint.mjs, overrides.eslint.mjs scope them to ts/tsx/mts/cts).
 * Keeping only the typed variants would silently stop covering the ~58 plain `.js/.mjs/.cjs` files (the
 * whole .eslint/ tree). So the core rules are declared here for all files; the TS configs (spread later)
 * turn the base rule off and enable the typed variant on TS — reproducing airbnb's behavior on both surfaces.
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/airbnb/javascript (original source of these rule choices)
 */
export default defineConfig([
  {
    name: 'best-practices',
    rules: {
      // ── Best practices ──────────────────────────────────────────────
      'array-callback-return': ['error', { allowImplicit: true, checkForEach: false, allowVoid: false }],
      'block-scoped-var': 'error',
      'consistent-return': ['error', { treatUndefinedAsUnspecified: false }],
      'default-case': ['error', { commentPattern: '^no default$' }],
      'default-case-last': 'error',
      'default-param-last': 'error',
      'grouped-accessor-pairs': ['error', 'anyOrder', { enforceForTSTypes: false }],
      'max-classes-per-file': ['error', 1],
      'no-alert': 'warn',
      'no-constructor-return': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-extend-native': ['error', { exceptions: [] }],
      'no-extra-bind': 'error',
      'no-extra-label': 'error',
      'no-iterator': 'error',
      'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: [
            'acc',
            'accumulator',
            'e',
            'ctx',
            'context',
            'req',
            'request',
            'res',
            'response',
            '$scope',
            'staticContext',
          ],
        },
      ],
      'no-proto': 'error',
      'no-restricted-properties': [
        'error',
        { object: 'arguments', property: 'callee', message: 'arguments.callee is deprecated' },
        { object: 'global', property: 'isFinite', message: 'Please use Number.isFinite instead' },
        { object: 'self', property: 'isFinite', message: 'Please use Number.isFinite instead' },
        { object: 'window', property: 'isFinite', message: 'Please use Number.isFinite instead' },
        { object: 'global', property: 'isNaN', message: 'Please use Number.isNaN instead' },
        { object: 'self', property: 'isNaN', message: 'Please use Number.isNaN instead' },
        { object: 'window', property: 'isNaN', message: 'Please use Number.isNaN instead' },
        { property: '__defineGetter__', message: 'Please use Object.defineProperty instead.' },
        { property: '__defineSetter__', message: 'Please use Object.defineProperty instead.' },
        { object: 'Math', property: 'pow', message: 'Use the exponentiation operator (**) instead.' },
      ],
      'no-return-assign': ['error', 'always'],
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': ['error', { allowInParentheses: true }],
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-void': ['error', { allowAsStatement: false }],
      'vars-on-top': 'error',
      yoda: ['error', 'never', { exceptRange: false, onlyEquality: false }],

      // ── Errors ──────────────────────────────────────────────────────
      // airbnb deliberately relaxed these two rules below the @eslint/js recommended defaults
      // (which set both to 'error'). Preserved here so removing airbnb causes no behavior change.
      'no-constant-condition': 'warn',
      'no-unused-private-class-members': 'off',
      'no-await-in-loop': 'error',
      'no-promise-executor-return': ['error', { allowVoid: false }],
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': ['error', { ignore: [] }],

      // ── ES6+ ────────────────────────────────────────────────────────
      'no-useless-computed-key': ['error', { enforceForClassMembers: true }],
      'no-useless-rename': ['error', { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }],
      'operator-assignment': ['error', 'always'],
      'prefer-destructuring': [
        'error',
        { VariableDeclarator: { array: false, object: true }, AssignmentExpression: { array: true, object: false } },
        { enforceForRenamedProperties: false },
      ],
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-object-spread': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'symbol-description': 'error',

      // ── Variables ───────────────────────────────────────────────────
      'no-label-var': 'error',
      'no-multi-assign': ['error', { ignoreNonDeclaration: false }],
      'no-restricted-globals': [
        'error',
        {
          name: 'isFinite',
          message: 'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
        },
        {
          name: 'isNaN',
          message: 'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
        },
        'addEventListener',
        'blur',
        'close',
        'closed',
        'confirm',
        'defaultStatus',
        'defaultstatus',
        'event',
        'external',
        'find',
        'focus',
        'frameElement',
        'frames',
        'history',
        'innerHeight',
        'innerWidth',
        'length',
        'location',
        'locationbar',
        'menubar',
        'moveBy',
        'moveTo',
        'name',
        'onblur',
        'onerror',
        'onfocus',
        'onload',
        'onresize',
        'onunload',
        'open',
        'opener',
        'opera',
        'outerHeight',
        'outerWidth',
        'pageXOffset',
        'pageYOffset',
        'parent',
        'print',
        'removeEventListener',
        'resizeBy',
        'resizeTo',
        'screen',
        'screenLeft',
        'screenTop',
        'screenX',
        'screenY',
        'scroll',
        'scrollbars',
        'scrollBy',
        'scrollTo',
        'scrollX',
        'scrollY',
        'self',
        'status',
        'statusbar',
        'stop',
        'toolbar',
        'top',
      ],

      // ── Style (logic-level, non-formatting) ─────────────────────────
      camelcase: ['error', { allow: [], ignoreDestructuring: false, ignoreGlobals: false, ignoreImports: false, properties: 'never' }],
      // Naming for TS files is covered (and exceeded) by @typescript-eslint/naming-convention,
      // but that rule does not run on plain .js/.mjs files — camelcase keeps those covered.
      'func-names': ['warn', 'always', {}],
      'new-cap': [
        'error',
        {
          capIsNew: false,
          capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List'],
          newIsCap: true,
          newIsCapExceptions: [],
          properties: true,
        },
      ],
      'no-continue': 'error',
      'no-inner-declarations': ['error', 'functions', { blockScopedFunctions: 'allow' }],
      'no-lonely-if': 'error',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: false }],
      'no-restricted-exports': ['error', { restrictedNamedExports: ['default', 'then'] }],
      'one-var': ['error', 'never'],

      /**
       * Old airbnb config also restricted `for...of` loops here. That was written for legacy
       * browser targets where Babel transpiled `for...of`/generators and injected regenerator-runtime,
       * adding bundle weight. Node 22+/modern TS targets emit native `for...of`, so the concern no
       * longer applies and the restriction is deliberately dropped — only labels and `with` remain.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain.',
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],

      // ── Strict mode / encoding ──────────────────────────────────────
      strict: ['error', 'never'],
      'unicode-bom': ['error', 'never'],

      // ── Modern replacement for the deprecated `no-new-object` ───────
      'no-object-constructor': 'error',

      // ── Node.js antipatterns ────────────────────────────────────────
      // These are deprecated in ESLint core but still function, and eslint-plugin-n no longer
      // ships equivalents. Retained to preserve the protections airbnb provided; revisit if/when
      // a maintained replacement appears or the rules are removed from core.
      'global-require': 'error',
      'no-new-require': 'error',
      'no-path-concat': 'error',

      // ── Base rules with typed variants (see NOTE in the file header) ─
      // Declared for all files so .js/.mjs stay covered; on TS the tseslint configs turn the base
      // rule off and run the @typescript-eslint/* variant. `prefer-rest-params` has no typed variant
      // and simply applies everywhere, exactly as airbnb did.
      'no-array-constructor': 'error',
      'no-implied-eval': 'error',
      'no-shadow': 'error',
      'no-useless-constructor': 'error',
      'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
      'prefer-rest-params': 'error',
    },
  },
]);
