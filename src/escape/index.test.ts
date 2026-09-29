import { describe, it, expect } from 'vitest';
import { escapeJsonString, unescapeJsonString } from './index';

describe('json-escape', () => {
  it('escapes quotes, backslashes, and control characters', () => {
    expect(escapeJsonString('hello "world"')).toBe('hello \\"world\\"');
    expect(escapeJsonString('path\\to\\file')).toBe('path\\\\to\\\\file');
    expect(escapeJsonString('line1\nline2\tindent')).toBe('line1\\nline2\\tindent');
  });

  it('escapes unicode characters', () => {
    expect(escapeJsonString('\u0000')).toBe('\\u0000');
    expect(escapeJsonString('👋 hello')).toBe('👋 hello');
  });

  it('unescapes JSON-escaped strings', () => {
    expect(unescapeJsonString('hello \\"world\\"')).toBe('hello "world"');
    expect(unescapeJsonString('path\\\\to\\\\file')).toBe('path\\to\\file');
    expect(unescapeJsonString('line1\\nline2')).toBe('line1\nline2');
    expect(unescapeJsonString('\\u0041\\u0042')).toBe('AB');
  });

  it('unescapes strings enclosed in quotes', () => {
    expect(unescapeJsonString('"hello \\"world\\""')).toBe('hello "world"');
  });

  it('round-trips arbitrary strings', () => {
    const raw = 'Quote: ", Backslash: \\, Newline: \n, Tab: \t, Emoji: 🚀';
    const escaped = escapeJsonString(raw);
    const unescaped = unescapeJsonString(escaped);
    expect(unescaped).toBe(raw);
  });

  it('throws TypeError on invalid input', () => {
    // @ts-expect-error testing invalid type
    expect(() => escapeJsonString(123)).toThrow(TypeError);
    // @ts-expect-error testing invalid type
    expect(() => unescapeJsonString(null)).toThrow(TypeError);
  });
});
