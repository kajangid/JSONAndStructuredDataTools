import { describe, it, expect } from 'vitest';
import { safeParse, safeParseOrDefault } from './index';

describe('json-safe-parse', () => {
  it('successfully parses valid JSON object', () => {
    const json = '{"name":"Alice","age":30,"isAdmin":true}';
    const result = safeParse<{ name: string; age: number; isAdmin: boolean }>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'Alice', age: 30, isAdmin: true });
    }
  });

  it('successfully parses valid JSON arrays and primitives', () => {
    expect(safeParse('[1, 2, 3]').data).toEqual([1, 2, 3]);
    expect(safeParse('"hello"').data).toBe('hello');
    expect(safeParse('123.45').data).toBe(123.45);
    expect(safeParse('true').data).toBe(true);
    expect(safeParse('false').data).toBe(false);
    expect(safeParse('null').data).toBe(null);
  });

  it('returns failure on invalid JSON syntax without throwing', () => {
    const invalidJson = '{"key": "value",}'; // trailing comma
    const result = safeParse(invalidJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.position).toBeDefined();
      expect(result.position?.line).toBeGreaterThanOrEqual(1);
      expect(result.position?.column).toBeGreaterThanOrEqual(1);
    }
  });

  it('provides accurate line and column for multiline errors', () => {
    const multilineJson = `{\n  "valid": true,\n  "bad": foo\n}`;
    const result = safeParse(multilineJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.position).toBeDefined();
      expect(result.position?.line).toBe(3);
    }
  });

  it('handles empty string and EOF errors gracefully', () => {
    const result = safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('handles non-string inputs safely', () => {
    const nullResult = safeParse(null as any);
    expect(nullResult.success).toBe(false);

    const undefResult = safeParse(undefined as any);
    expect(undefResult.success).toBe(false);

    const numResult = safeParse(123 as any);
    expect(numResult.success).toBe(false);
  });

  it('supports fallback option', () => {
    const fallback = { fallback: true };
    const result = safeParse('{invalid', { fallback });

    expect(result.success).toBe(false);
    expect(result.data).toEqual(fallback);
  });

  it('supports reviver function', () => {
    const json = '{"date":"2026-01-01T00:00:00.000Z"}';
    const result = safeParse<{ date: Date }>(json, {
      reviver: (key, val) => (key === 'date' ? new Date(val) : val),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.date.getFullYear()).toBe(2026);
    }
  });

  it('safeParseOrDefault returns parsed data on success, fallback on failure', () => {
    const fallback = { status: 'default' };
    const successResult = safeParseOrDefault('{"status":"ok"}', fallback);
    expect(successResult).toEqual({ status: 'ok' });

    const failResult = safeParseOrDefault('invalid json', fallback);
    expect(failResult).toEqual(fallback);
  });
});
