import { describe, it, expect } from 'vitest';
import { getPath, setPath, hasPath, deletePath, parsePath } from './index';

describe('json-path', () => {
  const data = {
    user: {
      profile: {
        name: 'Alice',
        addresses: [
          { city: 'Wonderland', isPrimary: true },
          { city: 'LookingGlass', isPrimary: false },
        ],
      },
      settings: null,
      flags: {
        active: false,
        count: 0,
      },
    },
  };

  describe('parsePath', () => {
    it('parses standard dot paths and bracket paths correctly', () => {
      expect(parsePath('user.profile.name')).toEqual(['user', 'profile', 'name']);
      expect(parsePath('user.addresses[0].city')).toEqual(['user', 'addresses', 0, 'city']);
      expect(parsePath('items[1][2]')).toEqual(['items', 1, 2]);
      expect(parsePath("config['server.host']")).toEqual(['config', 'server.host']);
    });
  });

  describe('getPath', () => {
    it('retrieves nested values safely', () => {
      expect(getPath(data, 'user.profile.name')).toBe('Alice');
      expect(getPath(data, 'user.profile.addresses[0].city')).toBe('Wonderland');
      expect(getPath(data, ['user', 'profile', 'addresses', 1, 'isPrimary'])).toBe(false);
    });

    it('returns default value when path does not exist', () => {
      expect(getPath(data, 'user.profile.age', 25)).toBe(25);
      expect(getPath(data, 'user.settings.theme', 'dark')).toBe('dark');
      expect(getPath(null, 'any.path', 'fallback')).toBe('fallback');
      expect(getPath(undefined, 'any.path', 'fallback')).toBe('fallback');
    });

    it('returns falsy values without falling back to default', () => {
      expect(getPath(data, 'user.flags.active', true)).toBe(false);
      expect(getPath(data, 'user.flags.count', 100)).toBe(0);
    });

    it('guards against prototype pollution queries', () => {
      expect(getPath(data, '__proto__.polluted', 'safe')).toBe('safe');
      expect(getPath(data, 'constructor.prototype', 'safe')).toBe('safe');
    });
  });

  describe('hasPath', () => {
    it('checks existence for present and absent keys', () => {
      expect(hasPath(data, 'user.profile.name')).toBe(true);
      expect(hasPath(data, 'user.profile.addresses[0]')).toBe(true);
      expect(hasPath(data, 'user.flags.active')).toBe(true);
      expect(hasPath(data, 'user.profile.age')).toBe(false);
      expect(hasPath(data, 'user.profile.addresses[5]')).toBe(false);
      expect(hasPath(null, 'foo')).toBe(false);
    });
  });

  describe('setPath', () => {
    it('sets nested properties mutably by default', () => {
      const target: any = { a: { b: 1 } };
      setPath(target, 'a.c', 2);
      expect(target.a.c).toBe(2);

      setPath(target, 'x.y.z', 'created');
      expect(target.x.y.z).toBe('created');
    });

    it('creates arrays for numeric segments', () => {
      const target: any = {};
      setPath(target, 'items[0].name', 'First');
      expect(Array.isArray(target.items)).toBe(true);
      expect(target.items[0]).toEqual({ name: 'First' });
    });

    it('sets properties immutably when option is set', () => {
      const original = { a: { b: 1, c: 2 } };
      const updated = setPath(original, 'a.b', 99, { immutable: true });

      expect(updated.a.b).toBe(99);
      expect(original.a.b).toBe(1); // Not mutated
      expect(updated).not.toBe(original);
    });

    it('guards against prototype pollution attacks on setPath', () => {
      const target: any = {};
      setPath(target, '__proto__.hacked', 'yes');
      setPath(target, 'constructor.prototype.hacked', 'yes');

      expect((Object.prototype as any).hacked).toBeUndefined();
      expect(({} as any).hacked).toBeUndefined();
    });
  });

  describe('deletePath', () => {
    it('deletes object properties', () => {
      const target: any = { a: { b: 1, c: 2 } };
      deletePath(target, 'a.b');
      expect(target.a.b).toBeUndefined();
      expect(target.a.c).toBe(2);
    });

    it('removes array elements by index', () => {
      const target = { items: ['a', 'b', 'c'] };
      deletePath(target, 'items[1]');
      expect(target.items).toEqual(['a', 'c']);
    });

    it('deletes immutably when immutable: true', () => {
      const original = { a: { b: 1, c: 2 } };
      const updated = deletePath(original, 'a.b', { immutable: true });

      expect(original.a.b).toBe(1);
      expect(updated.a.b).toBeUndefined();
      expect(updated.a.c).toBe(2);
    });
  });
});
