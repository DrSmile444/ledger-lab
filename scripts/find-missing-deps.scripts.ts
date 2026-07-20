/* eslint-disable sonarjs/slow-regex,no-continue,no-plusplus,no-use-before-define,unicorn/no-process-exit,sonarjs/no-alphabetical-sort,unicorn/no-array-sort,security/detect-non-literal-fs-filename,security/detect-object-injection,security/detect-unsafe-regex,regexp/no-super-linear-backtracking */
import { spawn } from 'node:child_process';
import type { Dirent } from 'node:fs';
import { accessSync, promises as fs, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import { resolveTsconfigPaths } from '../.eslint/tsconfig.utils.mjs';

interface CliOptions {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dir: string;
  dryRun: boolean;
  dev: boolean;
  packageManager?: 'bun' | 'npm' | 'pnpm' | 'yarn';
}

const BUILTIN_SET = new Set([
  ...builtinModules,
  ...builtinModules
    .map((nodeModule) => `node:${nodeModule}`)
    .map((nodeModule) => (nodeModule.startsWith('node:') ? nodeModule.slice(5) : nodeModule)),
]);

const DEFAULT_INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const DEFAULT_EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.output', 'coverage', '.vercel']);

/**
 * Minimal, robust-enough extractor for import specifiers from TS/JS files.
 * Handles:
 *   import x from 'pkg'
 *   import 'pkg'
 *   export * from 'pkg'
 *   export {x} from 'pkg'
 *   const x = require('pkg')
 *   await import('pkg')
 *
 * It ignores relative/absolute paths and filters built-ins later.
 * @param code - The source file content to extract specifiers from.
 * @returns An array of unique module specifier strings found in the source.
 */
function extractModuleSpecifiers(code: string): string[] {
  const specs = new Set<string>();

  // ESM static imports & re-exports
  const importExportRe = /\b(?:import|export)\s+(?:[^'"]*?\sfrom\s*)?['"]([^'"]+)['"]/g;

  for (const moduleSpecifier of code.matchAll(importExportRe)) {
    specs.add(moduleSpecifier[1]);
  }

  // CommonJS require()
  const requireRe = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const moduleArray of code.matchAll(requireRe)) {
    specs.add(moduleArray[1]);
  }

  // Dynamic import()
  const dynImportRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const moduleSpecifier of code.matchAll(dynImportRe)) {
    specs.add(moduleSpecifier[1]);
  }

  return [...specs];
}

/**
 * Convert a deep import specifier to its top-level package name.
 * For example: `lodash/map` → `lodash`, `@types/node/fs` → `@types/node`.
 * @param spec - The module specifier to normalize.
 * @returns The top-level package name.
 */
function toTopLevelPackageName(spec: string): string {
  if (spec.startsWith('@')) {
    const parts = spec.split('/', 2);

    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }

  return spec.split('/', 1)[0];
}

/**
 * Determine whether a specifier looks like an installable package (not a relative or absolute path).
 * @param spec - The module specifier to check.
 * @returns `true` if the specifier is a package-like reference, `false` otherwise.
 */
function isPackageLike(spec: string): boolean {
  return !!spec && !spec.startsWith('.') && !spec.startsWith('/') && !spec.includes(':');
}

/**
 * Recursively walk a directory tree and yield paths to files with allowed extensions.
 * @param directory - The root directory to start walking from.
 * @param includeExtension - Set of file extensions (e.g. `.ts`) to include.
 * @param excludeDirectories - Set of directory names to skip entirely.
 * @yields {string} Absolute file paths for each matching file found.
 */
async function* walkDirectory(directory: string, includeExtension: Set<string>, excludeDirectories: Set<string>): AsyncGenerator<string> {
  let entries: Dirent[];

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!excludeDirectories.has(entry.name)) {
        yield* walkDirectory(full, includeExtension, excludeDirectories);
      }
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase();

      if (includeExtension.has(extension)) {
        yield full;
      }
    }
  }
}

/**
 * Read and parse a JSON file, returning `null` if the file cannot be read or parsed.
 * @param filePath - Path to the JSON file.
 * @returns The parsed value typed as `T`, or `null` on failure.
 */
async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(filePath, 'utf8');

    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

/**
 * Detect the package manager in use by inspecting lock files and the `packageManager` field.
 * @param projectDirectory - The project root directory to inspect.
 * @param forced - An explicit package manager override from CLI options.
 * @returns The detected or forced package manager name.
 */
