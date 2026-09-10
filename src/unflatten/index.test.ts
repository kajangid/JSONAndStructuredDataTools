import { describe, it, expect } from 'vitest';
import { unflattenJson } from './index';

describe('json-unflatten', () => {
  it('reconstructs nested object from dot notation', () => {
    const flat = {
      'user.name': 'Alice',
      'user.address.city': 'Wonderland',
      'user.address.zip': 12345,
    };

    const nested = unflattenJson(flat);
    expect(nested).toEqual({
      user: {
        name: 'Alice',
        address: {
          city: 'Wonderland',
          zip: 12345,
        },
      },
    });
  });

  it('reconstructs arrays with numeric indices', () => {
    const flat = {
      'items.0': 'first',
      'items.1': 'second',
      'tags.0.id': 1,
      'tags.0.label': 'news',
    };

    const nested = unflattenJson(flat);
    expect(nested).toEqual({
      items: ['first', 'second'],
      tags: [{ id: 1, label: 'news' }],
    });
  });

  it('reconstructs top-level arrays', () => {
    const flat = {
      '0': 'apple',
      '1': 'banana',
      '2': 'cherry',
    };

    const nested = unflattenJson(flat);
    expect(nested).toEqual(['apple', 'banana', 'cherry']);
  });

  it('supports custom delimiter', () => {
    const flat = {
      'server/host': 'localhost',
      'server/port': 8080,
    };

    const nested = unflattenJson(flat, { delimiter: '/' });
    expect(nested).toEqual({
      server: {
        host: 'localhost',
        port: 8080,
      },
    });
  });

  it('prevents prototype pollution attacks', () => {
    const malicious = {
      '__proto__.polluted': 'yes',
      'constructor.prototype.polluted': 'yes',
      'user.name': 'Bob',
    };

    unflattenJson(malicious);

    // Verify global Object.prototype was NOT polluted
    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(({} as any).polluted).toBeUndefined();
  });

  it('reconstructs round-trip correctly with unflatten(flatten(obj))', () => {
    const original = {
      user: {
        profile: {
          name: 'Charlie',
          scores: [100, 95, 98],
        },
      },
      active: true,
    };

    // Simulate flat
    const flat = {
      'user.profile.name': 'Charlie',
      'user.profile.scores.0': 100,
      'user.profile.scores.1': 95,
      'user.profile.scores.2': 98,
      active: true,
    };

    expect(unflattenJson(flat)).toEqual(original);
  });
});
