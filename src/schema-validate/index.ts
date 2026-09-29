import { isUnsafePropertyKey, hasOwn } from '../shared/security';
import type { JsonSchema } from '../schema-generate/index';

export interface SchemaValidationError {
  path: string;
  message: string;
  keyword: string;
  expected?: unknown;
  actual?: unknown;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!hasOwn(b as Record<string, unknown>, k)) return false;
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

function checkType(val: unknown, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof val === 'string';
    case 'number':
      return typeof val === 'number' && !Number.isNaN(val);
    case 'integer':
      return typeof val === 'number' && Number.isInteger(val);
    case 'boolean':
      return typeof val === 'boolean';
    case 'null':
      return val === null;
    case 'array':
      return Array.isArray(val);
    case 'object':
      return typeof val === 'object' && val !== null && !Array.isArray(val);
    default:
      return true;
  }
}

function validateNode(
  val: unknown,
  schema: JsonSchema,
  currentPath: string,
  errors: SchemaValidationError[]
): void {
  // 1. type
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matchesAny = types.some((t) => checkType(val, t));
    if (!matchesAny) {
      errors.push({
        path: currentPath,
        keyword: 'type',
        message: `Expected type ${JSON.stringify(schema.type)}, but received ${typeof val === 'object' ? (val === null ? 'null' : Array.isArray(val) ? 'array' : 'object') : typeof val}.`,
        expected: schema.type,
        actual: val,
      });
      // Skip further property/item checks if root type mismatches
      return;
    }
  }

  // 2. enum
  if (Array.isArray(schema.enum)) {
    const inEnum = schema.enum.some((allowed) => deepEqual(val, allowed));
    if (!inEnum) {
      errors.push({
        path: currentPath,
        keyword: 'enum',
        message: `Value does not match any allowed enum values.`,
        expected: schema.enum,
        actual: val,
      });
    }
  }

  // 3. String constraints
  if (typeof val === 'string') {
    if (schema.minLength !== undefined && val.length < schema.minLength) {
      errors.push({
        path: currentPath,
        keyword: 'minLength',
        message: `String length (${val.length}) is shorter than minimum length of ${schema.minLength}.`,
        expected: schema.minLength,
        actual: val.length,
      });
    }
    if (schema.maxLength !== undefined && val.length > schema.maxLength) {
      errors.push({
        path: currentPath,
        keyword: 'maxLength',
        message: `String length (${val.length}) exceeds maximum length of ${schema.maxLength}.`,
        expected: schema.maxLength,
        actual: val.length,
      });
    }
    if (schema.pattern !== undefined) {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(val)) {
          errors.push({
            path: currentPath,
            keyword: 'pattern',
            message: `String does not match required regex pattern: ${schema.pattern}.`,
            expected: schema.pattern,
            actual: val,
          });
        }
      } catch {
        // Invalid regex pattern in schema
      }
    }
  }

  // 4. Number constraints
  if (typeof val === 'number') {
    if (schema.minimum !== undefined && val < schema.minimum) {
      errors.push({
        path: currentPath,
        keyword: 'minimum',
        message: `Number ${val} is less than required minimum of ${schema.minimum}.`,
        expected: schema.minimum,
        actual: val,
      });
    }
    if (schema.maximum !== undefined && val > schema.maximum) {
      errors.push({
        path: currentPath,
        keyword: 'maximum',
        message: `Number ${val} is greater than required maximum of ${schema.maximum}.`,
        expected: schema.maximum,
        actual: val,
      });
    }
  }

  // 5. Array constraints
  if (Array.isArray(val)) {
    if (schema.minItems !== undefined && val.length < schema.minItems) {
      errors.push({
        path: currentPath,
        keyword: 'minItems',
        message: `Array contains ${val.length} items, but minimum required is ${schema.minItems}.`,
        expected: schema.minItems,
        actual: val.length,
      });
    }
    if (schema.maxItems !== undefined && val.length > schema.maxItems) {
      errors.push({
        path: currentPath,
        keyword: 'maxItems',
        message: `Array contains ${val.length} items, which exceeds maximum allowed of ${schema.maxItems}.`,
        expected: schema.maxItems,
        actual: val.length,
      });
    }
    if (schema.uniqueItems === true) {
      for (let i = 0; i < val.length; i++) {
        for (let j = i + 1; j < val.length; j++) {
          if (deepEqual(val[i], val[j])) {
            errors.push({
              path: currentPath,
              keyword: 'uniqueItems',
              message: `Array contains duplicate items at indices ${i} and ${j}.`,
            });
            break;
          }
        }
      }
    }

    if (schema.items) {
      if (Array.isArray(schema.items)) {
        for (let i = 0; i < schema.items.length; i++) {
          if (i < val.length) {
            validateNode(val[i], schema.items[i]!, `${currentPath}/${i}`, errors);
          }
        }
      } else if (typeof schema.items === 'object') {
        for (let i = 0; i < val.length; i++) {
          validateNode(val[i], schema.items, `${currentPath}/${i}`, errors);
        }
      }
    }
  }

  // 6. Object constraints
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;

    // required
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (!hasOwn(obj, reqKey) || obj[reqKey] === undefined) {
          errors.push({
            path: `${currentPath}/${reqKey}`,
            keyword: 'required',
            message: `Required property "${reqKey}" is missing.`,
            expected: reqKey,
          });
        }
      }
    }

    // properties
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        if (isUnsafePropertyKey(key)) continue;
        if (hasOwn(obj, key) && obj[key] !== undefined) {
          validateNode(obj[key], schema.properties[key]!, `${currentPath}/${key}`, errors);
        }
      }
    }

    // additionalProperties
    if (schema.additionalProperties !== undefined) {
      const allowedKeys = new Set(schema.properties ? Object.keys(schema.properties) : []);
      for (const key of Object.keys(obj)) {
        if (isUnsafePropertyKey(key)) continue;
        if (!allowedKeys.has(key)) {
          if (schema.additionalProperties === false) {
            errors.push({
              path: `${currentPath}/${key}`,
              keyword: 'additionalProperties',
              message: `Unexpected additional property "${key}" is not allowed.`,
              actual: key,
            });
          } else if (typeof schema.additionalProperties === 'object') {
            validateNode(obj[key], schema.additionalProperties, `${currentPath}/${key}`, errors);
          }
        }
      }
    }
  }
}

