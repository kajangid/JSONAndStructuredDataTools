import { describe, it, expect } from 'vitest';
import {
  escapeJsonPointer,
  unescapeJsonPointer,
  parseJsonPointer,
  compileJsonPointer,
  createPatch,
  applyPatch,
  safeApplyPatch,
  JsonPatchError,
} from './index';

describe('JSON Patch (RFC 6902 / RFC 6901)', () => {
  it('correctly escapes and unescapes JSON Pointer tokens', () => {
    expect(escapeJsonPointer('foo/bar~baz')).toBe('foo~1bar~0baz');
    expect(unescapeJsonPointer('foo~1bar~0baz')).toBe('foo/bar~baz');
    expect(parseJsonPointer('/foo~1bar/0')).toEqual(['foo/bar', '0']);
    expect(compileJsonPointer(['foo/bar', 0])).toBe('/foo~1bar/0');
    expect(compileJsonPointer([])).toBe('');
  });

  it('generates patch operations between two objects', () => {
    const a = { name: 'Alice', age: 30, city: 'London' };
    const b = { name: 'Alice', age: 31, country: 'UK' };

    const patch = createPatch(a, b);
    expect(patch).toEqual([
      { op: 'remove', path: '/city' },
      { op: 'replace', path: '/age', value: 31 },
      { op: 'add', path: '/country', value: 'UK' },
    ]);
  });

  it('generates patch operations between two arrays', () => {
    const a = [1, 2, 3];
    const b = [1, 99, 3, 4];

    const patch = createPatch(a, b);
    expect(patch).toEqual([
      { op: 'replace', path: '/1', value: 99 },
      { op: 'add', path: '/3', value: 4 },
    ]);
  });

  it('applies add, remove, and replace operations correctly', () => {
    const doc = { foo: 'bar', numbers: [1, 2, 3] };

    const patch = [
      { op: 'add', path: '/baz', value: 'qux' },
      { op: 'replace', path: '/foo', value: 'updated' },
      { op: 'remove', path: '/numbers/1' },
      { op: 'add', path: '/numbers/-', value: 4 },
    ] as const;

    const result = applyPatch(doc, patch as any);
    expect(result).toEqual({
      foo: 'updated',
      baz: 'qux',
      numbers: [1, 3, 4],
    });
    // Verify immutability
    expect(doc.foo).toBe('bar');
  });

  it('supports move and copy operations', () => {
    const doc = { a: { name: 'item' }, b: {} };

    const copyPatch = [{ op: 'copy', from: '/a/name', path: '/b/name' }] as const;
    const copied = applyPatch(doc, copyPatch as any);
    expect(copied).toEqual({ a: { name: 'item' }, b: { name: 'item' } });

    const movePatch = [{ op: 'move', from: '/a/name', path: '/b/moved' }] as const;
    const moved = applyPatch(doc, movePatch as any);
    expect(moved).toEqual({ a: {}, b: { moved: 'item' } });
  });

  it('verifies test operations and throws on mismatch', () => {
    const doc = { count: 10 };

    const passPatch = [{ op: 'test', path: '/count', value: 10 }] as const;
    expect(() => applyPatch(doc, passPatch as any)).not.toThrow();

    const failPatch = [{ op: 'test', path: '/count', value: 99 }] as const;
    expect(() => applyPatch(doc, failPatch as any)).toThrow(JsonPatchError);

    const safeResult = safeApplyPatch(doc, failPatch as any);
    expect(safeResult.success).toBe(false);
    expect(safeResult.error).toContain('Test failed');
  });

  it('replaces root document when path is empty string', () => {
    const doc = { a: 1 };
    const patch = [{ op: 'replace', path: '', value: [1, 2, 3] }] as const;
    const result = applyPatch(doc, patch as any);
    expect(result).toEqual([1, 2, 3]);
  });

  it('rejects prototype pollution attempts', () => {
    const doc = {};
    const maliciousPatch = [
      { op: 'add', path: '/__proto__/polluted', value: 'yes' },
    ] as const;

    expect(() => applyPatch(doc, maliciousPatch as any)).toThrow(JsonPatchError);
    expect((Object.prototype as any).polluted).toBeUndefined();
  });
});
