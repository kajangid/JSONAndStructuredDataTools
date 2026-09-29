import { describe, it, expect } from 'vitest';
import { repairJson, safeRepairJson } from './index';

describe('json-repair', () => {
  it('fixes trailing commas in objects and arrays', () => {
    const broken = '{"a": 1, "b": [1, 2, ], }';
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ a: 1, b: [1, 2] });
  });

  it('strips single-line and multi-line comments', () => {
    const broken = `
      // Configuration file
      {
        /* DB settings */
        "port": 3000 // default port
      }
    `;
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ port: 3000 });
  });

  it('does not strip slashes inside string literals', () => {
    const broken = '{"url": "https://example.com/api//test"}';
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ url: 'https://example.com/api//test' });
  });

  it('fixes unquoted keys', () => {
    const broken = '{ name: "Alice", age: 30, $price: 9.99 }';
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ name: 'Alice', age: 30, $price: 9.99 });
  });

  it('converts single quotes to double quotes', () => {
    const broken = "{ 'title': 'Hello \"World\"', 'count': 5 }";
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ title: 'Hello "World"', count: 5 });
  });

  it('auto-closes missing closing braces and brackets', () => {
    const broken = '{"items": [{"id": 1';
    const repaired = repairJson(broken);
    expect(JSON.parse(repaired)).toEqual({ items: [{ id: 1 }] });
  });

  it('safeRepairJson returns success and parsed data', () => {
    const broken = '{ active: true, }';
    const result = safeRepairJson<{ active: boolean }>(broken);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ active: true });
  });

  it('safeRepairJson reports failure on unfixable syntax', () => {
    const unfixable = 'not json at all';
    const result = safeRepairJson(unfixable);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
