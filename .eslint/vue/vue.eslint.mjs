import { defineConfig } from 'eslint/config';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

/**
 * @description Base ESLint config for Vue 3 SFCs: vue3-recommended preset with browser globals.
 * @author Dmytro Vakulenko
 * @see https://eslint.vuejs.org/
 */
export default defineConfig([
  ...pluginVue.configs['flat/vue3-recommended'],
  {
    name: 'vue/globals',
    files: ['**/*.vue'],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
