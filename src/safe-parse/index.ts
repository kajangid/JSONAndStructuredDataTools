import { locateJsonSyntaxError, ErrorPosition } from '../shared/parser';

export { locateJsonSyntaxError, locateJsonSyntaxError as extractErrorPosition };
export type { ErrorPosition };

export interface SafeParseSuccess<T> {
  success: true;
  data: T;
  error?: never;
  position?: never;
}

export interface SafeParseFailure<T = unknown> {
  success: false;
  data?: T;
  error: Error;
  position?: ErrorPosition;
}

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure<T>;

export interface SafeParseOptions<T = unknown> {
  /**
   * Transformation function applied to parsed key/value pairs
   */
  reviver?: (this: any, key: string, value: any) => any;
  /**
   * Fallback value returned in data when parsing fails
   */
  fallback?: T;
}

/**
 * Safely parse a JSON string without throwing an exception.
 * Returns a discriminated union with `{ success: true, data }` or `{ success: false, error, position }`.
 */
export function safeParse<T = unknown>(
  input: unknown,
  options?: SafeParseOptions<T>
): SafeParseResult<T> {
  if (typeof input !== 'string') {
    const err = new TypeError(
      `Expected input to be a string, received ${input === null ? 'null' : typeof input}`
    );
    if (options && 'fallback' in options) {
      return {
        success: false,
        data: options.fallback,
        error: err,
      };
    }
    return {
      success: false,
      error: err,
    };
  }

  try {
    const data = JSON.parse(input, options?.reviver) as T;
    return {
      success: true,
      data,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const position = locateJsonSyntaxError(input, error);

    if (options && 'fallback' in options) {
      return {
        success: false,
        data: options.fallback,
        error,
        position,
      };
    }

    return {
      success: false,
      error,
      position,
    };
  }
}

/**
 * Safely parse a JSON string, returning a default fallback value if parsing fails.
 */
export function safeParseOrDefault<T>(
  input: unknown,
  defaultValue: T,
  options?: Omit<SafeParseOptions<T>, 'fallback'>
): T {
  const result = safeParse<T>(input, { ...options, fallback: defaultValue });
  return result.success ? result.data : defaultValue;
}
