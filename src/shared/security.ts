const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Checks if a property key could cause prototype pollution or unsafe object mutations.
 */
export function isUnsafePropertyKey(key: string | number | symbol): boolean {
  if (typeof key === 'symbol') return false;
  return DANGEROUS_KEYS.has(String(key));
}

/**
 * Safe Object.prototype.hasOwnProperty wrapper
 */
export function hasOwn(target: unknown, key: string | number | symbol): boolean {
  if (target === null || target === undefined || typeof target !== 'object') {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(target, key);
}

/**
 * Creates a clean object without prototype if requested, or safe plain object
 */
export function createSafeRecord<T = unknown>(): Record<string, T> {
  return Object.create(null);
}
