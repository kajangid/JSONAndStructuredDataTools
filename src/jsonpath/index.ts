import { isUnsafePropertyKey, hasOwn } from '../shared/security';

export type JsonPathStep =
  | { type: 'property'; name: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | { type: 'slice'; start?: number; end?: number }
  | { type: 'union'; keys: (string | number)[] }
  | { type: 'descendant'; name: string };

function parseBracketContent(content: string): JsonPathStep {
  const trimmed = content.trim();

  // Wildcard [*]
  if (trimmed === '*') {
    return { type: 'wildcard' };
  }

  // Slice [start:end]
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const startStr = parts[0]?.trim();
    const endStr = parts[1]?.trim();
    const start = startStr !== '' && startStr !== undefined ? parseInt(startStr, 10) : undefined;
    const end = endStr !== '' && endStr !== undefined ? parseInt(endStr, 10) : undefined;
    return { type: 'slice', start, end };
  }

  // Union [a, b, c]
  if (trimmed.includes(',')) {
    const rawItems = trimmed.split(',');
    const keys: (string | number)[] = [];
    for (const item of rawItems) {
      const clean = item.trim().replace(/^['"]|['"]$/g, '');
      if (/^-?\d+$/.test(clean)) {
        keys.push(parseInt(clean, 10));
      } else if (clean) {
        keys.push(clean);
      }
    }
    return { type: 'union', keys };
  }

  // Single integer index [0], [-1]
  if (/^-?\d+$/.test(trimmed)) {
    return { type: 'index', index: parseInt(trimmed, 10) };
  }

  // Quoted or bare property ['prop'], ["prop"], [prop]
  const cleanKey = trimmed.replace(/^['"]|['"]$/g, '');
  return { type: 'property', name: cleanKey };
}

/**
 * Parses a JSONPath expression string into a structured list of evaluation steps.
 */
export function parseJsonPath(expr: string): JsonPathStep[] {
  let path = expr.trim();
  if (path.startsWith('$')) {
    path = path.slice(1);
  }
  if (!path) {
    return [];
  }

  const steps: JsonPathStep[] = [];
  let i = 0;

  while (i < path.length) {
    // Check for recursive descent (..)
    if (path.slice(i, i + 2) === '..') {
      i += 2;
      if (i >= path.length) break;

      if (path[i] === '*') {
        steps.push({ type: 'descendant', name: '*' });
        i++;
      } else if (path[i] === '[') {
        const endBracket = path.indexOf(']', i);
        if (endBracket === -1) {
          throw new Error(`Unclosed bracket in JSONPath expression: "${expr}"`);
        }
        const inner = path.slice(i + 1, endBracket).trim().replace(/^['"]|['"]$/g, '');
        steps.push({ type: 'descendant', name: inner });
        i = endBracket + 1;
      } else {
        let name = '';
        while (i < path.length && path[i] !== '.' && path[i] !== '[') {
          name += path[i++];
        }
        if (name) {
          steps.push({ type: 'descendant', name });
        }
      }
      continue;
    }

    // Single dot (.)
    if (path[i] === '.') {
      i++;
      if (i >= path.length) break;
      if (path[i] === '*') {
        steps.push({ type: 'wildcard' });
        i++;
        continue;
      }
      let prop = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') {
        prop += path[i++];
      }
      if (prop) {
        steps.push({ type: 'property', name: prop });
      }
      continue;
    }

    // Bracket notation ([...])
    if (path[i] === '[') {
      let end = i + 1;
      let quote: string | null = null;
      while (end < path.length) {
        const ch = path[end]!;
        if (quote) {
          if (ch === quote) quote = null;
          else if (ch === '\\') end++;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === ']') {
          break;
        }
        end++;
      }
      if (end >= path.length) {
        throw new Error(`Unclosed bracket in JSONPath expression: "${expr}"`);
      }
      const bracketContent = path.slice(i + 1, end);
      steps.push(parseBracketContent(bracketContent));
      i = end + 1;
      continue;
    }

    // Identifier without leading dot (e.g. root property)
    let ident = '';
    while (i < path.length && path[i] !== '.' && path[i] !== '[') {
      ident += path[i++];
    }
    if (ident) {
      steps.push({ type: 'property', name: ident });
    }
  }

  return steps;
}

function evaluateSteps(root: unknown, steps: JsonPathStep[]): unknown[] {
  let currentNodes: unknown[] = [root];

  for (const step of steps) {
    const nextNodes: unknown[] = [];

    for (const node of currentNodes) {
      if (node === null || typeof node !== 'object') {
        continue;
      }

      switch (step.type) {
        case 'property': {
          if (isUnsafePropertyKey(step.name)) continue;
          if (Array.isArray(node)) {
            const idx = parseInt(step.name, 10);
            if (!isNaN(idx) && idx >= 0 && idx < node.length) {
              nextNodes.push(node[idx]);
            }
          } else if (hasOwn(node as Record<string, unknown>, step.name)) {
            nextNodes.push((node as Record<string, unknown>)[step.name]);
          }
          break;
        }

        case 'index': {
          if (Array.isArray(node)) {
            const idx = step.index < 0 ? node.length + step.index : step.index;
            if (idx >= 0 && idx < node.length) {
              nextNodes.push(node[idx]);
            }
          }
          break;
        }

        case 'wildcard': {
          if (Array.isArray(node)) {
            nextNodes.push(...node);
          } else {
            for (const k of Object.keys(node)) {
              if (!isUnsafePropertyKey(k)) {
                nextNodes.push((node as Record<string, unknown>)[k]);
              }
            }
          }
          break;
        }

        case 'slice': {
          if (Array.isArray(node)) {
            const start = step.start ?? 0;
            const end = step.end ?? node.length;
            nextNodes.push(...node.slice(start, end));
          }
          break;
        }

        case 'union': {
          for (const k of step.keys) {
            if (typeof k === 'number' && Array.isArray(node)) {
              const idx = k < 0 ? node.length + k : k;
              if (idx >= 0 && idx < node.length) {
                nextNodes.push(node[idx]);
              }
            } else if (typeof k === 'string' && !Array.isArray(node)) {
              if (!isUnsafePropertyKey(k) && hasOwn(node as Record<string, unknown>, k)) {
                nextNodes.push((node as Record<string, unknown>)[k]);
              }
            }
          }
          break;
        }

        case 'descendant': {
          const targetName = step.name;
          function collect(current: unknown): void {
            if (current === null || typeof current !== 'object') return;
            if (Array.isArray(current)) {
              for (const item of current) {
                if (targetName === '*') {
                  nextNodes.push(item);
                }
                collect(item);
              }
            } else {
              const obj = current as Record<string, unknown>;
              for (const k of Object.keys(obj)) {
                if (isUnsafePropertyKey(k)) continue;
                const val = obj[k];
                if (targetName === '*' || k === targetName) {
                  nextNodes.push(val);
                }
                collect(val);
              }
            }
          }
          collect(node);
          break;
        }
      }
    }

    currentNodes = nextNodes;
  }

  return currentNodes;
}

/**
 * Compiles a JSONPath query string into an executable query function.
 */
export function compileJsonPath<T = unknown>(expr: string): (doc: unknown) => T[] {
  const steps = parseJsonPath(expr);
  return (docInput: unknown) => {
    let doc = docInput;
    if (typeof docInput === 'string') {
      try {
        doc = JSON.parse(docInput);
      } catch {
        return [];
      }
    }
    if (steps.length === 0) {
      return (doc !== undefined ? [doc] : []) as T[];
    }
    return evaluateSteps(doc, steps) as T[];
  };
}

/**
 * Queries a document using a JSONPath expression and returns an array of matching values.
 */
export function queryJsonPath<T = unknown>(doc: unknown, expr: string): T[] {
  return compileJsonPath<T>(expr)(doc);
}

/**
 * Tests whether a JSONPath expression matches any values in a document.
 */
export function testJsonPath(doc: unknown, expr: string): boolean {
  return queryJsonPath(doc, expr).length > 0;
}
