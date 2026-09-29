import { isUnsafePropertyKey } from '../shared/security';

export interface SortKeysOptions {
  /**
   * Sort keys recursively in nested objects. Default: true
   */
  deep?: boolean;
  /**
   * Custom key comparison function. Default: alphabetical (localeCompare)
   */
  compareFn?: (a: string, b: string) => number;
}

export interface SortKeysJsonOptions extends SortKeysOptions {
  /**
   * Indentation spaces or string. Default: 2
   */
  indent?: number | string;
}

/**
 * Recursively sorts the keys of an object for deterministic ordering.
 */
export function sortKeys<T>(value: T, options?: SortKeysOptions): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const deep = options?.deep !== false;
  const compareFn = options?.compareFn ?? ((a: string, b: string) => a.localeCompare(b));

  if (Array.isArray(value)) {
    return (deep ? value.map((item) => sortKeys(item, options)) : [...value]) as unknown as T;
  }

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(value as object).sort(compareFn);

  for (const k of keys) {
    if (isUnsafePropertyKey(k)) {
      continue;
    }
    const val = (value as Record<string, unknown>)[k];
    sortedObj[k] = deep ? sortKeys(val, options) : val;
  }

  return sortedObj as T;
}

/**
 * Sorts object keys and returns formatted JSON string.
 */
export function sortKeysJson(input: unknown, options?: SortKeysJsonOptions): string {
  let data = input;
  if (typeof input === 'string') {
    data = JSON.parse(input);
  }

  const indent = options?.indent !== undefined ? options.indent : 2;
  const sorted = sortKeys(data, options);
  return JSON.stringify(sorted, null, indent);
}
