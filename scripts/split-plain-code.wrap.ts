/* eslint-disable import-x/no-extraneous-dependencies,unicorn/no-process-exit,security/detect-non-literal-fs-filename */
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import deepmerge from 'deepmerge';

type Json = Record<string, unknown>;

const PKG = 'package.json';
const PKG_ORIGINAL = 'package-original.json';
const SPLIT_SCRIPT = path.join('scripts', 'split-plain-code.ts');

/**
 * Spawn a child process and resolve with its exit code.
 * @param cmd - The command to execute.
 * @param commandArguments - Arguments to pass to the command.
 * @returns A promise that resolves to the process exit code.
 */
function run(cmd: string, commandArguments: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, commandArguments, { stdio: 'inherit' });

    child.on('error', reject);

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

/**
 * Read and parse a JSON file from disk.
 * @param filePath - Absolute or relative path to the JSON file.
 * @returns The parsed JSON object.
 */
async function readJson(filePath: string): Promise<Json> {
  const raw = await fs.readFile(filePath, 'utf8');

  return JSON.parse(raw) as Json;
}

/**
 * Serialize a JSON object and write it to a file with 2-space indentation.
 * @param filePath - Absolute or relative path to write to.
 * @param json - The JSON object to serialize.
 */
async function writeJson(filePath: string, json: Json): Promise<void> {
  const raw = `${JSON.stringify(json, null, 2)}\n`;

  await fs.writeFile(filePath, raw, 'utf8');
}

/**
 * Check whether a file or directory exists at the given path.
 * @param filePath - The path to check.
 * @returns `true` if the path is accessible, `false` otherwise.
 */
async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);

    return true;
  } catch {
    return false;
  }
}

/**
 * Entry point: back up `package.json`, run the split script, merge results, then clean up.
 */
async function main(): Promise<void> {
  const currentWorkingDirectory = process.cwd();
  const packagePath = path.join(currentWorkingDirectory, PKG);
  const originalPath = path.join(currentWorkingDirectory, PKG_ORIGINAL);
  const splitPath = path.join(currentWorkingDirectory, SPLIT_SCRIPT);

  if (!(await exists(packagePath))) {
    throw new Error(`Cannot find ${PKG} in: ${currentWorkingDirectory}`);
  }

  if (!(await exists(splitPath))) {
    throw new Error(`Cannot find split script at: ${SPLIT_SCRIPT}`);
  }

  // 1) backup current package.json -> package-original.json
  await fs.copyFile(packagePath, originalPath);

  const restoreOriginal = async () => {
    if (await exists(originalPath)) {
      await fs.copyFile(originalPath, packagePath);
    }
  };

  try {
    // 2) run the split script, forwarding ALL args passed to this wrapper
    const forwardedArguments = process.argv.slice(2);

    console.dir({ forwardedArgs: forwardedArguments, splitPath });

    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const exitCode = await run(npxCmd, ['tsx', splitPath, ...forwardedArguments]);

    if (exitCode !== 0) {
      throw new Error(`split-plain-code.ts failed with exit code ${String(exitCode)}`);
    }

    // 3) merge: "new one into the original one"
    // original = package-original.json
    // new      = package.json (after split script)
    const originalPackage = await readJson(originalPath);
    const newPackage = await readJson(packagePath);

    const merged = deepmerge(originalPackage, newPackage, {
      // package.json arrays (keywords/files/etc.) should usually be replaced, not concatenated
      arrayMerge: (_destination, source) => source as string[],
    });

    // 4) write merged back to package.json
    await writeJson(packagePath, merged);
  } catch (error) {
    // if anything goes wrong, restore package.json from the backup
    await restoreOriginal();
    throw error;
  } finally {
    // 5) remove temp backup
    if (await exists(originalPath)) {
      await fs.unlink(originalPath).catch(() => {
        // intentionally swallowed
      });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