/**
 * Validates a document against a JSON Schema, returning validation status and diagnostic errors.
 */
export function validateSchema(docInput: unknown, schemaInput: unknown): SchemaValidationResult {
  let doc = docInput;
  if (typeof docInput === 'string') {
    const trimmed = docInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        doc = JSON.parse(docInput);
      } catch {
        // Treat as raw string if parse fails
      }
    }
  }

  let schema = schemaInput as JsonSchema;
  if (typeof schemaInput === 'string') {
    const trimmed = schemaInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        schema = JSON.parse(schemaInput);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          valid: false,
          errors: [{ path: '', keyword: 'syntax', message: `Invalid JSON Schema: ${msg}` }],
        };
      }
    }
  }

  const errors: SchemaValidationError[] = [];
  validateNode(doc, schema, '', errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Returns true if document is completely valid against JSON Schema.
 */
export function isValidSchema(doc: unknown, schema: unknown): boolean {
  return validateSchema(doc, schema).valid;
}

/**
 * Asserts document validity against JSON Schema, throwing an error on failure.
 */
export function assertValidSchema(doc: unknown, schema: unknown): void {
  const result = validateSchema(doc, schema);
  if (!result.valid) {
    const firstError = result.errors[0];
    const details = firstError ? `${firstError.keyword} at "${firstError.path}": ${firstError.message}` : 'Validation failed';
    throw new Error(`JSON Schema validation failed: ${details}`);
  }
}
