import { isUnsafePropertyKey } from '../shared/security';

export interface MergeJsonOptions {
  /**
   * Strategy for combining array values:
   * - 'replace': source array overwrites target array (default)
   * - 'concat': appends source items to target array
   * - 'union': appends only unique primitive items
   */
  arrayMode?: 'replace' | 'concat' | 'union';
  /**
   * Whether to merge recursively into nested objects. Default: true
   */
  deep?: boolean;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date);
}

function cloneValue<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map(cloneValue) as unknown as T;
  }
  if (isPlainObject(val)) {
    const res: Record<string, unknown> = {};
    for (const k of Object.keys(val)) {
      if (!isUnsafePropertyKey(k)) {
        res[k] = cloneValue(val[k]);
      }
    }
    return res as unknown as T;
  }
  return val;
}

function mergePair(target: unknown, source: unknown, options: MergeJsonOptions): unknown {
  if (source === undefined) {
    return cloneValue(target);
  }

  // Array handling
  if (Array.isArray(target) && Array.isArray(source)) {
    const mode = options.arrayMode ?? 'replace';
    if (mode === 'concat') {
      return [...target.map(cloneValue), ...source.map(cloneValue)];
    }
    if (mode === 'union') {
      const combined = [...target, ...source];
      const seen = new Set<unknown>();
      const result: unknown[] = [];
      for (const item of combined) {
        const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : item;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(cloneValue(item));
        }
      }
      return result;
    }
    // mode === 'replace'
    return source.map(cloneValue);
  }

  // Object handling
  if (isPlainObject(target) && isPlainObject(source)) {
    const result: Record<string, unknown> = {};

    // Copy target properties
    for (const key of Object.keys(target)) {
      if (!isUnsafePropertyKey(key)) {
        result[key] = cloneValue(target[key]);
      }
    }

    // Merge source properties
    for (const key of Object.keys(source)) {
      if (isUnsafePropertyKey(key)) {
        continue;
      }
      const sourceVal = source[key];
      if (options.deep !== false && isPlainObject(result[key]) && isPlainObject(sourceVal)) {
        result[key] = mergePair(result[key], sourceVal, options);
      } else if (options.deep !== false && Array.isArray(result[key]) && Array.isArray(sourceVal)) {
        result[key] = mergePair(result[key], sourceVal, options);
      } else {
        result[key] = cloneValue(sourceVal);
      }
    }

    return result;
  }

  return cloneValue(source);
}

/**
 * Deep-merges multiple JSON-compatible objects with prototype pollution protection.
 */
export function mergeJson<T = unknown>(target: unknown, ...sources: unknown[]): T {
  return mergeJsonWithOptions<T>({}, target, ...sources);
}

/**
 * Deep-merges multiple JSON-compatible objects with custom array conflict resolution.
 */
export function mergeJsonWithOptions<T = unknown>(
  options: MergeJsonOptions,
  target: unknown,
  ...sources: unknown[]
): T {
  let result = cloneValue(target);
  for (const source of sources) {
    result = mergePair(result, source, options);
  }
  return result as T;
}
