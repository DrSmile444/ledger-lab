import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';

/**
 * ESLint config for padding-line rules using `@stylistic/eslint-plugin`.
 * @author Dmytro Vakulenko
 * @see https://github.com/eslint-stylistic/eslint-stylistic
 */
export default defineConfig([
  {
    name: 'stylistic',
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // Migrated from airbnb's deprecated core `lines-between-class-members`. `exceptAfterOverload`
      // is set to `false` explicitly: the core rule had no such option, so leaving @stylistic's
      // `true` default would silently stop requiring a blank line after TS method-overload signatures.
      // `false` preserves the original behavior exactly.
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false, exceptAfterOverload: false }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: 'return', prev: '*' },
        { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
        { blankLine: 'any', next: ['const', 'let', 'var'], prev: ['const', 'let', 'var'] },
        { blankLine: 'always', next: '*', prev: 'directive' },
        { blankLine: 'any', next: 'directive', prev: 'directive' },
        { blankLine: 'always', next: '*', prev: 'multiline-block-like' },
        { blankLine: 'always', next: 'if', prev: ['if', 'const', 'let', 'var'] },
        { blankLine: 'always', next: ['const', 'let', 'var'], prev: ['if'] },
        { blankLine: 'always', next: '*', prev: ['import'] },
        { blankLine: 'any', next: 'import', prev: 'import' },
        { blankLine: 'always', next: ['export', 'class', 'default', 'function'], prev: ['export', 'class', 'default', 'function'] },
        { blankLine: 'always', next: ['multiline-const', 'multiline-let', 'multiline-expression'], prev: '*' },
        { blankLine: 'always', next: '*', prev: ['multiline-const', 'multiline-let', 'multiline-expression'] },
        { blankLine: 'always', next: 'block', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'block' },
        { blankLine: 'always', next: 'block-like', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'block-like' },
        { blankLine: 'always', next: 'return', prev: '*' },
        // case/default rules — must come LAST to override block-like rules above
        { blankLine: 'never', next: 'default', prev: 'case' },
        { blankLine: 'never', next: 'case', prev: 'case' },
        { blankLine: 'never', next: 'default', prev: '*' },
        { blankLine: 'never', next: 'case', prev: '*' },
        { blankLine: 'never', next: '*', prev: 'case' },
        { blankLine: 'never', next: '*', prev: 'default' },
        { blankLine: 'always', next: 'case', prev: 'block-like' },
        { blankLine: 'always', next: 'default', prev: 'block-like' },
      ],
    },
  },
]);
