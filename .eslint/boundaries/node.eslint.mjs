import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

/**
 * @description Architectural boundary rules for Node.js projects (layered architecture).
 *
 * Default layers (innermost → outermost):
 *   utils → lib → services → controllers → app
 *
 * Customize the `elements` and `rules` arrays to match your project structure.
 * Import this in your eslint.config.mjs alongside nodeConfig to enforce boundaries.
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/javierbrea/eslint-plugin-boundaries
 */
export default defineConfig([
  {
    name: 'boundaries/node/settings',
    settings: {
      'boundaries/elements': [
        { type: 'utils', pattern: 'src/utils/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'services', pattern: 'src/services/**' },
        { type: 'controllers', pattern: 'src/controllers/**' },
        { type: 'app', pattern: 'src/app/**' },
      ],
    },
  },
  {
    name: 'boundaries/node/rules',
    plugins: { boundaries },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'utils', allow: [] },
            { from: 'lib', allow: ['utils'] },
            { from: 'services', allow: ['utils', 'lib'] },
            { from: 'controllers', allow: ['utils', 'lib', 'services'] },
            { from: 'app', allow: ['utils', 'lib', 'services', 'controllers'] },
          ],
        },
      ],
    },
  },
]);
