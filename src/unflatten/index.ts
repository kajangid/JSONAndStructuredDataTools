import { isUnsafePropertyKey } from '../shared/security';

export interface UnflattenOptions {
  /**
   * Delimiter used to split path segments. Default: '.'
   */
  delimiter?: string;
  /**
   * Whether to overwrite existing primitives when descending into a path. Default: true
   */
  overwrite?: boolean;
}

/**
 * Checks if a string segment is a valid non-negative integer representing an array index.
 */
function isIndexKey(key: string): boolean {
  return /^(0|[1-9]\d*)$/.test(key);
}

/**
 * Reconstructs nested objects and arrays from a flat object with delimiter-separated keys.
 * Includes built-in prototype pollution prevention.
 */
export function unflattenJson(
  input: Record<string, unknown> | string,
  options?: UnflattenOptions
): unknown {
  const delimiter = options?.delimiter ?? '.';
  const overwrite = options?.overwrite !== false;

  const flatObj = typeof input === 'string' ? (JSON.parse(input) as Record<string, unknown>) : input;

  if (flatObj === null || typeof flatObj !== 'object') {
    return flatObj;
  }

  const keys = Object.keys(flatObj);

  // If object has a single empty key, that was the root primitive
  if (keys.length === 1 && keys[0] === '') {
    return flatObj[''];
  }

  // Determine if root should be an array or an object
  const isRootArray =
    keys.length > 0 &&
    keys.every((k) => {
      const firstPart = k.split(delimiter)[0]!;
      return isIndexKey(firstPart);
    });

  const root: any = isRootArray ? [] : {};

  for (const flatKey of keys) {
    const value = flatObj[flatKey];

    // If key is empty string, assign to root if possible
    if (flatKey === '') {
      continue;
    }

    const parts = flatKey.split(delimiter);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;

      // Security: Block prototype pollution
      if (isUnsafePropertyKey(part)) {
        break; // Ignore and do not process this dangerous key
      }

      const isLast = i === parts.length - 1;

      if (isLast) {
        if (Array.isArray(current) && isIndexKey(part)) {
          current[parseInt(part, 10)] = value;
        } else {
          current[part] = value;
        }
      } else {
        const nextPart = parts[i + 1]!;
        const nextIsIndex = isIndexKey(nextPart);

        const currentVal = Array.isArray(current) && isIndexKey(part)
          ? current[parseInt(part, 10)]
          : current[part];

        if (
          currentVal === null ||
          currentVal === undefined ||
          (overwrite && typeof currentVal !== 'object')
        ) {
          const nextContainer = nextIsIndex ? [] : {};
          if (Array.isArray(current) && isIndexKey(part)) {
            current[parseInt(part, 10)] = nextContainer;
          } else {
            current[part] = nextContainer;
          }
          current = nextContainer;
        } else {
          current = currentVal;
        }
      }
    }
  }

  return root;
}
