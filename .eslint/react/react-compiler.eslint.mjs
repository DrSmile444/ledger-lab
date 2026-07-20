import { defineConfig } from 'eslint/config';
import reactCompiler from 'eslint-plugin-react-compiler';

/**
 * @description Opt-in ESLint config for React Compiler rules (React 19+ with the compiler enabled).
 * Import this in your eslint.config.mjs only if you have the React Compiler set up.
 *
 * Usage:
 *   import reactCompilerEslint from './.eslint/react/react-compiler.eslint.mjs';
 *   export default defineConfig([...reactConfig, ...reactCompilerEslint]);
 *
 * @author Dmytro Vakulenko
 * @see https://react.dev/learn/react-compiler
 */
export default defineConfig([
  {
    name: 'react-compiler',
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]);
