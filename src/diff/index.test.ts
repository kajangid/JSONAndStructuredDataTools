import { describe, it, expect } from 'vitest';
import { diffJson, formatDiff } from './index';

describe('json-diff', () => {
  it('detects no changes for identical objects', () => {
    const left = { a: 1, b: 'hello', c: [1, 2] };
    const right = { a: 1, b: 'hello', c: [1, 2] };

    const diff = diffJson(left, right);
    expect(diff.hasChanges).toBe(false);
    expect(diff.all).toHaveLength(0);
    expect(formatDiff(diff)).toBe('No changes detected.');
  });

  it('detects added and removed properties', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1, c: 3 };

    const diff = diffJson(left, right);
    expect(diff.hasChanges).toBe(true);
    expect(diff.removals).toEqual([{ path: 'b', type: 'remove', oldValue: 2 }]);
    expect(diff.additions).toEqual([{ path: 'c', type: 'add', newValue: 3 }]);
    expect(diff.modifications).toHaveLength(0);
  });

  it('detects modified primitive values', () => {
    const left = { count: 10, status: 'pending' };
    const right = { count: 15, status: 'completed' };

    const diff = diffJson(left, right);
    expect(diff.modifications).toEqual([
      { path: 'count', type: 'modify', oldValue: 10, newValue: 15 },
      { path: 'status', type: 'modify', oldValue: 'pending', newValue: 'completed' },
    ]);
  });

  it('diffs deeply nested objects and arrays', () => {
    const left = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      config: { theme: 'light' },
    };
    const right = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Robert' },
        { id: 3, name: 'Charlie' },
      ],
      config: { theme: 'dark', sound: true },
    };

    const diff = diffJson(left, right);
    expect(diff.summary.additions).toBe(2); // users[2] and config.sound
    expect(diff.summary.modifications).toBe(2); // users[1].name and config.theme
    expect(diff.summary.removals).toBe(0);

    const charlieAdd = diff.additions.find((a) => a.path === 'users[2]');
    expect(charlieAdd?.newValue).toEqual({ id: 3, name: 'Charlie' });
  });

  it('diffs raw JSON strings automatically', () => {
    const leftJson = '{"foo": "bar"}';
    const rightJson = '{"foo": "baz"}';

    const diff = diffJson(leftJson, rightJson);
    expect(diff.modifications).toEqual([
      { path: 'foo', type: 'modify', oldValue: 'bar', newValue: 'baz' },
    ]);
  });

  it('formatDiff outputs readable report with colors', () => {
    const left = { oldKey: 1, changed: 'old' };
    const right = { newKey: 2, changed: 'new' };

    const diff = diffJson(left, right);
    const plain = formatDiff(diff);
    expect(plain).toContain('+ newKey: 2');
    expect(plain).toContain('- oldKey: 1');
    expect(plain).toContain('~ changed: "old" => "new"');
    expect(plain).toContain('Summary: +1 added, -1 removed, ~1 modified');

    const colored = formatDiff(diff, { color: true });
    expect(colored).toContain('\x1b[32m+ newKey: 2');
    expect(colored).toContain('\x1b[31m- oldKey: 1');
  });
});
