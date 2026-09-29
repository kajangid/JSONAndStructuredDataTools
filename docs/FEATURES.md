# Feature Guide & API Reference: @kjangid/json-tools

Comprehensive guide for all 19 programmatic tools and CLI commands.

---

## 1. `json-safe-parse`

Parse untrusted JSON strings without `try/catch` boilerplate. Returns a type-safe discriminated union with diagnostic error coordinates.

### API Signature
```typescript
function safeParse<T = unknown>(input: unknown, options?: SafeParseOptions<T>): SafeParseResult<T>;
function safeParseOrDefault<T>(input: unknown, defaultValue: T, options?: SafeParseOptions<T>): T;
```

### Examples
```typescript
import { safeParse, safeParseOrDefault } from '@kjangid/json-tools/safe-parse';

// Discriminated union handling
const result = safeParse<{ id: number; name: string }>(rawInput);

if (result.success) {
  console.log(result.data.name);
} else {
  console.error(`Parse failed at line ${result.position?.line}, col ${result.position?.column}: ${result.error.message}`);
}

// Quick fallback value
const config = safeParseOrDefault(rawInput, { theme: 'light', debug: false });
```

---

## 2. `json-safe-stringify`

Stringify complex JavaScript structures without throwing on circular references or non-standard types.

### Handled Types:
- **Circular References**: Replaced with `[Circular]` (or custom text).
- **BigInt**: Formatted as `"123456789n"` (preserves 64-bit precision).
- **Map & Set**: Serialized to plain objects or arrays.
- **Error & RegExp**: Serialized to structured objects with `name`, `message`, `stack`, and pattern strings.
- **Max Depth Limits**: Cuts off pathological recursion at `maxDepth`.

### Examples
```typescript
import { safeStringify } from '@kjangid/json-tools/safe-stringify';

const user: any = { name: 'Alice' };
user.self = user; // Circular reference

console.log(safeStringify(user));
// Output: {"name":"Alice","self":"[Circular]"}

// Custom options
const output = safeStringify(complexGraph, {
  indent: 2,
  circularValue: '<LOOP>',
  maxDepth: 4,
  serializeSpecialValues: true,
});
```

---

## 3. `json-formatter`

Pretty-print JSON strings or objects with customizable indentation, key sorting, and ANSI color highlighting.

### Examples
```typescript
import { formatJson, colorizeJson } from '@kjangid/json-tools/formatter';

// Indent 4 spaces with sorted keys
const formatted = formatJson(payload, {
  indent: 4,
  sortKeys: true, // Deterministic alphabetical ordering
});

// Terminal ANSI coloring
console.log(formatJson(payload, { color: true }));
```

---

## 4. `json-minify`

Remove extraneous whitespace, newlines, and tabs from JSON payloads while strictly preserving spacing and escape characters within string literals.

### Features
- Preserves large numbers and high-precision floats without JavaScript numerical rounding.
- Maintains string literal content (including `\n`, `\t`, `\"`, `\\`).

### Examples
```typescript
import { minifyJson } from '@kjangid/json-tools/minify';

const compact = minifyJson(`{
  "name": "Hello World",
  "data": [1, 2, 3]
}`);
// Output: {"name":"Hello World","data":[1,2,3]}
```

---

## 5. `json-validator`

Validate JSON syntax compliance according to RFC 8259 and produce visual diagnostic snippets.

### Examples
```typescript
import { validateJson, isValidJson, assertValidJson } from '@kjangid/json-tools/validator';

// 1. Fast boolean check
if (isValidJson(untrustedString)) { ... }

// 2. Full diagnostics with code snippet
const res = validateJson('{\n  "name": "Alice",\n  "age": 30,\n}');
if (!res.valid) {
  console.log(`Line ${res.error.line}, Column ${res.error.column}:`);
  console.log(res.error.snippet);
  // Output:
  // 2 |   "age": 30,
  // 3 | }
  //     ^
}

// 3. Assertion helper
assertValidJson(input); // Throws SyntaxError with snippet if invalid
```

---

## 6. `json-diff`

Deep structural diff between two JSON objects, arrays, primitives, or raw JSON strings.

