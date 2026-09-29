import { describe, it, expect } from 'vitest';
import { mergeJson, mergeJsonWithOptions } from './index';

describe('json-merge', () => {
  it('merges shallow objects with overwrite', () => {
    const a = { x: 1, y: 2 };
    const b = { y: 99, z: 3 };
    const result = mergeJson(a, b);
    expect(result).toEqual({ x: 1, y: 99, z: 3 });
  });

  it('merges nested objects deeply', () => {
    const target = { user: { name: 'Alice', settings: { theme: 'light' } } };
    const source = { user: { settings: { theme: 'dark', font: 'mono' } } };
    const result = mergeJson(target, source);
    expect(result).toEqual({
      user: {
        name: 'Alice',
        settings: { theme: 'dark', font: 'mono' },
      },
    });
  });

  it('replaces arrays by default', () => {
    const target = { tags: ['dev', 'js'] };
    const source = { tags: ['ts'] };
    expect(mergeJson(target, source)).toEqual({ tags: ['ts'] });
  });

  it('concatenates arrays when arrayMode is concat', () => {
    const target = { tags: ['a', 'b'] };
    const source = { tags: ['b', 'c'] };
    const result = mergeJsonWithOptions({ arrayMode: 'concat' }, target, source);
    expect(result).toEqual({ tags: ['a', 'b', 'b', 'c'] });
  });

  it('unions arrays when arrayMode is union', () => {
    const target = { tags: ['a', 'b'] };
    const source = { tags: ['b', 'c'] };
    const result = mergeJsonWithOptions({ arrayMode: 'union' }, target, source);
    expect(result).toEqual({ tags: ['a', 'b', 'c'] });
  });

  it('merges multiple sources in sequence', () => {
    const a = { v: 1 };
    const b = { v: 2, extra: true };
    const c = { v: 3, done: true };
    const result = mergeJson(a, b, c);
    expect(result).toEqual({ v: 3, extra: true, done: true });
  });

  it('protects against prototype pollution', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "safe": 123}');
    const target = {};
    const result = mergeJson(target, malicious);
    expect(result).toEqual({ safe: 123 });
    expect(({} as any).polluted).toBeUndefined();
  });

  it('handles non-object primitives gracefully', () => {
    expect(mergeJson('hello', 'world')).toBe('world');
    expect(mergeJson(123, { a: 1 })).toEqual({ a: 1 });
  });
});
