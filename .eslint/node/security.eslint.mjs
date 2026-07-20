import { defineConfig } from 'eslint/config';
import pluginSecurity from 'eslint-plugin-security';

/**
 * @description ESLint config for Node.js security rules via eslint-plugin-security.
 * @author Dmytro Vakulenko
 * @see https://github.com/nodesecurity/eslint-plugin-security
 */
export default defineConfig([
  {
    name: 'security',
    ...pluginSecurity.configs.recommended,
  },
]);
