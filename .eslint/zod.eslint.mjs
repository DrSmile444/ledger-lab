import { defineConfig } from 'eslint/config';

import importZodEslint from './zod/import-zod.eslint.mjs';
import zodXEslint from './zod/zod.eslint.mjs';

export default defineConfig([...importZodEslint, ...zodXEslint]);
