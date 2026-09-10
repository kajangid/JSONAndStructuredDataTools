import { describe, it, expect } from 'vitest';
import * as IndexExports from './index';

describe('package root entrypoint (src/index.ts)', () => {
  it('exports all 9 core utilities and helper functions', () => {
    // 1. safe-parse
    expect(typeof IndexExports.safeParse).toBe('function');
    expect(typeof IndexExports.safeParseOrDefault).toBe('function');
    expect(typeof IndexExports.extractErrorPosition).toBe('function');

    // 2. safe-stringify
    expect(typeof IndexExports.safeStringify).toBe('function');

    // 3. formatter
    expect(typeof IndexExports.formatJson).toBe('function');
    expect(typeof IndexExports.colorizeJson).toBe('function');

    // 4. minify
    expect(typeof IndexExports.minifyJson).toBe('function');

    // 5. validator
    expect(typeof IndexExports.validateJson).toBe('function');
    expect(typeof IndexExports.isValidJson).toBe('function');
    expect(typeof IndexExports.assertValidJson).toBe('function');

    // 6. diff
    expect(typeof IndexExports.diffJson).toBe('function');
    expect(typeof IndexExports.formatDiff).toBe('function');

    // 7. flatten
    expect(typeof IndexExports.flattenJson).toBe('function');

    // 8. unflatten
    expect(typeof IndexExports.unflattenJson).toBe('function');

    // 9. path
    expect(typeof IndexExports.getPath).toBe('function');
    expect(typeof IndexExports.setPath).toBe('function');
    expect(typeof IndexExports.hasPath).toBe('function');
    expect(typeof IndexExports.deletePath).toBe('function');
    expect(typeof IndexExports.parsePath).toBe('function');

    // Shared security utilities
    expect(typeof IndexExports.isUnsafePropertyKey).toBe('function');
    expect(typeof IndexExports.hasOwn).toBe('function');
    expect(typeof IndexExports.createSafeRecord).toBe('function');
  });

  it('performs end-to-end integration workflows using root exports', () => {
    // 1. Flatten -> Unflatten cycle
    const original = { a: { b: { c: 'hello' } }, list: [1, 2, 3] };
    const flat = IndexExports.flattenJson(original);
    const restored = IndexExports.unflattenJson(flat);
    expect(restored).toEqual(original);

    // 2. Diff between modified copies
    const modified = IndexExports.setPath(restored as object, 'a.b.c', 'world', { immutable: true });
    const diff = IndexExports.diffJson(original, modified);
    expect(diff.hasChanges).toBe(true);
    expect(diff.summary.modifications).toBe(1);

    // 3. Stringify -> Minify -> Parse cycle
    const circularObj: any = { data: 12345n };
    const stringified = IndexExports.safeStringify(circularObj);
    const minified = IndexExports.minifyJson(stringified);
    const parsed = IndexExports.safeParse<{ data: string }>(minified);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data).toBe('12345n');
    }

    // 4. Formatter & Validator integration
    const formatted = IndexExports.formatJson({ valid: true }, { sortKeys: true });
    expect(IndexExports.isValidJson(formatted)).toBe(true);
  });
});
