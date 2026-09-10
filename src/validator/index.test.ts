import { describe, it, expect } from 'vitest';
import { validateJson, isValidJson, assertValidJson } from './index';

describe('json-validator', () => {
  it('returns valid: true for valid JSON structures', () => {
    expect(validateJson('{"name":"Alice"}').valid).toBe(true);
    expect(validateJson('[1, 2, 3]').valid).toBe(true);
    expect(validateJson('"string"').valid).toBe(true);
    expect(validateJson('123.45').valid).toBe(true);
    expect(validateJson('true').valid).toBe(true);
    expect(validateJson('null').valid).toBe(true);
  });

  it('reports error diagnostics with line, column, and snippet for invalid syntax', () => {
    const invalid = `{\n  "name": "Alice",\n  "age": 30,\n}`;
    const result = validateJson(invalid);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.line).toBeGreaterThanOrEqual(3);
      expect(result.error.column).toBeGreaterThanOrEqual(1);
      expect(result.error.snippet).toContain('^');
      expect(result.error.message).toBeDefined();
    }
  });

  it('reports errors for missing colon', () => {
    const invalid = '{"missing" 123}';
    const result = validateJson(invalid);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.snippet).toContain('^');
    }
  });

  it('reports error for non-string input', () => {
    const result = validateJson(123 as any);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toContain('Expected input to be a string');
    }
  });

  it('isValidJson returns boolean check', () => {
    expect(isValidJson('{"ok":true}')).toBe(true);
    expect(isValidJson('{bad json}')).toBe(false);
    expect(isValidJson(null)).toBe(false);
  });

  it('assertValidJson succeeds on valid and throws on invalid', () => {
    expect(() => assertValidJson('{"ok":true}')).not.toThrow();
    expect(() => assertValidJson('{"fail":}')).toThrowError(/JSON Validation Failed/);
  });
});
