import { defineConfig } from 'eslint/config';

import i18nEslint from './i18n/i18n.eslint.mjs';

/**
 * @description Opt-in ESLint config enforcing i18n best practices.
 * Prevents hardcoded user-facing strings and enforces i18nService.t(...) usage.
 * @author Dmytro Vakulenko
 */
export default defineConfig([...i18nEslint]);
