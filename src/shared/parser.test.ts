import { describe, it, expect } from 'vitest';
import { getLineAndColumn, createErrorSnippet, locateJsonSyntaxError } from './parser';

describe('shared/parser', () => {
  describe('getLineAndColumn', () => {
    it('computes line and column on single line', () => {
      const text = '{"a": 1}';
      expect(getLineAndColumn(text, 0)).toEqual({ line: 1, column: 1 });
      expect(getLineAndColumn(text, 5)).toEqual({ line: 1, column: 6 });
    });

    it('computes line and column across multiple lines', () => {
      const text = '{\n  "name": "Alice",\n  "age": 30\n}';
      // Line 1: "{\n" (index 0..1)
      // Line 2: "  \"name\": \"Alice\",\n" (index 2..20)
      // Line 3: "  \"age\": 30\n"
      const pos = getLineAndColumn(text, 24); // character 'a' in "age"
      expect(pos.line).toBe(3);
      expect(pos.column).toBe(4);
    });

    it('clamps negative or out-of-bounds indices safely', () => {
      const text = 'abc';
      expect(getLineAndColumn(text, -5)).toEqual({ line: 1, column: 1 });
      expect(getLineAndColumn(text, 100)).toEqual({ line: 1, column: 4 });
    });
  });

  describe('createErrorSnippet', () => {
    it('generates a snippet with line numbers and caret pointing to error column', () => {
      const text = '{\n  "bad": foo\n}';
      // "foo" starts around index 11
      const snippet = createErrorSnippet(text, 11, 1);
      expect(snippet).toContain('^');
      expect(snippet).toContain('"bad": foo');
    });

    it('handles first line errors correctly', () => {
      const text = 'bad json';
      const snippet = createErrorSnippet(text, 0, 1);
      expect(snippet).toContain('1 | bad json');
      expect(snippet).toContain('^');
    });
  });

  describe('locateJsonSyntaxError', () => {
    it('extracts coordinates from native error message containing "at position X"', () => {
      const input = '{"a": 1, }';
      const err = new SyntaxError('Unexpected token } in JSON at position 9');
      const pos = locateJsonSyntaxError(input, err);
      expect(pos.index).toBe(9);
      expect(pos.line).toBe(1);
      expect(pos.column).toBe(10);
    });

    it('extracts coordinates from native error message containing "line X column Y"', () => {
      const input = '{\n  "a": 1,\n  "b": \n}';
      const err = new SyntaxError('Unexpected token } in JSON at line 3 column 3');
      const pos = locateJsonSyntaxError(input, err);
      expect(pos.line).toBe(3);
      expect(pos.column).toBe(3);
    });

    it('handles empty input and EOF errors', () => {
      const emptyPos = locateJsonSyntaxError('');
      expect(emptyPos).toEqual({ line: 1, column: 1, index: 0 });

      const eofPos = locateJsonSyntaxError('{"unclosed":', new SyntaxError('Unexpected end of JSON input'));
      expect(eofPos.index).toBe(12);
    });

    it('fallback scanner finds syntax error for unquoted values', () => {
      const input = '{"name": Alice}';
      const pos = locateJsonSyntaxError(input);
      expect(pos.index).toBeGreaterThanOrEqual(8);
      expect(pos.line).toBe(1);
    });

    it('fallback scanner finds syntax error for trailing commas in objects and arrays', () => {
      const objInput = '{"a": 1,}';
      const objPos = locateJsonSyntaxError(objInput);
      expect(objPos.index).toBeGreaterThanOrEqual(7);

      const arrInput = '[1, 2,]';
      const arrPos = locateJsonSyntaxError(arrInput);
      expect(arrPos.index).toBeGreaterThanOrEqual(5);
    });

    it('fallback scanner finds unexpected characters after root value', () => {
      const input = '{"a": 1} trailing';
      const pos = locateJsonSyntaxError(input);
      expect(pos.index).toBe(9); // starts at 't'
    });
  });
});
