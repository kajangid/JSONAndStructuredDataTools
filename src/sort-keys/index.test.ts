import { describe, it, expect } from 'vitest';
import { sortKeys, sortKeysJson } from './index';

describe('json-sort-keys', () => {
  it('sorts shallow object keys alphabetically', () => {
    const input = { z: 1, a: 2, m: 3 };
    const sorted = sortKeys(input);
    expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
  });

  it('sorts nested object keys recursively by default', () => {
    const input = {
      b: { z: 1, y: 2 },
      a: { d: 4, c: 3 },
    };
    const sorted = sortKeys(input);
    expect(Object.keys(sorted)).toEqual(['a', 'b']);
    expect(Object.keys(sorted.a)).toEqual(['c', 'd']);
    expect(Object.keys(sorted.b)).toEqual(['y', 'z']);
  });

  it('preserves array order while sorting objects inside arrays', () => {
    const input = [
      { z: 1, a: 2 },
      { y: 3, b: 4 },
    ];
    const sorted = sortKeys(input);
    expect(Object.keys(sorted[0])).toEqual(['a', 'z']);
    expect(Object.keys(sorted[1])).toEqual(['b', 'y']);
  });

  it('supports shallow-only sorting when deep is false', () => {
    const input = {
      z: { b: 1, a: 2 },
      a: 1,
    };
    const sorted = sortKeys(input, { deep: false });
    expect(Object.keys(sorted)).toEqual(['a', 'z']);
    expect(Object.keys(sorted.z)).toEqual(['b', 'a']);
  });

  it('supports custom comparator functions', () => {
    const input = { a: 1, b: 2, c: 3 };
    // Reverse sort
    const sorted = sortKeys(input, { compareFn: (a, b) => b.localeCompare(a) });
    expect(Object.keys(sorted)).toEqual(['c', 'b', 'a']);
  });

  it('strips unsafe prototype pollution keys', () => {
    const malicious = JSON.parse('{"__proto__": {"hacked": true}, "safe": 123}');
    const sorted = sortKeys(malicious);
    expect(Object.keys(sorted)).toEqual(['safe']);
    expect(({} as any).hacked).toBeUndefined();
  });

  it('sortKeysJson formats string and object inputs', () => {
    const jsonStr = '{"c": 3, "a": 1, "b": 2}';
    const result = sortKeysJson(jsonStr, { indent: 2 });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}');
  });

  it('returns primitives and null as-is', () => {
    expect(sortKeys(null)).toBeNull();
    expect(sortKeys('str')).toBe('str');
    expect(sortKeys(42)).toBe(42);
    expect(sortKeys(true)).toBe(true);
  });
});
