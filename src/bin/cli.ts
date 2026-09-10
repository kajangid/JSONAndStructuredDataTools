#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { formatJson } from '../formatter/index';
import { minifyJson } from '../minify/index';
import { validateJson } from '../validator/index';
import { diffJson, formatDiff } from '../diff/index';
import { flattenJson } from '../flatten/index';
import { unflattenJson } from '../unflatten/index';
import { getPath } from '../path/index';
import { safeParse } from '../safe-parse/index';

const HELP_TEXT = `
@omnidev-tools/json-structured-data CLI

Usage:
  json-tools <command> [options] [arguments]
  or direct command alias: json-format, json-minify, json-validate, json-diff, etc.

Commands:
  format <file>       Pretty-print JSON (options: --indent=N, --sort-keys, --color)
  minify <file>       Remove all whitespace from JSON
  validate <file>     Validate JSON syntax with detailed error diagnostics
  diff <f1> <f2>      Deep structural diff between two JSON files (option: --color)
  flatten <file>      Flatten nested object to dot notation (options: --delimiter=D)
  unflatten <file>    Rebuild nested object from dot notation
  path <file> <expr>  Safely read nested value by path expression
  parse <file>        Safely parse JSON and output data or error

Options:
  --help, -h          Show this help message
  --version, -v       Show package version

Note: If <file> is omitted or "-", input will be read from stdin.
`;

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
  let result = '';
  stream.setEncoding('utf-8');
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
}

async function getInput(fileArg?: string): Promise<string> {
  if (fileArg && fileArg !== '-') {
    return fs.readFileSync(path.resolve(process.cwd(), fileArg), 'utf-8');
  }
  if (process.stdin.isTTY) {
    throw new Error('No input provided. Specify a file path or pipe data via stdin.');
  }
  return await readStream(process.stdin);
}

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        flags[arg.slice(2)] = true;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      flags[arg.slice(1)] = true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

export async function runCli(argv: string[] = process.argv): Promise<number> {
  const execName = path.basename(argv[1] || '').replace(/\.[cm]?js$/, '');
  const rawArgs = argv.slice(2);

  let command = '';
  let args = rawArgs;

  // Detect if invoked via direct binary alias (e.g. json-format, json-minify)
  if (execName.startsWith('json-') && execName !== 'json-tools') {
    command = execName.replace(/^json-/, '');
  } else if (rawArgs.length > 0 && !rawArgs[0]?.startsWith('-')) {
    command = rawArgs[0]!;
    args = rawArgs.slice(1);
  }

  const { positional, flags } = parseFlags(args);

  if (flags['help'] || flags['h'] || (!command && positional.length === 0)) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  if (flags['version'] || flags['v']) {
    process.stdout.write('1.0.0\n');
    return 0;
  }

  try {
    switch (command) {
      case 'format': {
        const input = await getInput(positional[0]);
        const indent = flags['indent'] ? parseInt(String(flags['indent']), 10) : 2;
        const sortKeys = flags['sort-keys'] === true;
        const color = flags['color'] === true;
        const output = formatJson(input, { indent, sortKeys, color });
        process.stdout.write(output + '\n');
        return 0;
      }

      case 'minify': {
        const input = await getInput(positional[0]);
        const output = minifyJson(input);
        process.stdout.write(output + '\n');
        return 0;
      }

      case 'validate': {
        const input = await getInput(positional[0]);
        const result = validateJson(input);
        if (result.valid) {
          process.stdout.write('Valid JSON.\n');
          return 0;
        } else {
          process.stderr.write(`Invalid JSON at line ${result.error.line}, column ${result.error.column}:\n`);
          process.stderr.write(result.error.snippet + '\n');
          process.stderr.write(result.error.message + '\n');
          return 1;
        }
      }

      case 'diff': {
        if (positional.length < 2) {
          process.stderr.write('Error: diff requires two file arguments: json-diff <file1> <file2>\n');
          return 2;
        }
        const file1 = fs.readFileSync(path.resolve(process.cwd(), positional[0]!), 'utf-8');
        const file2 = fs.readFileSync(path.resolve(process.cwd(), positional[1]!), 'utf-8');
        const color = flags['color'] === true;
        const diffResult = diffJson(file1, file2);
        process.stdout.write(formatDiff(diffResult, { color }) + '\n');
        return diffResult.hasChanges ? 1 : 0;
      }

      case 'flatten': {
        const input = await getInput(positional[0]);
        const delimiter = typeof flags['delimiter'] === 'string' ? flags['delimiter'] : '.';
        const flat = flattenJson(input, { delimiter });
        process.stdout.write(JSON.stringify(flat, null, 2) + '\n');
        return 0;
      }

      case 'unflatten': {
        const input = await getInput(positional[0]);
        const delimiter = typeof flags['delimiter'] === 'string' ? flags['delimiter'] : '.';
        const nested = unflattenJson(input, { delimiter });
        process.stdout.write(JSON.stringify(nested, null, 2) + '\n');
        return 0;
      }

      case 'path': {
        if (positional.length < 2) {
          process.stderr.write('Error: path requires a file and a path expression: json-path <file> <expr>\n');
          return 2;
        }
        const input = await getInput(positional[0]);
        const target = JSON.parse(input);
        const expr = positional[1]!;
        const val = getPath(target, expr);
        if (val === undefined) {
          process.stderr.write(`Path not found: ${expr}\n`);
          return 1;
        }
        process.stdout.write(typeof val === 'object' ? JSON.stringify(val, null, 2) + '\n' : String(val) + '\n');
        return 0;
      }

      case 'parse': {
        const input = await getInput(positional[0]);
        const result = safeParse(input);
        if (result.success) {
          process.stdout.write(JSON.stringify(result.data, null, 2) + '\n');
          return 0;
        } else {
          process.stderr.write(`Safe parse error: ${result.error.message}\n`);
          return 1;
        }
      }

      default: {
        process.stderr.write(`Unknown command: "${command}". Run "json-tools --help" for available commands.\n`);
        return 2;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    return 1;
  }
}

// Execute if run directly from command line
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.cjs') || process.argv[1].endsWith('cli.mjs') || process.argv[1].endsWith('cli.js'))) {
  runCli().then((code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}
