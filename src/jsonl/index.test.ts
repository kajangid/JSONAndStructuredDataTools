import { describe, it, expect } from 'vitest';
import { parseJsonl, stringifyJsonl, formatJsonlSummary } from './index';

describe('jsonl', () => {
  it('parses valid JSONL into records', () => {
    const raw = '{"id": 1, "name": "Alice"}\n{"id": 2, "name": "Bob"}\n{"id": 3, "name": "Charlie"}';
    const result = parseJsonl<{ id: number; name: string }>(raw);
    expect(result.validCount).toBe(3);
    expect(result.errorCount).toBe(0);
    expect(result.records).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
  });

  it('skips empty lines and whitespace lines', () => {
    const raw = '\n  {"a": 1}  \n\n\n{"b": 2}\n';
    const result = parseJsonl(raw);
    expect(result.validCount).toBe(2);
    expect(result.records).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('captures syntax errors with line numbers', () => {
    const raw = '{"id": 1}\nNOT_JSON\n{"id": 3}';
    const result = parseJsonl(raw);
    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(1);
    expect(result.errors[0]?.line).toBe(2);
    expect(result.errors[0]?.raw).toBe('NOT_JSON');
  });

  it('stops on first error when ignoreErrors is false', () => {
    const raw = '{"id": 1}\nINVALID\n{"id": 3}';
    const result = parseJsonl(raw, { ignoreErrors: false });
    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.records).toEqual([{ id: 1 }]);
  });

  it('respects maxRecords limit', () => {
    const raw = '{"a": 1}\n{"b": 2}\n{"c": 3}';
    const result = parseJsonl(raw, { maxRecords: 2 });
    expect(result.records.length).toBe(2);
  });

  it('stringifies records into JSONL', () => {
    const records = [{ id: 1 }, { id: 2 }];
    const jsonl = stringifyJsonl(records);
    expect(jsonl).toBe('{"id":1}\n{"id":2}');
  });

  it('formats a human-readable summary', () => {
    const raw = '{"id": 1, "title": "First"}\n{"id": 2, "title": "Second"}';
    const summary = formatJsonlSummary(raw);
    expect(summary).toContain('Valid Records: 2');
    expect(summary).toContain('Errors:        0');
    expect(summary).toContain('{"id":1,"title":"First"}');
  });

  it('throws on non-string input for parse and non-array for stringify', () => {
    // @ts-expect-error testing invalid type
    expect(() => parseJsonl(123)).toThrow(TypeError);
    // @ts-expect-error testing invalid type
    expect(() => stringifyJsonl('not array')).toThrow(TypeError);
  });
});
