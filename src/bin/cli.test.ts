import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCli } from './cli';

describe('CLI executable', () => {
  let stdoutMock: ReturnType<typeof vi.spyOn>;
  let stderrMock: ReturnType<typeof vi.spyOn>;
  let tempDir: string;

  beforeEach(() => {
    stdoutMock = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrMock = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-tools-test-'));
  });

  afterEach(() => {
    stdoutMock.mockRestore();
    stderrMock.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('prints help text when called with --help', async () => {
    const code = await runCli(['node', 'json-tools', '--help']);
    expect(code).toBe(0);
    expect(stdoutMock).toHaveBeenCalled();
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('@kjangid/json-tools CLI');
  });

  it('prints version matching package.json when called with --version or -v', async () => {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
    );

    const code = await runCli(['node', 'json-tools', '--version']);
    expect(code).toBe(0);
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output.trim()).toBe(pkg.version);

    stdoutMock.mockClear();
    const codeV = await runCli(['node', 'json-tools', '-v']);
    expect(codeV).toBe(0);
    const outputV = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(outputV.trim()).toBe(pkg.version);
  });

  it('formats JSON file with format command', async () => {
    const filePath = path.join(tempDir, 'test.json');
    fs.writeFileSync(filePath, '{"b":2,"a":1}');

    const code = await runCli(['node', 'json-tools', 'format', filePath, '--sort-keys']);
    expect(code).toBe(0);
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('minifies JSON file with minify command', async () => {
    const filePath = path.join(tempDir, 'test.json');
    fs.writeFileSync(filePath, '{\n  "hello": "world"\n}');

    const code = await runCli(['node', 'json-tools', 'minify', filePath]);
    expect(code).toBe(0);
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output.trim()).toBe('{"hello":"world"}');
  });

  it('validates JSON file with validate command', async () => {
    const validPath = path.join(tempDir, 'valid.json');
    fs.writeFileSync(validPath, '{"status": "ok"}');

    const invalidPath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(invalidPath, '{"status": }');

    const validCode = await runCli(['node', 'json-tools', 'validate', validPath]);
    expect(validCode).toBe(0);

    const invalidCode = await runCli(['node', 'json-tools', 'validate', invalidPath]);
    expect(invalidCode).toBe(1);
    const errOutput = stderrMock.mock.calls.map((c) => c[0]).join('');
    expect(errOutput).toContain('Invalid JSON');
  });

  it('diffs two JSON files with diff command', async () => {
    const file1 = path.join(tempDir, 'f1.json');
    const file2 = path.join(tempDir, 'f2.json');
    fs.writeFileSync(file1, '{"a":1,"b":2}');
    fs.writeFileSync(file2, '{"a":1,"b":99}');

    const code = await runCli(['node', 'json-tools', 'diff', file1, file2]);
    expect(code).toBe(1); // changes detected
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('~ b: 2 => 99');
  });

  it('flattens and unflattens JSON files', async () => {
    const filePath = path.join(tempDir, 'nested.json');
    fs.writeFileSync(filePath, '{"user":{"name":"Alice"}}');

    const flattenCode = await runCli(['node', 'json-tools', 'flatten', filePath]);
    expect(flattenCode).toBe(0);
    const flatOutput = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(flatOutput).toContain('"user.name": "Alice"');

    const flatFile = path.join(tempDir, 'flat.json');
    fs.writeFileSync(flatFile, '{"user.name":"Alice"}');
    const unflattenCode = await runCli(['node', 'json-tools', 'unflatten', flatFile]);
    expect(unflattenCode).toBe(0);
  });

  it('reads nested value with path command', async () => {
    const filePath = path.join(tempDir, 'data.json');
    fs.writeFileSync(filePath, '{"users":[{"name":"Bob"}]}');

    const code = await runCli(['node', 'json-tools', 'path', filePath, 'users[0].name']);
    expect(code).toBe(0);
    const output = stdoutMock.mock.calls.map((c) => c[0]).join('');
    expect(output.trim()).toBe('Bob');
  });
});
