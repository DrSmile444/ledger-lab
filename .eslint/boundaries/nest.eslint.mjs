import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

/**
 * @description Architectural boundary rules for NestJS projects.
 *
 * Default layers (innermost → outermost):
 *   entities → repositories → services → controllers → modules
 *
 * - entities: database models / TypeORM entities
 * - repositories: data access layer
 * - services: business logic
 * - controllers: HTTP/WebSocket handlers
 * - modules: NestJS module definitions (can import anything to wire DI)
 *
 * Customize the `elements` and `rules` to match your project.
 *
 * @author Dmytro Vakulenko
 * @see https://github.com/javierbrea/eslint-plugin-boundaries
 */
export default defineConfig([
  {
    name: 'boundaries/nest/settings',
    settings: {
      'boundaries/elements': [
        { type: 'entities', pattern: 'src/**/entities/**' },
        { type: 'repositories', pattern: 'src/**/repositories/**' },
        { type: 'services', pattern: 'src/**/services/**' },
        { type: 'controllers', pattern: 'src/**/controllers/**' },
        { type: 'modules', pattern: 'src/**/modules/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'common', pattern: 'src/common/**' },
      ],
    },
  },
  {
    name: 'boundaries/nest/rules',
    plugins: { boundaries },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'entities', allow: ['common'] },
            { from: 'repositories', allow: ['entities', 'common'] },
            { from: 'services', allow: ['entities', 'repositories', 'common', 'config'] },
            { from: 'controllers', allow: ['services', 'common', 'config'] },
            { from: 'modules', allow: ['entities', 'repositories', 'services', 'controllers', 'common', 'config'] },
            { from: 'common', allow: [] },
            { from: 'config', allow: [] },
          ],
        },
      ],
    },
  },
]);
