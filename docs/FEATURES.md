# Feature Guide & API Reference: @omnidev-tools/json-structured-data

Comprehensive guide for all 9 programmatic tools and CLI commands.

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
import { safeParse, safeParseOrDefault } from '@omnidev-tools/json-structured-data/safe-parse';

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
import { safeStringify } from '@omnidev-tools/json-structured-data/safe-stringify';

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
import { formatJson, colorizeJson } from '@omnidev-tools/json-structured-data/formatter';

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
import { minifyJson } from '@omnidev-tools/json-structured-data/minify';

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
import { validateJson, isValidJson, assertValidJson } from '@omnidev-tools/json-structured-data/validator';

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
import { diffJson, formatDiff } from '@omnidev-tools/json-structured-data/diff';

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
import { flattenJson } from '@omnidev-tools/json-structured-data/flatten';

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
import { unflattenJson } from '@omnidev-tools/json-structured-data/unflatten';

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
import { getPath, setPath, hasPath, deletePath } from '@omnidev-tools/json-structured-data/path';

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

## 10. CLI Tool Executable

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

# Stdin Piping
cat data.json | json-tools minify
cat invalid.json | json-tools validate

# Print Version
json-tools --version
json-tools -v
```

---

## 11. Package Version Constant (`VERSION`)

The package exports a `VERSION` string constant that is automatically synchronized with `package.json`:

```typescript
import { VERSION } from '@omnidev-tools/json-structured-data';

console.log(VERSION); // e.g. "1.0.0"
```
