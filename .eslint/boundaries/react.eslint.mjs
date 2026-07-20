import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

/**
 * @description Architectural boundary rules for React projects.
 *
 * Default layers (innermost → outermost):
 *   utils → lib → hooks → components → features → pages
 *
 * - utils: pure functions, helpers
 * - lib: third-party wrappers and adapters
 * - hooks: custom React hooks
 * - components: reusable UI components (no page awareness)
 * - features: self-contained feature slices (may compose components + hooks)
 * - pages: route-level components (top of the tree, can import everything)
 *
 * Customize the `elements` and `rules` to match your project.
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/javierbrea/eslint-plugin-boundaries
 */
export default defineConfig([
  {
    name: 'boundaries/react/settings',
    settings: {
      'boundaries/elements': [
        { type: 'utils', pattern: 'src/utils/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'hooks', pattern: 'src/hooks/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'pages', pattern: 'src/pages/**' },
      ],
    },
  },
  {
    name: 'boundaries/react/rules',
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
            { from: 'hooks', allow: ['utils', 'lib'] },
            { from: 'components', allow: ['utils', 'lib', 'hooks'] },
            { from: 'features', allow: ['utils', 'lib', 'hooks', 'components'] },
            { from: 'pages', allow: ['utils', 'lib', 'hooks', 'components', 'features'] },
          ],
        },
      ],
    },
  },
]);
