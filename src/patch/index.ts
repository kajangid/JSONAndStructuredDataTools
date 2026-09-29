import { isUnsafePropertyKey, hasOwn } from '../shared/security';

export type JsonPatchOp = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

export interface JsonPatchOperation {
  op: JsonPatchOp;
  path: string;
  value?: unknown;
  from?: string;
}

export interface ApplyPatchOptions {
  /**
   * If true, mutates the document in-place where applicable. Default: false
   */
  mutate?: boolean;
}

export interface SafeApplyPatchResult<T = unknown> {
  success: boolean;
  doc?: T;
  error?: string;
  appliedCount: number;
}

export class JsonPatchError extends Error {
  constructor(
    message: string,
    public readonly operationIndex?: number,
    public readonly operation?: JsonPatchOperation
  ) {
    super(message);
    this.name = 'JsonPatchError';
  }
}

/**
 * Escapes a token for RFC 6901 JSON Pointer (`~` -> `~0`, `/` -> `~1`).
 */
export function escapeJsonPointer(segment: string | number): string {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescapes an RFC 6901 JSON Pointer token (`~1` -> `/`, `~0` -> `~`).
 */
export function unescapeJsonPointer(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Parses an RFC 6901 JSON Pointer string into an array of unescaped path segments.
 */
export function parseJsonPointer(pointer: string): string[] {
  if (pointer === '') {
    return [];
  }
  if (!pointer.startsWith('/')) {
    throw new JsonPatchError(`Invalid JSON Pointer: "${pointer}". Must start with "/" or be empty string.`);
  }
  return pointer.slice(1).split('/').map(unescapeJsonPointer);
}

/**
 * Compiles an array of path segments into an RFC 6901 JSON Pointer string.
 */
export function compileJsonPointer(tokens: (string | number)[]): string {
  if (tokens.length === 0) {
    return '';
  }
  return '/' + tokens.map(escapeJsonPointer).join('/');
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

/**
 * Generates an RFC 6902 JSON Patch representing the operations needed to transform source into target.
 */
export function createPatch(sourceInput: unknown, targetInput: unknown): JsonPatchOperation[] {
  const source = typeof sourceInput === 'string' ? JSON.parse(sourceInput) : sourceInput;
  const target = typeof targetInput === 'string' ? JSON.parse(targetInput) : targetInput;

  const patch: JsonPatchOperation[] = [];

  function walk(s: unknown, t: unknown, tokens: (string | number)[]): void {
    if (Object.is(s, t)) {
      return;
    }

    const currentPointer = compileJsonPointer(tokens);

    // Arrays comparison
    if (Array.isArray(s) && Array.isArray(t)) {
      const commonLen = Math.min(s.length, t.length);
      for (let i = 0; i < commonLen; i++) {
        walk(s[i], t[i], [...tokens, i]);
      }
      // Target has more items -> add
      for (let i = commonLen; i < t.length; i++) {
        patch.push({
          op: 'add',
          path: compileJsonPointer([...tokens, i]),
          value: cloneValue(t[i]),
        });
      }
      // Source has more items -> remove extra in reverse order
      for (let i = s.length - 1; i >= commonLen; i--) {
        patch.push({
          op: 'remove',
          path: compileJsonPointer([...tokens, i]),
        });
      }
      return;
    }

    // Objects comparison
    if (isPlainObject(s) && isPlainObject(t)) {
      const sKeys = Object.keys(s);
      const tKeys = Object.keys(t);
      const tKeySet = new Set(tKeys);
      const sKeySet = new Set(sKeys);

      // Removed properties
      for (const k of sKeys) {
        if (!isUnsafePropertyKey(k) && !tKeySet.has(k)) {
          patch.push({
            op: 'remove',
            path: compileJsonPointer([...tokens, k]),
          });
        }
      }

      // Added or updated properties
      for (const k of tKeys) {
        if (isUnsafePropertyKey(k)) continue;
        if (!sKeySet.has(k)) {
          patch.push({
            op: 'add',
            path: compileJsonPointer([...tokens, k]),
            value: cloneValue(t[k]),
          });
        } else {
          walk(s[k], t[k], [...tokens, k]);
        }
      }
      return;
    }

    // Different primitives or mismatched types -> replace
    patch.push({
      op: 'replace',
      path: currentPointer,
      value: cloneValue(t),
    });
  }

  walk(source, target, []);
  return patch;
}

function resolvePointerParent(root: unknown, tokens: string[]): { parent: unknown; key: string } {
  if (tokens.length === 0) {
    return { parent: null, key: '' };
  }
  let current: any = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]!;
    if (isUnsafePropertyKey(token)) {
      throw new JsonPatchError(`Prototype pollution attempt detected with key "${token}".`);
    }
    if (current === null || typeof current !== 'object') {
      throw new JsonPatchError(`Cannot traverse through non-object at "/${tokens.slice(0, i + 1).join('/')}".`);
    }
    if (Array.isArray(current)) {
      const idx = parseInt(token, 10);
      if (isNaN(idx) || idx < 0 || idx >= current.length) {
        throw new JsonPatchError(`Array index out of bounds: "${token}".`);
      }
      current = current[idx];
    } else {
      current = current[token];
    }
  }

  const lastToken = tokens[tokens.length - 1]!;
  if (isUnsafePropertyKey(lastToken)) {
    throw new JsonPatchError(`Prototype pollution attempt detected with key "${lastToken}".`);
  }

  return { parent: current, key: lastToken };
}

function getPointerValue(root: unknown, tokens: string[]): unknown {
  if (tokens.length === 0) {
    return root;
  }
  const { parent, key } = resolvePointerParent(root, tokens);
  if (parent === null || typeof parent !== 'object') {
    throw new JsonPatchError(`Path not found.`);
  }
  if (Array.isArray(parent)) {
    const idx = parseInt(key, 10);
    if (isNaN(idx) || idx < 0 || idx >= parent.length) {
      throw new JsonPatchError(`Array index out of bounds: "${key}".`);
    }
    return parent[idx];
  }
  if (!hasOwn(parent as Record<string, unknown>, key)) {
    throw new JsonPatchError(`Property "${key}" does not exist.`);
  }
  return (parent as Record<string, unknown>)[key];
}

/**
 * Applies a single RFC 6902 operation to a document.
 */
export function applyOperation<T = unknown>(doc: T, operation: JsonPatchOperation): T {
  const { op, path, value, from } = operation;
  const tokens = parseJsonPointer(path);

  if (tokens.length === 0) {
    if (op === 'replace' || op === 'add') {
      return cloneValue(value) as T;
    }
    if (op === 'remove') {
      return null as unknown as T;
    }
    if (op === 'test') {
      if (!deepEqual(doc, value)) {
        throw new JsonPatchError(`Test failed: root document does not match expected value.`, undefined, operation);
      }
      return doc;
    }
  }

  const { parent, key } = resolvePointerParent(doc, tokens);
  if (parent === null || typeof parent !== 'object') {
    throw new JsonPatchError(`Cannot apply "${op}" on invalid parent at "${path}".`, undefined, operation);
  }

  switch (op) {
    case 'add': {
      const valToAdd = cloneValue(value);
      if (Array.isArray(parent)) {
        if (key === '-') {
          parent.push(valToAdd);
        } else {
          const idx = parseInt(key, 10);
          if (isNaN(idx) || idx < 0 || idx > parent.length) {
            throw new JsonPatchError(`Invalid array index "${key}" for add at "${path}".`, undefined, operation);
          }
          parent.splice(idx, 0, valToAdd);
        }
      } else {
        (parent as Record<string, unknown>)[key] = valToAdd;
      }
      break;
    }

    case 'remove': {
      if (Array.isArray(parent)) {
        const idx = parseInt(key, 10);
        if (isNaN(idx) || idx < 0 || idx >= parent.length) {
          throw new JsonPatchError(`Invalid array index "${key}" for remove at "${path}".`, undefined, operation);
        }
        parent.splice(idx, 1);
      } else {
        if (!hasOwn(parent as Record<string, unknown>, key)) {
          throw new JsonPatchError(`Property "${key}" does not exist for remove at "${path}".`, undefined, operation);
        }
        delete (parent as Record<string, unknown>)[key];
      }
      break;
    }

    case 'replace': {
      const valToReplace = cloneValue(value);
      if (Array.isArray(parent)) {
        const idx = parseInt(key, 10);
        if (isNaN(idx) || idx < 0 || idx >= parent.length) {
          throw new JsonPatchError(`Invalid array index "${key}" for replace at "${path}".`, undefined, operation);
        }
        parent[idx] = valToReplace;
      } else {
        if (!hasOwn(parent as Record<string, unknown>, key)) {
          throw new JsonPatchError(`Property "${key}" does not exist for replace at "${path}".`, undefined, operation);
        }
        (parent as Record<string, unknown>)[key] = valToReplace;
      }
      break;
    }

    case 'move': {
      if (!from) {
        throw new JsonPatchError(`"move" operation requires a "from" path.`, undefined, operation);
      }
      const fromTokens = parseJsonPointer(from);
      const val = getPointerValue(doc, fromTokens);
      // Remove from source
      applyOperation(doc, { op: 'remove', path: from });
      // Add to destination
      applyOperation(doc, { op: 'add', path, value: val });
      break;
    }

    case 'copy': {
      if (!from) {
        throw new JsonPatchError(`"copy" operation requires a "from" path.`, undefined, operation);
      }
      const fromTokens = parseJsonPointer(from);
      const val = getPointerValue(doc, fromTokens);
      applyOperation(doc, { op: 'add', path, value: cloneValue(val) });
      break;
    }

    case 'test': {
      const currentVal = Array.isArray(parent)
        ? parent[parseInt(key, 10)]
        : (parent as Record<string, unknown>)[key];
      if (!deepEqual(currentVal, value)) {
        throw new JsonPatchError(`Test failed at path "${path}". Expected ${JSON.stringify(value)}, found ${JSON.stringify(currentVal)}.`, undefined, operation);
      }
      break;
    }

    default:
      throw new JsonPatchError(`Unsupported operation: "${(operation as any).op}".`, undefined, operation);
  }

  return doc;
}

/**
 * Applies an array of RFC 6902 operations to a target document.
 */
export function applyPatch<T = unknown>(
  docInput: unknown,
  patch: JsonPatchOperation[],
  options: ApplyPatchOptions = {}
): T {
  let doc = options.mutate === true ? (docInput as T) : cloneValue(docInput as T);

  for (let i = 0; i < patch.length; i++) {
    const op = patch[i]!;
    try {
      doc = applyOperation(doc, op);
    } catch (err) {
      if (err instanceof JsonPatchError) {
        throw new JsonPatchError(err.message, i, op);
      }
      throw err;
    }
  }

  return doc;
}

/**
 * Safely applies an RFC 6902 patch, catching errors and returning a result object.
 */
export function safeApplyPatch<T = unknown>(
  docInput: unknown,
  patch: JsonPatchOperation[],
  options: ApplyPatchOptions = {}
): SafeApplyPatchResult<T> {
  try {
    const doc = applyPatch<T>(docInput, patch, options);
    return {
      success: true,
      doc,
      appliedCount: patch.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const appliedCount = err instanceof JsonPatchError && err.operationIndex !== undefined ? err.operationIndex : 0;
    return {
      success: false,
      error: message,
      appliedCount,
    };
  }
}