### Examples
```typescript
import { diffJson, formatDiff } from '@kjangid/json-tools/diff';

const diff = diffJson(
  { env: 'dev', port: 3000, debug: true },
  { env: 'prod', port: 8080, ssl: true }
);

console.log(diff.hasChanges); // true
console.log(diff.summary);
// { additions: 1, removals: 1, modifications: 2, total: 4 }

// Print human-readable report
console.log(formatDiff(diff, { color: true }));
// + ssl: true
// - debug: true
// ~ env: "dev" => "prod"
// ~ port: 3000 => 8080
```

---

## 7. `json-flatten`

Flatten deep nested objects and arrays into single-level dot-notation key-value pairs.

### Examples
```typescript
import { flattenJson } from '@kjangid/json-tools/flatten';

const flat = flattenJson({
  user: {
    profile: {
      name: 'Alice',
      scores: [95, 98],
    },
  },
});

// Result:
// {
//   "user.profile.name": "Alice",
//   "user.profile.scores.0": 95,
//   "user.profile.scores.1": 98
// }

// Preserve arrays as leaf elements
const flatLeaf = flattenJson(payload, { flattenArrays: false });
```

---

## 8. `json-unflatten`

Reconstruct deeply nested objects and arrays from flat dot-notation dictionaries.

### Security: Prototype Pollution Guard
Automatically ignores and strips `__proto__`, `constructor`, and `prototype` keys to prevent malicious object prototype corruption.

### Examples
```typescript
import { unflattenJson } from '@kjangid/json-tools/unflatten';

const nested = unflattenJson({
  'server.host': '0.0.0.0',
  'server.port': 8080,
  'users.0.name': 'Bob',
});

// Result:
// {
//   server: { host: '0.0.0.0', port: 8080 },
//   users: [{ name: 'Bob' }]
// }
```

---

## 9. `json-path`

Safely read, test, modify, and delete deeply nested properties using dot and bracket notations.

### Examples
```typescript
import { getPath, setPath, hasPath, deletePath } from '@kjangid/json-tools/path';

const db = {
  users: [
    { id: 1, profile: { name: 'Alice' } }
  ]
};

// Safe access without throwing on undefined
const name = getPath(db, 'users[0].profile.name'); // "Alice"
const missing = getPath(db, 'users[5].email', 'none@domain.com'); // "none@domain.com"

// Check presence
hasPath(db, 'users[0].profile.name'); // true

// Mutable and Immutable updates
const updated = setPath(db, 'users[0].profile.title', 'Engineer');
const copy = setPath(db, 'users[0].profile.name', 'Alicia', { immutable: true });

// Deletions
deletePath(db, 'users[0].profile.title');
```

---

## 10. `json-escape`

Safely escape string characters for embedding within JSON string literals and unescape JSON strings back to raw strings.

### Examples
```typescript
import { escapeJsonString, unescapeJsonString } from '@kjangid/json-tools/escape';

const escaped = escapeJsonString('Quote: ", Backslash: \\, Newline: \n');
// "Quote: \\\", Backslash: \\\\, Newline: \\n"

const raw = unescapeJsonString(escaped);
// "Quote: \", Backslash: \\, Newline: \n"
```

---

## 11. `json-sort-keys`

Recursively sort keys of an object or JSON string alphabetically or using a custom comparator.

### Examples
```typescript
import { sortKeys, sortKeysJson } from '@kjangid/json-tools/sort-keys';

const sorted = sortKeys({ z: 1, a: 2, m: { y: 10, b: 20 } });
// { a: 2, m: { b: 20, y: 10 }, z: 1 }

// Format directly to sorted JSON string
const jsonString = sortKeysJson('{"z": 1, "a": 2}', { indent: 2 });
```

---

## 12. `jsonl` (Newline-Delimited JSON)

Parse, validate, and stringify newline-delimited JSON (NDJSON/JSONL) with granular line error reports.

### Examples
```typescript
import { parseJsonl, stringifyJsonl, formatJsonlSummary } from '@kjangid/json-tools/jsonl';

const result = parseJsonl('{"id": 1}\n{"id": 2}\nINVALID');
console.log(result.validCount); // 2
console.log(result.errorCount); // 1
console.log(result.errors[0]?.line); // 3

const text = stringifyJsonl([{ id: 1 }, { id: 2 }]);
const summary = formatJsonlSummary(text);
```

---

## 13. `json-merge`

Deep-merge JSON documents with configurable array conflict strategies and prototype pollution safeguards.

