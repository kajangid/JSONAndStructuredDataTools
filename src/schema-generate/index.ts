import { isUnsafePropertyKey, createSafeRecord } from '../shared/security';

export interface JsonSchema {
  $schema?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export interface GenerateSchemaOptions {
  /**
   * Include the standard draft-07 $schema URI. Default: true
   */
  draft?: boolean;
  /**
   * Mark all discovered properties as required. Default: true
   */
  required?: boolean;
  /**
   * Optional title for the root schema.
   */
  title?: string;
  /**
   * Optional description for the root schema.
   */
  description?: string;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date);
}

function inferType(val: unknown): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'integer' : 'number';
  }
  return typeof val;
}

function inferNodeSchema(val: unknown, options: GenerateSchemaOptions): JsonSchema {
  if (val === null) {
    return { type: 'null' };
  }

  if (typeof val === 'string') {
    return { type: 'string' };
  }

  if (typeof val === 'boolean') {
    return { type: 'boolean' };
  }

  if (typeof val === 'number') {
    return { type: Number.isInteger(val) ? 'integer' : 'number' };
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { type: 'array' };
    }

    // Merge schemas of array items
    const itemTypes = new Set<string>();
    const objectSchemas: JsonSchema[] = [];

    for (const item of val) {
      itemTypes.add(inferType(item));
      if (isPlainObject(item)) {
        objectSchemas.push(inferNodeSchema(item, options));
      }
    }

    if (objectSchemas.length > 0) {
      // Merge all object properties
      const mergedProps = createSafeRecord<JsonSchema>();
      const requiredSets: Set<string>[] = [];

      for (const objSchema of objectSchemas) {
        if (objSchema.properties) {
          const keys = Object.keys(objSchema.properties);
          requiredSets.push(new Set(keys));
          for (const k of keys) {
            if (!mergedProps[k]) {
              mergedProps[k] = objSchema.properties[k]!;
            }
          }
        }
      }

      const mergedKeys = Object.keys(mergedProps);
      const commonRequired = options.required !== false
        ? mergedKeys.filter((k) => requiredSets.every((set) => set.has(k)))
        : [];

      return {
        type: 'array',
        items: {
          type: 'object',
          properties: mergedProps,
          ...(commonRequired.length > 0 ? { required: commonRequired } : {}),
        },
      };
    }

    // Homogeneous primitives
    if (itemTypes.size === 1) {
      const singleType = Array.from(itemTypes)[0]!;
      return {
        type: 'array',
        items: { type: singleType },
      };
    }

    // Heterogeneous primitives
    return {
      type: 'array',
      items: { type: Array.from(itemTypes) },
    };
  }

  if (isPlainObject(val)) {
    const properties = createSafeRecord<JsonSchema>();
    const required: string[] = [];

    for (const key of Object.keys(val)) {
      if (isUnsafePropertyKey(key)) continue;
      properties[key] = inferNodeSchema(val[key], options);
      if (options.required !== false) {
        required.push(key);
      }
    }

    const schema: JsonSchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }

  return {};
}

/**
 * Infers a Draft-07 compatible JSON Schema from a sample data payload.
 */
export function generateSchema(sampleInput: unknown, options: GenerateSchemaOptions = {}): JsonSchema {
  let sample = sampleInput;
  if (typeof sampleInput === 'string') {
    try {
      sample = JSON.parse(sampleInput);
    } catch {
      // Use raw input if parse fails
    }
  }

  const rootSchema = inferNodeSchema(sample, options);

  if (options.draft !== false) {
    rootSchema.$schema = 'http://json-schema.org/draft-07/schema#';
  }
  if (options.title) {
    rootSchema.title = options.title;
  }
  if (options.description) {
    rootSchema.description = options.description;
  }

  return rootSchema;
}

/**
 * Infers a JSON Schema and formats it as a pretty-printed JSON string.
 */
export function generateSchemaJson(
  sampleInput: unknown,
  options: GenerateSchemaOptions & { indent?: number } = {}
): string {
  const schema = generateSchema(sampleInput, options);
  return JSON.stringify(schema, null, options.indent ?? 2);
}
