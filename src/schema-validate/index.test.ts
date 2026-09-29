import { describe, it, expect } from 'vitest';
import { validateSchema, isValidSchema, assertValidSchema } from './index';

describe('JSON Schema Validator', () => {
  it('validates primitive types and union types', () => {
    expect(isValidSchema('hello', { type: 'string' })).toBe(true);
    expect(isValidSchema(123, { type: 'string' })).toBe(false);
    expect(isValidSchema(123, { type: 'integer' })).toBe(true);
    expect(isValidSchema(12.34, { type: 'integer' })).toBe(false);
    expect(isValidSchema(null, { type: ['string', 'null'] })).toBe(true);
  });

  it('validates object properties and required fields', () => {
    const schema = {
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
      },
    };

    expect(isValidSchema({ id: 1, email: 'test@example.com' }, schema)).toBe(true);

    const result = validateSchema({ id: 1 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe('required');
    expect(result.errors[0]?.path).toBe('/email');
  });

  it('enforces additionalProperties: false', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'integer' } },
      additionalProperties: false,
    };

    expect(isValidSchema({ id: 1 }, schema)).toBe(true);

    const result = validateSchema({ id: 1, extra: 'forbidden' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe('additionalProperties');
    expect(result.errors[0]?.path).toBe('/extra');
  });

  it('validates array items and uniqueItems constraint', () => {
    const schema = {
      type: 'array',
      items: { type: 'integer' },
      minItems: 2,
      uniqueItems: true,
    };

    expect(isValidSchema([1, 2, 3], schema)).toBe(true);
    expect(isValidSchema([1], schema)).toBe(false); // minItems
    expect(isValidSchema([1, 1], schema)).toBe(false); // uniqueItems
  });

  it('validates string patterns, minLength, maxLength', () => {
    const schema = {
      type: 'string',
      minLength: 3,
      maxLength: 5,
      pattern: '^[a-z]+$',
    };

    expect(isValidSchema('abc', schema)).toBe(true);
    expect(isValidSchema('a', schema)).toBe(false); // minLength
    expect(isValidSchema('abcdef', schema)).toBe(false); // maxLength
    expect(isValidSchema('123', schema)).toBe(false); // pattern
  });

  it('validates number ranges and enum choices', () => {
    const schema = {
      type: 'number',
      minimum: 10,
      maximum: 50,
    };
    expect(isValidSchema(25, schema)).toBe(true);
    expect(isValidSchema(5, schema)).toBe(false);
    expect(isValidSchema(99, schema)).toBe(false);

    const enumSchema = { enum: ['red', 'green', 'blue'] };
    expect(isValidSchema('green', enumSchema)).toBe(true);
    expect(isValidSchema('yellow', enumSchema)).toBe(false);
  });

  it('handles JSON strings and asserts validity with assertValidSchema', () => {
    const docStr = JSON.stringify({ count: 10 });
    const schemaStr = JSON.stringify({ type: 'object', properties: { count: { type: 'integer' } } });

    expect(isValidSchema(docStr, schemaStr)).toBe(true);
    expect(() => assertValidSchema(docStr, schemaStr)).not.toThrow();

    const invalidDoc = JSON.stringify({ count: 'not a number' });
    expect(() => assertValidSchema(invalidDoc, schemaStr)).toThrow(/JSON Schema validation failed/);
  });
});