### Examples
```typescript
import { mergeJson, mergeJsonWithOptions } from '@kjangid/json-tools/merge';

const base = { env: 'dev', server: { port: 3000, host: 'localhost' } };
const override = { env: 'prod', server: { host: 'api.domain.com' } };

const merged = mergeJson(base, override);
// { env: 'prod', server: { port: 3000, host: 'api.domain.com' } }

// Configurable array strategy: 'replace' | 'concat' | 'union'
const unionMerged = mergeJsonWithOptions(
  { arrayMode: 'union' },
  { tags: ['node', 'js'] },
  { tags: ['ts', 'node'] }
);
// { tags: ['node', 'js', 'ts'] }
```

---

## 14. `json-repair`

Heuristically repair broken or malformed JSON text containing single quotes, trailing commas, line/block comments, unquoted keys, and unclosed brackets.

### Examples
```typescript
import { repairJson, safeRepairJson } from '@kjangid/json-tools/repair';

// Trailing commas, single quotes, comments, unquoted keys
const malformed = "{ name: 'Alice', active: true, /* note */ }";
const fixed = repairJson(malformed);
// '{\n  "name": "Alice",\n  "active": true\n}'

// Safe execution wrapper returning status and typed data
const result = safeRepairJson<{ name: string }>(malformed);
if (result.success) {
  console.log(result.data.name); // "Alice"
} else {
  console.error(result.error);
}
```

---

## 15. `json-view`

Render JSON data or parsed objects as a clear ASCII/Unicode box-drawing tree (`├──`, `└──`, `│   `) with configurable depth and terminal color highlighting.

### Examples
```typescript
import { renderJsonTree } from '@kjangid/json-tools/view';

const tree = renderJsonTree({
  app: 'payment-service',
  endpoints: ['/pay', '/refund'],
  metrics: { enabled: true, rate: 100 }
}, { maxDepth: 2, colors: true });

console.log(tree);
/*
root
├── app: "payment-service"
├── endpoints (Array[2])
│   ├── [0]: "/pay"
│   └── [1]: "/refund"
└── metrics (Object)
    ├── enabled: true
    └── rate: 100
*/
```

---

## 16. `json-patch`

RFC 6902 compliant JSON Patch generation, application, and verification with RFC 6901 JSON pointer escaping and prototype protection.

### Examples
```typescript
import { createPatch, applyPatch, safeApplyPatch } from '@kjangid/json-tools/patch';

const source = { title: 'v1', tags: ['alpha'] };
const target = { title: 'v2', tags: ['alpha', 'beta'], released: true };

// Generate RFC 6902 patch operations
const patch = createPatch(source, target);
// [
//   { op: 'replace', path: '/title', value: 'v2' },
//   { op: 'add', path: '/tags/1', value: 'beta' },
//   { op: 'add', path: '/released', value: true }
// ]

// Apply patch
const updated = applyPatch(source, patch);

// Safe application with diagnostics
const result = safeApplyPatch(source, [{ op: 'test', path: '/title', value: 'v99' }]);
if (!result.success) {
  console.error(result.error);
}
```

---

## 17. `jsonpath-test`

RFC 9535 JSONPath query evaluator and tester supporting child selectors, bracket notation, negative array indices, slices, wildcards, and recursive descent.

### Examples
```typescript
import { queryJsonPath, testJsonPath, compileJsonPath } from '@kjangid/json-tools/jsonpath';

const inventory = {
  items: [
    { sku: 'A1', price: 29.99, categories: ['electronics'] },
    { sku: 'B2', price: 9.99, categories: ['books', 'sale'] }
  ]
};

// Query paths, wildcards, slices, and recursive descent
const skus = queryJsonPath(inventory, '$.items[*].sku'); // ['A1', 'B2']
const allPrices = queryJsonPath(inventory, '$..price'); // [29.99, 9.99]
const sliced = queryJsonPath(inventory, '$.items[0:1]');

// Test presence
const hasSale = testJsonPath(inventory, '$..categories[*]'); // true

// Pre-compiled query function for high throughput
const getCategories = compileJsonPath('$..categories[*]');
console.log(getCategories(inventory)); // ['electronics', 'books', 'sale']
```

---

## 18. `json-schema-generate`

Infer standard JSON Schema Draft-07 representations from sample JavaScript values or JSON documents. Features prototype-safe property indexing, array item type inference, union types, and required-fields configuration.

