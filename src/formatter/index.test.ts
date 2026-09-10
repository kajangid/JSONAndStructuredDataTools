import { describe, it, expect } from 'vitest';
import { formatJson, colorizeJson } from './index';

describe('json-formatter', () => {
  it('formats raw JSON string with default 2-space indentation', () => {
    const raw = '{"b":1,"a":2}';
    const result = formatJson(raw);
    expect(result).toBe('{\n  "b": 1,\n  "a": 2\n}');
  });

  it('formats JavaScript object with 4-space indentation', () => {
    const obj = { name: 'test', count: 10 };
    const result = formatJson(obj, { indent: 4 });
    expect(result).toBe('{\n    "name": "test",\n    "count": 10\n}');
  });

  it('formats with tab indentation', () => {
    const obj = { key: 'val' };
    const result = formatJson(obj, { indent: '\t' });
    expect(result).toBe('{\n\t"key": "val"\n}');
  });

  it('sorts keys alphabetically when sortKeys: true', () => {
    const unsorted = { z: 1, a: 2, m: { y: 10, b: 20 } };
    const result = formatJson(unsorted, { sortKeys: true });
    expect(result).toBe(
      '{\n  "a": 2,\n  "m": {\n    "b": 20,\n    "y": 10\n  },\n  "z": 1\n}'
    );
  });

  it('sorts keys using custom comparator function', () => {
    const obj = { alpha: 1, beta: 2, gamma: 3 };
    // Reverse alphabetical sort
    const result = formatJson(obj, {
      sortKeys: (a, b) => b.localeCompare(a),
    });
    const parsedKeys = Object.keys(JSON.parse(result));
    expect(parsedKeys).toEqual(['gamma', 'beta', 'alpha']);
  });

  it('adds ANSI color codes when color: true', () => {
    const obj = { name: 'Alice', age: 30, active: true, notes: null };
    const colored = formatJson(obj, { color: true });

    // Check ANSI escape codes
    expect(colored).toContain('\x1b[');
    expect(colored).toContain('"Alice"');
    expect(colored).toContain('30');
    expect(colored).toContain('true');
    expect(colored).toContain('null');
  });

  it('colorizeJson colorizes correctly', () => {
    const raw = '{\n  "status": "ok",\n  "code": 200\n}';
    const colored = colorizeJson(raw);
    expect(colored).toContain('\x1b[36m"status"\x1b[0m');
    expect(colored).toContain('\x1b[32m"ok"\x1b[0m');
    expect(colored).toContain('\x1b[33m200\x1b[0m');
  });

  it('throws error for invalid JSON string input', () => {
    expect(() => formatJson('{invalid')).toThrow();
  });
});
