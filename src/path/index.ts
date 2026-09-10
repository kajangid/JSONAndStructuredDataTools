import { isUnsafePropertyKey, hasOwn } from '../shared/security';

export type PathSegment = string | number;
export type PathInput = string | PathSegment[];

export interface PathOptions {
  /**
   * If true, returns a cloned copy of target with updates instead of mutating in place. Default: false
   */
  immutable?: boolean;
}

/**
 * Parses dot and bracket notation paths into an array of path segments.
 *
 * Examples:
 * - "user.profile.name" -> ["user", "profile", "name"]
 * - "items[0].title" -> ["items", 0, "title"]
 * - "data['a.b'][1]" -> ["data", "a.b", 1]
 */
export function parsePath(path: PathInput): PathSegment[] {
  if (Array.isArray(path)) {
    return path;
  }
  if (typeof path !== 'string') {
    return [];
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return [];
  }

  const segments: PathSegment[] = [];
  let buffer = '';
  let inBracket = false;
  let quoteChar: string | null = null;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]!;

    if (quoteChar) {
      if (ch === quoteChar) {
        quoteChar = null;
      } else if (ch === '\\' && i + 1 < trimmed.length) {
        buffer += trimmed[++i];
      } else {
        buffer += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quoteChar = ch;
      continue;
    }

    if (ch === '[') {
      if (buffer) {
        segments.push(/^(0|[1-9]\d*)$/.test(buffer) ? parseInt(buffer, 10) : buffer);
        buffer = '';
      }
      inBracket = true;
    } else if (ch === ']') {
      if (inBracket) {
        if (/^(0|[1-9]\d*)$/.test(buffer)) {
          segments.push(parseInt(buffer, 10));
        } else if (buffer) {
          segments.push(buffer);
        }
        buffer = '';
        inBracket = false;
      }
    } else if (ch === '.') {
      if (!inBracket) {
        if (buffer) {
          segments.push(/^(0|[1-9]\d*)$/.test(buffer) ? parseInt(buffer, 10) : buffer);
          buffer = '';
        }
      } else {
        buffer += ch;
      }
    } else {
      buffer += ch;
    }
  }

  if (buffer) {
    segments.push(/^(0|[1-9]\d*)$/.test(buffer) ? parseInt(buffer, 10) : buffer);
  }

  return segments;
}

/**
 * Safely reads a value at a specified path without throwing.
 * Returns defaultValue if target is null, undefined, or path does not exist.
 */
export function getPath<T = unknown>(
  target: unknown,
  path: PathInput,
  defaultValue?: T
): T | undefined {
  if (target === null || target === undefined) {
    return defaultValue;
  }

  const segments = parsePath(path);
  if (segments.length === 0) {
    return (target as T) ?? defaultValue;
  }

  let current: any = target;

  for (const seg of segments) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    if (isUnsafePropertyKey(seg)) {
      return defaultValue;
    }

    current = current[seg];
  }

  return current !== undefined ? (current as T) : defaultValue;
}

/**
 * Checks whether a path exists in the target object or array.
 */
export function hasPath(target: unknown, path: PathInput): boolean {
  if (target === null || target === undefined) {
    return false;
  }

  const segments = parsePath(path);
  if (segments.length === 0) {
    return true;
  }

  let current: any = target;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;

    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }

    if (isUnsafePropertyKey(seg)) {
      return false;
    }

    if (Array.isArray(current)) {
      if (typeof seg === 'number') {
        if (seg < 0 || seg >= current.length) return false;
      } else if (!hasOwn(current, seg)) {
        return false;
      }
    } else if (!hasOwn(current, seg)) {
      return false;
    }

    current = current[seg];
  }

  return true;
}

/**
 * Sets a value at a specified path in the target object or array.
 * Creates intermediate objects or arrays as needed. Includes prototype pollution defense.
 */
export function setPath<T extends object>(
  target: T,
  path: PathInput,
  value: unknown,
  options?: PathOptions
): T {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return target;
  }

  const isImmutable = options?.immutable === true;
  const root = isImmutable
    ? Array.isArray(target)
      ? ([...target] as any)
      : ({ ...target } as any)
    : target;

  let current: any = root;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;

    if (isUnsafePropertyKey(seg)) {
      return root; // Prevent prototype pollution
    }

    const isLast = i === segments.length - 1;

    if (isLast) {
      current[seg] = value;
    } else {
      const nextSeg = segments[i + 1]!;
      const nextIsIndex = typeof nextSeg === 'number';

      let nextVal = current[seg];
      if (nextVal === null || nextVal === undefined || typeof nextVal !== 'object') {
        nextVal = nextIsIndex ? [] : {};
        current[seg] = nextVal;
      } else if (isImmutable) {
        nextVal = Array.isArray(nextVal) ? [...nextVal] : { ...nextVal };
        current[seg] = nextVal;
      }

      current = nextVal;
    }
  }

  return root;
}

/**
 * Deletes a property at a specified path.
 */
export function deletePath<T extends object>(
  target: T,
  path: PathInput,
  options?: PathOptions
): T {
  const segments = parsePath(path);
  if (segments.length === 0 || target === null || target === undefined) {
    return target;
  }

  const isImmutable = options?.immutable === true;
  const root = isImmutable
    ? Array.isArray(target)
      ? ([...target] as any)
      : ({ ...target } as any)
    : target;

  let current: any = root;
  const ancestors: { parent: any; key: PathSegment }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;

    if (isUnsafePropertyKey(seg) || current === null || current === undefined) {
      return root;
    }

    if (i === segments.length - 1) {
      if (Array.isArray(current) && typeof seg === 'number') {
        current.splice(seg, 1);
      } else {
        delete current[seg];
      }
    } else {
      ancestors.push({ parent: current, key: seg });
      let nextVal = current[seg];
      if (isImmutable && nextVal && typeof nextVal === 'object') {
        nextVal = Array.isArray(nextVal) ? [...nextVal] : { ...nextVal };
        current[seg] = nextVal;
      }
      current = nextVal;
    }
  }

  return root;
}