### API Signature
```typescript
function generateSchema(data: unknown, options?: SchemaGenerateOptions): JsonSchema;
function generateSchemaJson(data: unknown, options?: SchemaGenerateOptions & { indent?: number }): string;

interface SchemaGenerateOptions {
  draft?: 'draft-07';
  title?: string;
  description?: string;
  requiredAll?: boolean;
}
```

### Examples
```typescript
import { generateSchema, generateSchemaJson } from '@kjangid/json-tools/schema-generate';

const sample = {
  id: 101,
  name: 'API Service',
  enabled: true,
  tags: ['production', 'v2'],
  metadata: {
    region: 'us-east-1',
  },
};

// Generate Draft-07 schema object
const schema = generateSchema(sample, {
  title: 'ServicePayload',
  requiredAll: true,
});

// Generate formatted schema JSON string
const schemaJson = generateSchemaJson(sample, { indent: 2, requiredAll: true });
console.log(schemaJson);
```

---

## 19. `json-schema-validate`

Fast, synchronous in-memory JSON Schema Draft-07 validator. Validates types, required fields, constraints (numbers, strings, arrays, objects), enums, and nested structures with detailed error reporting including property paths and failed rules.

### API Signature
```typescript
function validateSchema(data: unknown, schema: unknown): ValidationResult;
function isValidSchema(data: unknown, schema: unknown): boolean;
function assertValidSchema(data: unknown, schema: unknown): void;

interface ValidationError {
  path: string;
  message: string;
  rule: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
```

### Examples
```typescript
import { validateSchema, isValidSchema, assertValidSchema } from '@kjangid/json-tools/schema-validate';

const userSchema = {
  type: 'object',
  required: ['id', 'email'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    email: { type: 'string', minLength: 5 },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
  },
  additionalProperties: false,
};

// Validate result with diagnostics
const result = validateSchema({ id: -1, email: 'a@b', extra: true }, userSchema);
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`${err.path}: ${err.message} (${err.rule})`);
  }
}

// Fast boolean check
if (isValidSchema({ id: 1, email: 'user@example.com' }, userSchema)) {
  console.log('Valid user!');
}

// Assertion that throws Error with validation details if invalid
assertValidSchema({ id: 1, email: 'user@example.com' }, userSchema);
```

---

## 20. CLI Tool Executable

Access utilities directly from your command line:

```bash
# Pretty-print
json-tools format data.json --indent=4 --sort-keys --color

# Minify
json-tools minify large.json > minified.json

# Validate
json-tools validate input.json

# Diff
json-tools diff config.dev.json config.prod.json --color

# Flatten / Unflatten
json-tools flatten nested.json
json-tools unflatten flat.json

# Path lookup
json-tools path config.json "database.credentials.host"

# Escape & Unescape
json-tools escape text.txt
json-tools unescape escaped.txt

# Sort Keys
json-tools sort-keys data.json --indent=2
json-sort-keys data.json

# JSONL inspection
json-tools jsonl data.jsonl --summary
jsonl data.jsonl --limit=10

# Deep Merge
json-tools merge base.json patch.json --arrays=union
json-merge base.json patch.json

# Repair Malformed JSON
json-tools repair broken.json > fixed.json
json-repair broken.json

# ASCII Tree View
json-tools view complex.json --depth=3 --color
json-view complex.json

# RFC 6902 JSON Patch
json-tools patch create base.json target.json > patch.json
json-patch apply base.json patch.json

# RFC 9535 JSONPath Query & Test
json-tools jsonpath store.json "$.books[*].title"
jsonpath-test store.json "$.books[0]" --test

# Infer Draft-07 JSON Schema
json-tools schema-gen sample.json --title="User" > schema.json
json-schema-generate sample.json

# Validate Against JSON Schema
json-tools schema-val schema.json data.json
json-schema-validate schema.json data.json

# Stdin Piping
cat data.json | json-tools minify
cat invalid.json | json-tools validate

# Print Version
json-tools --version
json-tools -v
```

---

## 21. Package Version Constant (`VERSION`)

The package exports a `VERSION` string constant that is automatically synchronized with `package.json`:

```typescript
import { VERSION } from '@kjangid/json-tools';

console.log(VERSION); // e.g. "1.0.0"
```
