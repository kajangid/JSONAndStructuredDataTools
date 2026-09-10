export interface FlattenOptions {
  /**
   * Delimiter used to separate path segments. Default: '.'
   */
  delimiter?: string;
  /**
   * Whether to flatten array elements using numeric indices. Default: true
   */
  flattenArrays?: boolean;
  /**
   * Maximum depth to flatten. Objects at this depth will remain unflattened. Default: Infinity
   */
  maxDepth?: number;
}

/**
 * Flattens a nested object or array into a single-level object with delimiter-separated keys.
 */
export function flattenJson(
  input: unknown,
  options?: FlattenOptions
): Record<string, unknown> {
  const delimiter = options?.delimiter ?? '.';
  const flattenArrays = options?.flattenArrays ?? true;
  const maxDepth = options?.maxDepth ?? Infinity;

  const data = typeof input === 'string' ? safeJsonParse(input) : input;
  const result: Record<string, unknown> = {};

  if (data === null || typeof data !== 'object') {
    return { '': data };
  }

  function step(current: unknown, currentKey: string, depth: number): void {
    if (depth >= maxDepth) {
      result[currentKey] = current;
      return;
    }

    if (Array.isArray(current)) {
      if (!flattenArrays || current.length === 0) {
        result[currentKey] = current;
        return;
      }
      for (let i = 0; i < current.length; i++) {
        const nextKey = currentKey ? `${currentKey}${delimiter}${i}` : String(i);
        step(current[i], nextKey, depth + 1);
      }
      return;
    }

    if (isPlainObject(current)) {
      const keys = Object.keys(current);
      if (keys.length === 0) {
        result[currentKey] = current;
        return;
      }
      for (const key of keys) {
        const nextKey = currentKey ? `${currentKey}${delimiter}${key}` : key;
        step(current[key], nextKey, depth + 1);
      }
      return;
    }

    result[currentKey] = current;
  }

  step(data, '', 0);

  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date);
}

function safeJsonParse(val: string): unknown {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}
