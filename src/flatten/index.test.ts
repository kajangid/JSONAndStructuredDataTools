import { describe, it, expect } from 'vitest';
import { flattenJson } from './index';

describe('json-flatten', () => {
  it('flattens simple nested objects with dot notation', () => {
    const input = {
      user: {
        name: 'Alice',
        address: {
          city: 'Wonderland',
          zip: 12345,
        },
      },
    };

    const flat = flattenJson(input);
    expect(flat).toEqual({
      'user.name': 'Alice',
      'user.address.city': 'Wonderland',
      'user.address.zip': 12345,
    });
  });

  it('flattens arrays by default with numeric indices', () => {
    const input = {
      items: ['first', 'second'],
      tags: [{ id: 1, label: 'news' }],
    };

    const flat = flattenJson(input);
    expect(flat).toEqual({
      'items.0': 'first',
      'items.1': 'second',
      'tags.0.id': 1,
      'tags.0.label': 'news',
    });
  });

  it('preserves arrays as leaf nodes when flattenArrays: false', () => {
    const input = {
      user: 'Bob',
      roles: ['admin', 'editor'],
    };

    const flat = flattenJson(input, { flattenArrays: false });
    expect(flat).toEqual({
      user: 'Bob',
      roles: ['admin', 'editor'],
    });
  });

  it('supports custom delimiter', () => {
    const input = {
      server: {
        host: 'localhost',
        port: 8080,
      },
    };

    const flat = flattenJson(input, { delimiter: '/' });
    expect(flat).toEqual({
      'server/host': 'localhost',
      'server/port': 8080,
    });
  });

  it('respects maxDepth option', () => {
    const input = {
      level1: {
        level2: {
          level3: 'deep',
        },
      },
    };

    const flat = flattenJson(input, { maxDepth: 1 });
    expect(flat).toEqual({
      level1: {
        level2: {
          level3: 'deep',
        },
      },
    });
  });

  it('preserves empty objects and empty arrays', () => {
    const input = {
      emptyObj: {},
      emptyArr: [],
      data: 1,
    };

    const flat = flattenJson(input);
    expect(flat).toEqual({
      emptyObj: {},
      emptyArr: [],
      data: 1,
    });
  });

  it('parses JSON string input automatically', () => {
    const json = '{"a":{"b":1}}';
    const flat = flattenJson(json);
    expect(flat).toEqual({ 'a.b': 1 });
  });
});
