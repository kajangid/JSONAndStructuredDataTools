/**
 * JSON primitive types
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Valid JSON value (recursive)
 */
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * General object dictionary
 */
export type JsonObject = { [key: string]: unknown };

/**
 * General JSON array
 */
export type JsonArray = unknown[];