function detectPackageManager(projectDirectory: string, forced?: CliOptions['packageManager']) {
  if (forced) {
    return forced;
  }

  const has = (filePath: string) => safeExists(path.join(projectDirectory, filePath));

  // lockfile-based detection
  if (has('pnpm-lock.yaml')) {
    return 'pnpm';
  }

  if (has('yarn.lock')) {
    return 'yarn';
  }

  if (has('bun.lockb')) {
    return 'bun';
  }

  // packageManager field
  try {
    const packageJsonPath = path.join('package.json');
    const packageFile = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
    const pm = typeof packageFile.packageManager === 'string' ? packageFile.packageManager : undefined;

    if (pm?.startsWith('pnpm@')) {
      return 'pnpm';
    }

    if (pm?.startsWith('yarn@')) {
      return 'yarn';
    }

    if (pm?.startsWith('bun@')) {
      return 'bun';
    }

    if (pm?.startsWith('npm@')) {
      return 'npm';
    }
  } catch {
    /* ignore */
  }

  return 'npm'; // default fallback
}

/**
 * Synchronously check whether a file system path is accessible.
 * @param filePath - The path to check.
 * @returns `true` if accessible, `false` otherwise.
 */
function safeExists(filePath: string): boolean {
  try {
    // Using sync here is fine: tiny calls and avoids race conditions
    accessSync(filePath);

    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a top-level package is present in the project's `node_modules`.
 * @param projectDirectory - The project root directory containing `node_modules`.
 * @param topLevel - The top-level package name to look up.
 * @returns `true` if the package directory exists in `node_modules`, `false` otherwise.
 */
function isInstalledInNodeModules(projectDirectory: string, topLevel: string): boolean {
  // Support scoped packages in node_modules
  const nmPath = path.join(projectDirectory, 'node_modules', topLevel);

  return safeExists(nmPath);
}

// Helper to get tsconfig path aliases
/**
 * Read a `tsconfig.json` and return the list of configured path alias prefixes.
 * @param tsconfigPath - Absolute path to the `tsconfig.json` file.
 * @returns An array of alias prefix strings (e.g. `@/`, `~src/`).
 */
function getTsconfigAliases(tsconfigPath: string): string[] {
  try {
    const pathsObject = resolveTsconfigPaths(tsconfigPath);

    return Object.keys(pathsObject).map((alias) => alias.replace(/\*$/, ''));
  } catch {
    return [];
  }
}

// Helper to process a file and collect referenced packages
/**
 * Extract package references from a single source file and add them to the shared set.
 * @param file - Absolute path to the source file to analyze.
 * @param tsconfigAliases - List of tsconfig path alias prefixes to skip.
 * @param referenced - Mutable set that accumulates discovered top-level package names.
 */
async function collectReferencedFromFile(file: string, tsconfigAliases: string[], referenced: Set<string>) {
  const code = await fs.readFile(file, 'utf8');

  for (const spec of extractModuleSpecifiers(code)) {
    if (!isPackageLike(spec)) {
      continue;
    }

    if (tsconfigAliases.some((alias) => spec.startsWith(alias))) {
      continue;
    }

    const bare = spec.startsWith('node:') ? spec.slice(5) : spec;

    if (BUILTIN_SET.has(bare)) {
      continue;
    }

    referenced.add(toTopLevelPackageName(bare));
  }
}

interface FindUninstalledDepsReturn {
  referencedTopLevel: Set<string>;
  uninstalled: string[];
}

/**
 * Scan a project directory for all imported packages and identify those not installed in `node_modules`.
 * @param root - The project root directory to scan.
 * @returns An object with the full set of referenced packages and the subset that are uninstalled.
 */
async function findUninstalledDeps(root: string): Promise<FindUninstalledDepsReturn> {
  const referenced = new Set<string>();

  // Get tsconfig path aliases
  const tsconfigPath = path.join(root, '../tsconfig.json');
  const tsconfigAliases = getTsconfigAliases(tsconfigPath);

  for await (const file of walkDirectory(root, DEFAULT_INCLUDE_EXT, DEFAULT_EXCLUDE_DIRS)) {
    await collectReferencedFromFile(file, tsconfigAliases, referenced);
  }

  const uninstalled = [...referenced].filter((packageFile) => !isInstalledInNodeModules(root, packageFile));

  return { referencedTopLevel: referenced, uninstalled };
}

/**
 * Install a list of packages using the specified package manager.
 * @param projectDirectory - The project root where the install command will run.
 * @param pkgs - The list of package names to install.
 * @param pm - The package manager to use.
 * @param development - Whether to install as devDependencies.
 * @returns The exit code of the install process.
 */
async function installDependencies(
  projectDirectory: string,
  pkgs: string[],
  pm: ReturnType<typeof detectPackageManager>,
  development: boolean,
): Promise<number> {
  if (pkgs.length === 0) {
    return 0;
  }

  const cmds: Record<string, [string, string[]]> = {
    pnpm: development ? ['pnpm', ['add', '-D', ...pkgs]] : ['pnpm', ['add', ...pkgs]],
    yarn: development ? ['yarn', ['add', '--dev', ...pkgs]] : ['yarn', ['add', ...pkgs]],
    npm: development ? ['npm', ['i', '-D', ...pkgs]] : ['npm', ['i', ...pkgs]],
    bun: development ? ['bun', ['add', '-d', ...pkgs]] : ['bun', ['add', ...pkgs]],
  };

  const [cmd, parsedArguments] = cmds[pm] ?? cmds.npm;

  return new Promise<number>((resolve, reject) => {
    const child = spawn(cmd, parsedArguments, { stdio: 'inherit', cwd: projectDirectory, shell: process.platform === 'win32' });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', reject);
  });
}

/**
 * Parse CLI arguments into structured options for the script.
 * @param argv - Raw process argument list (typically `process.argv`).
 * @returns Parsed `CliOptions` with directory, flags, and package manager selection.
 */
function parseArguments(argv: string[]): CliOptions {
  const out: CliOptions = { dir: '', dryRun: false, dev: false };

  for (let index = 2; index < argv.length; index += 1) {
    const option = argv[index];

    if (option === '--dry-run') {
      out.dryRun = true;
    } else if (option === '--dev' || option === '-D') {
      out.dev = true;
    } else if (option.startsWith('--dir=')) {
      out.dir = option.slice('--dir='.length);
    } else if (option === '--dir' && index + 1 < argv.length) {
      out.dir = argv[++index];
    } else if (option.startsWith('--package-manager=')) {
      out.packageManager = option.slice('--package-manager='.length) as CliOptions['packageManager'];
    } else if (option === '--package-manager' && index + 1 < argv.length) {
      out.packageManager = argv[++index] as CliOptions['packageManager'];
    } else if (option === '-h' || option === '--help') {
      printHelpAndExit();
    } else {
      // ignore unknowns to keep it simple/forwards-compatible
    }
  }

  if (!out.dir) {
    console.error('Error: --dir is required');
    printHelpAndExit(1);
  }

  out.dir = path.resolve(process.cwd(), out.dir);

  return out;
}

/**
 * Print usage information to stdout and exit the process.
 * @param code - The exit code to use (default `0` for success).
 */
function printHelpAndExit(code = 0): never {
  console.info(
    `
Usage:
  tsx tools/find-uninstalled-deps.ts --dir <project> [--dry-run] [--dev|-D] [--package-manager <pnpm|yarn|npm|bun>]

Description:
  Scans the project for imported/required packages that are NOT present in node_modules.
  Prints the list. If not --dry-run, installs them as dependencies (default) or devDependencies (with --dev/-D).

Examples:
  tsx tools/find-uninstalled-deps.ts --dir . --dry-run
  tsx tools/find-uninstalled-deps.ts --dir ./packages/app --dev
  tsx tools/find-uninstalled-deps.ts --dir ./packages/app -D --package-manager pnpm
`.trim(),
  );

  process.exit(code);
}

/**
 * Entry point: parse arguments, scan for uninstalled dependencies, and install them if needed.
 */
async function main() {
  const options = parseArguments(process.argv);

  const packageJsonPath = path.join('package.json');

  const packageJson = await readJson(packageJsonPath);

  if (!packageJson) {
    console.error(`Error: package.json not found under ${options.dir}`);
    process.exit(1);
  }

  console.info(`🔎 Scanning: ${options.dir}`);
  const { uninstalled, referencedTopLevel } = await findUninstalledDeps(options.dir);

  const pm = detectPackageManager(options.dir, options.packageManager);

  console.info(`📦 Package manager: ${pm}`);

  // Optional: give visibility into what's referenced
  console.info(`📚 Referenced packages (top-level): ${String(referencedTopLevel.size)}`);

  if (referencedTopLevel.size > 0) {
    console.info([...referencedTopLevel].sort().join(', '));
  }

  if (uninstalled.length === 0) {
    console.info('✅ No uninstalled dependencies detected.');

    return;
  }

  console.info('\n🚩 Uninstalled dependencies:');

  for (const optionalParameters of uninstalled) {
    console.info('  -', optionalParameters);
  }

  if (options.dryRun) {
    console.info('\nℹ️  Dry-run enabled; skipping installation.');

    return;
  }

  const installType = options.dev ? 'devDependencies' : 'dependencies';

  console.info(`\n🧰 Installing as ${installType}...`);
  const code = await installDependencies(options.dir, uninstalled, pm, options.dev);

  if (code === 0) {
    console.info(`✅ Installed missing packages as ${installType}.`);
  } else {
    console.error(`❌ Installer exited with code ${String(code)}`);
    process.exit(code);
  }
}

main().catch((error: unknown) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
