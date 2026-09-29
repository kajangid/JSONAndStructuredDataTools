import { describe, it, expect } from 'vitest';
import {
  parseJsonPath,
  compileJsonPath,
  queryJsonPath,
  testJsonPath,
} from './index';

describe('JSONPath (RFC 9535)', () => {
  const store = {
    name: 'Bookstore',
    books: [
      { id: 1, title: 'Book A', author: 'Nigel', price: 10 },
      { id: 2, title: 'Book B', author: 'Evelyn', price: 20 },
      { id: 3, title: 'Book C', author: 'Nigel', price: 30 },
    ],
    meta: {
      tags: ['fiction', 'bestseller'],
    },
  };

  it('parses basic JSONPath expressions', () => {
    const steps = parseJsonPath('$.books[*].title');
    expect(steps).toEqual([
      { type: 'property', name: 'books' },
      { type: 'wildcard' },
      { type: 'property', name: 'title' },
    ]);
  });

  it('queries dot and bracket child properties', () => {
    expect(queryJsonPath(store, '$.name')).toEqual(['Bookstore']);
    expect(queryJsonPath(store, '$["name"]')).toEqual(['Bookstore']);
    expect(queryJsonPath(store, 'meta.tags[0]')).toEqual(['fiction']);
  });

  it('supports positive and negative array indices', () => {
    expect(queryJsonPath(store, '$.books[0].title')).toEqual(['Book A']);
    expect(queryJsonPath(store, '$.books[-1].title')).toEqual(['Book C']);
    expect(queryJsonPath(store, '$.books[99]')).toEqual([]);
  });

  it('supports array slicing [start:end]', () => {
    const titles = queryJsonPath(store, '$.books[0:2].title');
    expect(titles).toEqual(['Book A', 'Book B']);

    const lastTwo = queryJsonPath(store, '$.books[1:].title');
    expect(lastTwo).toEqual(['Book B', 'Book C']);
  });

  it('supports wildcards on objects and arrays', () => {
    const allTitles = queryJsonPath(store, '$.books[*].title');
    expect(allTitles).toEqual(['Book A', 'Book B', 'Book C']);

    const metaValues = queryJsonPath(store, '$.meta.*');
    expect(metaValues).toEqual([['fiction', 'bestseller']]);
  });

  it('supports recursive descent (..) anywhere in document', () => {
    const allAuthors = queryJsonPath(store, '$..author');
    expect(allAuthors).toEqual(['Nigel', 'Evelyn', 'Nigel']);

    const allTitles = queryJsonPath(store, '..title');
    expect(allTitles).toEqual(['Book A', 'Book B', 'Book C']);
  });

  it('supports union selectors [a, b]', () => {
    const props = queryJsonPath(store, '$.books[0]["id", "title"]');
    expect(props).toEqual([1, 'Book A']);

    const items = queryJsonPath(store, '$.books[0, 2].title');
    expect(items).toEqual(['Book A', 'Book C']);
  });

  it('tests expression presence with testJsonPath', () => {
    expect(testJsonPath(store, '$.books[0]')).toBe(true);
    expect(testJsonPath(store, '$..price')).toBe(true);
    expect(testJsonPath(store, '$.nonExistent')).toBe(false);
    expect(testJsonPath(store, '$.books[100]')).toBe(false);
  });

  it('guards against prototype pollution traversal', () => {
    expect(queryJsonPath(store, '$..__proto__')).toEqual([]);
    expect(queryJsonPath(store, '$["__proto__"]')).toEqual([]);
    expect(queryJsonPath(store, '$.constructor')).toEqual([]);
  });

  it('works with compiled expressions and JSON strings', () => {
    const query = compileJsonPath<string>('$.books[*].title');
    const jsonStr = JSON.stringify(store);
    expect(query(jsonStr)).toEqual(['Book A', 'Book B', 'Book C']);
  });
});
