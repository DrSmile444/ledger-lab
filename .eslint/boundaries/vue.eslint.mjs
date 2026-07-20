import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

/**
 * @description Architectural boundary rules for Vue 3 projects.
 *
 * Default layers (innermost → outermost):
 *   utils → lib → composables → stores → components → features → views → router
 *
 * - utils: pure functions, helpers
 * - lib: third-party wrappers and adapters
 * - composables: Vue Composition API composables (stateless reactive logic)
 * - stores: Pinia store definitions (global state, may use composables)
 * - components: reusable UI components (no view/route awareness)
 * - features: self-contained feature slices (compose components + composables + stores)
 * - views: route-level view components (top of the component tree)
 * - router: Vue Router definitions (imports views for lazy-loaded routes)
 *
 * Customize the `elements` and `rules` to match your project.
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/javierbrea/eslint-plugin-boundaries
 */
export default defineConfig([
  {
    name: 'boundaries/vue/settings',
    settings: {
      'boundaries/elements': [
        { type: 'utils', pattern: 'src/utils/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'composables', pattern: 'src/composables/**' },
        { type: 'stores', pattern: 'src/stores/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'views', pattern: 'src/views/**' },
        { type: 'router', pattern: 'src/router/**' },
      ],
    },
  },
  {
    name: 'boundaries/vue/rules',
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
            { from: 'composables', allow: ['utils', 'lib'] },
            { from: 'stores', allow: ['utils', 'lib', 'composables'] },
            { from: 'components', allow: ['utils', 'lib', 'composables', 'stores'] },
            { from: 'features', allow: ['utils', 'lib', 'composables', 'stores', 'components'] },
            { from: 'views', allow: ['utils', 'lib', 'composables', 'stores', 'components', 'features'] },
            { from: 'router', allow: ['views'] },
          ],
        },
      ],
    },
  },
]);
