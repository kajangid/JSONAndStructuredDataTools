import { describe, it, expect } from 'vitest';
import { isUnsafePropertyKey, hasOwn, createSafeRecord } from './security';

describe('shared/security', () => {
  describe('isUnsafePropertyKey', () => {
    it('identifies prototype pollution attack keys as unsafe', () => {
      expect(isUnsafePropertyKey('__proto__')).toBe(true);
      expect(isUnsafePropertyKey('prototype')).toBe(true);
      expect(isUnsafePropertyKey('constructor')).toBe(true);
    });

    it('identifies normal property keys as safe', () => {
      expect(isUnsafePropertyKey('name')).toBe(false);
      expect(isUnsafePropertyKey('id')).toBe(false);
      expect(isUnsafePropertyKey('user_id')).toBe(false);
      expect(isUnsafePropertyKey('0')).toBe(false);
      expect(isUnsafePropertyKey(123)).toBe(false);
      expect(isUnsafePropertyKey(Symbol('safe'))).toBe(false);
    });
  });

  describe('hasOwn', () => {
    it('returns true for own properties', () => {
      const obj = { a: 1, b: undefined };
      expect(hasOwn(obj, 'a')).toBe(true);
      expect(hasOwn(obj, 'b')).toBe(true);
    });

    it('returns false for inherited prototype properties', () => {
      const proto = { inherited: true };
      const child = Object.create(proto);
      child.own = 123;

      expect(hasOwn(child, 'own')).toBe(true);
      expect(hasOwn(child, 'inherited')).toBe(false);
      expect(hasOwn(child, 'toString')).toBe(false);
    });

    it('handles null and non-object values safely without throwing', () => {
      expect(hasOwn(null, 'a')).toBe(false);
      expect(hasOwn(undefined, 'a')).toBe(false);
      expect(hasOwn(123, 'a')).toBe(false);
      expect(hasOwn('string', 'a')).toBe(false);
    });
  });

  describe('createSafeRecord', () => {
    it('creates an object with no prototype', () => {
      const safe = createSafeRecord<string>();
      expect(Object.getPrototypeOf(safe)).toBeNull();
      expect(safe.toString).toBeUndefined();
      expect(safe.valueOf).toBeUndefined();
      expect(safe.constructor).toBeUndefined();

      safe['key'] = 'value';
      expect(safe['key']).toBe('value');
    });
  });
});
