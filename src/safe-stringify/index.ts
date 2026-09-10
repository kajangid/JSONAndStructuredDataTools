export type ReplacerFunction = (this: any, key: string, value: any) => any;
export type Replacer = ReplacerFunction | (number | string)[] | null;

export interface SafeStringifyOptions {
  /**
   * Indentation space count or string (e.g. 2 or '\t')
   */
  indent?: number | string;
  /**
   * Custom replacer function or whitelist array
   */
  replacer?: Replacer;
  /**
   * Placeholder string for circular references. Default: '[Circular]'
   */
  circularValue?: string | null;
  /**
   * Maximum recursion depth. Default: Infinity
   */
  maxDepth?: number;
  /**
   * Placeholder string when max depth is reached. Default: '[MaxDepth]'
   */
  maxDepthValue?: string;
  /**
   * Whether to transform special JS types (Map, Set, BigInt, RegExp, Error). Default: true
   */
  serializeSpecialValues?: boolean;
}

/**
 * Safely stringifies a JavaScript value to JSON, handling circular references,
 * BigInt, Map, Set, Error, RegExp, and deep recursion limits without throwing.
 */
export function safeStringify(
  value: unknown,
  optionsOrReplacer?: SafeStringifyOptions | Replacer | number | string,
  space?: number | string
): string {
  let indent: number | string | undefined;
  let customReplacer: Replacer = null;
  let circularValue: string | null = '[Circular]';
  let maxDepth = Infinity;
  let maxDepthValue = '[MaxDepth]';
  let serializeSpecialValues = true;

  // Handle overloaded arguments
  if (typeof optionsOrReplacer === 'number' || typeof optionsOrReplacer === 'string') {
    indent = optionsOrReplacer;
  } else if (typeof optionsOrReplacer === 'function' || Array.isArray(optionsOrReplacer)) {
    customReplacer = optionsOrReplacer;
    indent = space;
  } else if (optionsOrReplacer && typeof optionsOrReplacer === 'object') {
    indent = optionsOrReplacer.indent ?? space;
    customReplacer = optionsOrReplacer.replacer ?? null;
    if (optionsOrReplacer.circularValue !== undefined) {
      circularValue = optionsOrReplacer.circularValue;
    }
    if (typeof optionsOrReplacer.maxDepth === 'number') {
      maxDepth = optionsOrReplacer.maxDepth;
    }
    if (optionsOrReplacer.maxDepthValue !== undefined) {
      maxDepthValue = optionsOrReplacer.maxDepthValue;
    }
    if (optionsOrReplacer.serializeSpecialValues !== undefined) {
      serializeSpecialValues = optionsOrReplacer.serializeSpecialValues;
    }
  } else {
    indent = space;
  }

  const seen = new Set<unknown>();

  function transform(val: unknown, key: string, depth: number): unknown {
    // 1. Handle special non-object primitives
    if (typeof val === 'bigint') {
      return serializeSpecialValues ? `${val.toString()}n` : val.toString();
    }

    if (typeof val === 'symbol') {
      return val.toString();
    }

    if (val === null || val === undefined) {
      return val;
    }

    // 2. Handle non-objects or primitives
    if (typeof val !== 'object') {
      return val;
    }

    // 3. Max depth check (for objects/arrays when reaching maxDepth)
    if (depth >= maxDepth) {
      return maxDepthValue;
    }

    // 4. Circular reference detection
    if (seen.has(val)) {
      return circularValue ?? undefined;
    }

    // 5. Special object types
    if (serializeSpecialValues) {
      if (val instanceof Map) {
        seen.add(val);
        const entries: Record<string, unknown> = {};
        for (const [k, v] of val.entries()) {
          entries[String(k)] = transform(v, String(k), depth + 1);
        }
        seen.delete(val);
        return entries;
      }

      if (val instanceof Set) {
        seen.add(val);
        const arr = Array.from(val).map((item, idx) => transform(item, String(idx), depth + 1));
        seen.delete(val);
        return arr;
      }

      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          ...(val.stack ? { stack: val.stack } : {}),
        };
      }

      if (val instanceof RegExp) {
        return val.toString();
      }
    }

    // If object has a custom toJSON method, use it (standard JSON.stringify behavior)
    if (typeof (val as any).toJSON === 'function' && !(val instanceof Date)) {
      try {
        const jsonVal = (val as any).toJSON(key);
        return transform(jsonVal, key, depth);
      } catch {
        // If toJSON throws, continue with object serialization
      }
    }

    // 6. Handle Arrays
    if (Array.isArray(val)) {
      seen.add(val);
      const res: unknown[] = [];
      for (let i = 0; i < val.length; i++) {
        res.push(transform(val[i], String(i), depth + 1));
      }
      seen.delete(val);
      return res;
    }

    // 7. Handle plain/complex Objects
    seen.add(val);
    const result: Record<string, unknown> = {};
    const keys = Object.keys(val as object);

    for (const k of keys) {
      const propVal = (val as Record<string, unknown>)[k];
      const transformed = transform(propVal, k, depth + 1);
      if (transformed !== undefined) {
        result[k] = transformed;
      }
    }
    seen.delete(val);
    return result;
  }

  // Pre-transform the data structure
  const preprocessed = transform(value, '', 0);

  // Use JSON.stringify with customReplacer and indent
  const finalReplacer = typeof customReplacer === 'function'
    ? customReplacer
    : Array.isArray(customReplacer)
    ? customReplacer
    : undefined;

  return JSON.stringify(preprocessed, finalReplacer as any, indent);
}
