import { describe, it, expect } from 'vitest';
import { minifyJson } from './index';

describe('json-minify', () => {
  it('removes spaces, tabs, and newlines outside of strings', () => {
    const formatted = `{\n  "name": "Alice",\n  "age": 30,\n  "scores": [\n    1,\n    2,\n    3\n  ]\n}`;
    const minified = minifyJson(formatted);
    expect(minified).toBe('{"name":"Alice","age":30,"scores":[1,2,3]}');
  });

  it('preserves spaces, tabs, and newlines inside string literals', () => {
    const input = '{\n  "message": "Hello   world! \\t Multi \\n line"\n}';
    const minified = minifyJson(input);
    expect(minified).toBe('{"message":"Hello   world! \\t Multi \\n line"}');
    expect(JSON.parse(minified).message).toBe('Hello   world! \t Multi \n line');
  });

  it('preserves escaped quotes and backslashes inside string literals', () => {
    const input = '{\n  "quote": "He said: \\"Hello\\"",\n  "path": "C:\\\\Users\\\\Karan"\n}';
    const minified = minifyJson(input);
    expect(minified).toBe('{"quote":"He said: \\"Hello\\"","path":"C:\\\\Users\\\\Karan"}');
    expect(JSON.parse(minified)).toEqual({
      quote: 'He said: "Hello"',
      path: 'C:\\Users\\Karan',
    });
  });

  it('preserves large number precision without rounding', () => {
    const input = '{\n  "huge": 123456789012345678901234567890\n}';
    const minified = minifyJson(input, { validate: false });
    expect(minified).toBe('{"huge":123456789012345678901234567890}');
  });

  it('minifies JavaScript object inputs directly', () => {
    const obj = { foo: 'bar', list: [1, 2, 3] };
    expect(minifyJson(obj)).toBe('{"foo":"bar","list":[1,2,3]}');
  });

  it('throws for unterminated string literals', () => {
    expect(() => minifyJson('{"name": "Alice}')).toThrow('Unterminated string');
  });

  it('throws for invalid JSON syntax when validate is true', () => {
    expect(() => minifyJson('{"a": 1,}')).toThrow();
  });
});
