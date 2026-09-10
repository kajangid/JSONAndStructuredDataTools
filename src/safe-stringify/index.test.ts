import { describe, it, expect } from 'vitest';
import { safeStringify } from './index';

describe('json-safe-stringify', () => {
  it('stringifies regular JSON data matching JSON.stringify', () => {
    const data = { a: 1, b: 'two', c: [3, 4], d: true, e: null };
    expect(safeStringify(data)).toBe(JSON.stringify(data));
    expect(safeStringify(data, 2)).toBe(JSON.stringify(data, null, 2));
  });

  it('handles direct circular references', () => {
    const obj: any = { name: 'circular' };
    obj.self = obj;

    const result = safeStringify(obj);
    expect(result).toBe('{"name":"circular","self":"[Circular]"}');
  });

  it('handles deep and complex circular references', () => {
    const a: any = { name: 'a' };
    const b: any = { name: 'b', refA: a };
    a.refB = b;

    const result = safeStringify(a);
    expect(result).toContain('"refB":{"name":"b","refA":"[Circular]"}');
  });

  it('handles circular references in arrays', () => {
    const arr: any[] = [1, 2];
    arr.push(arr);

    const result = safeStringify(arr);
    expect(result).toBe('[1,2,"[Circular]"]');
  });

  it('supports custom circular value placeholder', () => {
    const obj: any = { a: 1 };
    obj.loop = obj;

    const result = safeStringify(obj, { circularValue: '<CYCLE>' });
    expect(result).toBe('{"a":1,"loop":"<CYCLE>"}');
  });

  it('handles BigInt safely without throwing', () => {
    const data = { id: 1234567890123456789n };
    const result = safeStringify(data);
    expect(result).toBe('{"id":"1234567890123456789n"}');
  });

  it('serializes Map and Set', () => {
    const map = new Map<string, any>([
      ['foo', 'bar'],
      ['count', 42],
    ]);
    const set = new Set([1, 'two', 3]);
    const data = { myMap: map, mySet: set };

    const result = safeStringify(data);
    expect(JSON.parse(result)).toEqual({
      myMap: { foo: 'bar', count: 42 },
      mySet: [1, 'two', 3],
    });
  });

  it('serializes Error and RegExp objects', () => {
    const error = new Error('Test error');
    const regex = /test-[0-9]+/gi;
    const data = { error, regex };

    const result = safeStringify(data);
    const parsed = JSON.parse(result);
    expect(parsed.error.name).toBe('Error');
    expect(parsed.error.message).toBe('Test error');
    expect(parsed.regex).toBe('/test-[0-9]+/gi');
  });

  it('respects maxDepth limits', () => {
    const deepObj = {
      level1: {
        level2: {
          level3: {
            level4: 'deep value',
          },
        },
      },
    };

    const result = safeStringify(deepObj, { maxDepth: 2, maxDepthValue: '[CUT]' });
    const parsed = JSON.parse(result);
    expect(parsed.level1.level2).toBe('[CUT]');
  });

  it('respects indentation options', () => {
    const data = { a: 1, b: 2 };
    const result = safeStringify(data, { indent: 2 });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('supports replacer function', () => {
    const data = { secret: '12345', public: 'hello' };
    const result = safeStringify(data, {
      replacer: (key, val) => (key === 'secret' ? undefined : val),
    });
    expect(result).toBe('{"public":"hello"}');
  });
});
