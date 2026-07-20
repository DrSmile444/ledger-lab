import { defineConfig } from 'eslint/config';

import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default defineConfig([
  {
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      // enable all recommended rules to report an error
      ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      'better-tailwindcss/no-unknown-classes': ['error', { detectComponentClasses: true }],
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'error',
        {
          strictness: 'loose', // Enable this option if prettier is used in your project.
        },
      ],
    },
  },
  {
    settings: {
      'better-tailwindcss': {
        // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
        entryPoint: 'src/index.css',
      },
    },
  },
]);
