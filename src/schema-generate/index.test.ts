import { describe, it, expect } from 'vitest';
import { generateSchema, generateSchemaJson } from './index';

describe('JSON Schema Generator', () => {
  it('generates schemas for primitive values', () => {
    expect(generateSchema('hello')).toMatchObject({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'string',
    });
    expect(generateSchema(42).type).toBe('integer');
    expect(generateSchema(3.14).type).toBe('number');
    expect(generateSchema(true).type).toBe('boolean');
    expect(generateSchema(null).type).toBe('null');
  });

  it('infers schema for complex nested objects', () => {
    const user = {
      name: 'Alice',
      age: 30,
      active: true,
      address: {
        city: 'Wonderland',
      },
    };

    const schema = generateSchema(user, { title: 'UserSchema' });
    expect(schema.title).toBe('UserSchema');
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(['name', 'age', 'active', 'address']);
    expect(schema.properties?.name).toEqual({ type: 'string' });
    expect(schema.properties?.age).toEqual({ type: 'integer' });
    expect(schema.properties?.address).toEqual({
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    });
  });

  it('infers schema for homogeneous arrays', () => {
    const list = [1, 2, 3];
    const schema = generateSchema(list);
    expect(schema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: { type: 'integer' },
    });
  });

  it('infers and merges schemas across array objects', () => {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob', role: 'admin' },
    ];

    const schema = generateSchema(users);
    expect(schema.type).toBe('array');
    expect(schema.items).toEqual({
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        role: { type: 'string' },
      },
      required: ['id', 'name'], // common required across all items
    });
  });

  it('respects required: false option', () => {
    const doc = { a: 1, b: 'two' };
    const schema = generateSchema(doc, { required: false });
    expect(schema.required).toBeUndefined();
  });

  it('formats schema as JSON string via generateSchemaJson', () => {
    const json = generateSchemaJson({ a: 1 }, { indent: 2 });
    expect(typeof json).toBe('string');
    expect(JSON.parse(json).type).toBe('object');
  });

  it('guards against prototype pollution keys', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "name": "Safe"}');
    const schema = generateSchema(malicious);
    expect(schema.properties?.['__proto__']).toBeUndefined();
    expect(schema.properties?.name).toBeDefined();
  });
});
