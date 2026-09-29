import { describe, it, expect } from 'vitest';
import { renderJsonTree } from './index';

describe('json-view', () => {
  it('renders flat objects as box-drawing tree', () => {
    const input = { name: 'Alice', age: 30 };
    const tree = renderJsonTree(input);
    expect(tree).toContain('root');
    expect(tree).toContain('├── name: "Alice"');
    expect(tree).toContain('└── age: 30');
  });

  it('renders nested objects and arrays with indentation', () => {
    const input = {
      users: [{ id: 1, name: 'Bob' }],
      active: true,
    };
    const tree = renderJsonTree(input);
    expect(tree).toContain('users (Array[1])');
    expect(tree).toContain('[0] (Object)');
    expect(tree).toContain('id: 1');
    expect(tree).toContain('name: "Bob"');
    expect(tree).toContain('active: true');
  });

  it('respects maxDepth option with ellipsis truncation', () => {
    const input = {
      level1: {
        level2: {
          level3: 'deep',
        },
      },
    };
    const tree = renderJsonTree(input, { maxDepth: 1 });
    expect(tree).toContain('level1 (Object)');
    expect(tree).toContain('...');
    expect(tree).not.toContain('deep');
  });

  it('customizes rootLabel', () => {
    const tree = renderJsonTree({ count: 5 }, { rootLabel: 'MyConfig' });
    expect(tree.startsWith('MyConfig')).toBe(true);
  });

  it('handles empty objects and arrays', () => {
    expect(renderJsonTree({})).toBe('root (Object(empty))');
    expect(renderJsonTree([])).toBe('root (Array[0])');
  });

  it('handles raw primitive inputs', () => {
    expect(renderJsonTree('hello')).toBe('root: "hello"');
    expect(renderJsonTree(123)).toBe('root: 123');
    expect(renderJsonTree(null)).toBe('root: null');
  });
});
