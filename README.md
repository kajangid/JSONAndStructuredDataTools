# @kjangid/json-tools

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/tsconfig.json)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@kjangid/json-tools)
[![Module](https://img.shields.io/badge/Module-ESM%20%7C%20CJS-orange.svg)](https://www.npmjs.com/package/@kjangid/json-tools)
[![CI](https://github.com/kajangid/JSONAndStructuredDataTools/actions/workflows/ci.yml/badge.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/actions/workflows/ci.yml)
[![Release](https://github.com/kajangid/JSONAndStructuredDataTools/actions/workflows/release.yml/badge.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@kjangid/json-tools.svg)](https://www.npmjs.com/package/@kjangid/json-tools)
[![Tests](https://img.shields.io/badge/Tests-186%20passed-success.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/TESTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![Coverage](https://img.shields.io/badge/coverage-96.3%25-brightgreen.svg)](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/TESTING.md)

A high-performance, **zero-dependency**, type-safe utility toolkit and CLI for robust JSON and structured data manipulation in Node.js, browsers, and edge environments.

---

## Key Features

- **Zero Runtime Dependencies**: Ultra-lightweight, zero vulnerability bloat, and minimal bundle footprint.
- **Isomorphic (Node & Browser)**: Works across Node.js (>=18), modern browsers, Cloudflare Workers, Deno, and Bun.
- **Dual ESM & CommonJS**: Full support for both `import` and `require` with first-class TypeScript `.d.ts` declaration maps.
- **Granular Subpath Imports**: Import individual tools (`@kjangid/json-tools/safe-parse`) for maximum tree-shaking efficiency.
- **Built-in CLI Executables**: Includes both unified `json-tools <command>` and individual command aliases (`json-format`, `json-minify`, `json-validate`, `json-diff`, `json-merge`, `json-repair`, `json-view`, `json-patch`, `jsonpath-test`, `json-schema-generate`, etc.).
- **Security by Default**: Strict prototype pollution defenses against `__proto__`, `constructor`, and `prototype` exploits.

---

## Installation

```bash
# npm
npm install @kjangid/json-tools

# pnpm
pnpm add @kjangid/json-tools

# yarn
yarn add @kjangid/json-tools

# bun
bun add @kjangid/json-tools
```

---

## Quick Start: Common Workflows

### 1. Safe Parsing & Serialization (No Exceptions, BigInt & Circular Safe)

```typescript
import { safeParse, safeStringify } from "@kjangid/json-tools";

// Parse without try/catch; get exact line/column coordinates on error
const result = safeParse<{ id: number }>('{"id": 42}');
if (result.success) {
  console.log(result.data.id); // 42
} else {
  console.error(`Syntax error at line ${result.position?.line}, col ${result.position?.column}`);
}

// Handles circular references, BigInt, Map, Set, and Error objects
const graph: any = { id: 9007199254740993n, tags: new Set(["api", "prod"]) };
graph.self = graph;

console.log(safeStringify(graph, 2));
// Output: {"id":"9007199254740993n","tags":["api","prod"],"self":"[Circular]"}
```

### 2. JSON Schema Generation & In-Memory Validation (Draft-07)

```typescript
import { generateSchema, validateSchema, isValidSchema } from "@kjangid/json-tools";

const sample = { id: 101, name: "Gateway", active: true, tags: ["net", "v2"] };

// Automatically infer Draft-07 JSON Schema from a sample payload
const schema = generateSchema(sample, { title: "ServiceConfig", requiredAll: true });

// Validate untrusted data against schema with detailed diagnostic errors
const validation = validateSchema({ id: "invalid", name: "Gateway" }, schema);
if (!validation.valid) {
  for (const err of validation.errors) {
    console.error(`${err.path}: ${err.message} (rule: ${err.rule})`);
  }
}

// Fast boolean check
if (isValidSchema(sample, schema)) {
  console.log("Valid payload!");
}
```

### 3. Deep Structural Diff, Merge & RFC 6902 Patching

```typescript
import { diffJson, mergeJson, createPatch, applyPatch } from "@kjangid/json-tools";

const base = { theme: "light", env: { debug: false }, tags: ["web"] };
const update = { theme: "dark", env: { debug: true }, tags: ["api"] };

// 1. Deep structural diff
const differences = diffJson(base, update);

// 2. Deep merge with union arrays
const merged = mergeJson(base, update, { arrayStrategy: "union" });
// tags become: ["web", "api"]

// 3. RFC 6902 JSON Patch creation & application
const patch = createPatch(base, update);
const patched = applyPatch(base, patch);
```

### 4. Malformed JSON Repair & RFC 9535 JSONPath Querying

```typescript
import { repairJson, queryJsonPath } from "@kjangid/json-tools";

// Fix trailing commas, unquoted keys, single quotes, and unclosed brackets
const dirty = "{ name: 'Widget', items: [1, 2, 3,], // note }";
const clean = repairJson(dirty);
// '{"name": "Widget", "items": [1, 2, 3]}'

// Query complex structures with standard RFC 9535 JSONPath
const store = {
  books: [
    { title: "Refactoring", author: "Fowler", price: 45 },
    { title: "Clean Code", author: "Martin", price: 50 },
  ],
};

const authors = queryJsonPath(store, "$..author"); // ["Fowler", "Martin"]
const cheapBooks = queryJsonPath(store, "$.books[0:1].title"); // ["Refactoring"]
```

---

## The 19 Core Utilities

All utilities can be imported from root (`@kjangid/json-tools`) or via isolated subpaths for optimal tree-shaking:

| Utility | Description | Subpath Import |
| :--- | :--- | :--- |
| **`json-safe-parse`** | Parse JSON without throwing; returns line/column coordinates on error. | `@kjangid/json-tools/safe-parse` |
| **`json-safe-stringify`** | Stringify handling circular refs, `BigInt`, `Map`, `Set`, `Error`, `RegExp`. | `@kjangid/json-tools/safe-stringify` |
| **`json-formatter`** | Pretty-print JSON with custom indents, deterministic key sorting, and ANSI color. | `@kjangid/json-tools/formatter` |
| **`json-minify`** | Strip whitespace from JSON while preserving string literal contents. | `@kjangid/json-tools/minify` |
| **`json-validator`** | Validate RFC 8259 JSON syntax with visual caret-pointed error snippets. | `@kjangid/json-tools/validator` |
| **`json-diff`** | Deep structural diff between objects or JSON strings. | `@kjangid/json-tools/diff` |
| **`json-flatten`** | Flatten deeply nested objects and arrays into dot notation. | `@kjangid/json-tools/flatten` |
| **`json-unflatten`** | Reconstruct nested objects/arrays from dot notation with prototype defense. | `@kjangid/json-tools/unflatten` |
| **`json-path`** | Safely read, test, modify, and delete nested values via dot/bracket paths. | `@kjangid/json-tools/path` |
| **`json-escape`** | Safely escape string characters for embedding in JSON literals and unescape text. | `@kjangid/json-tools/escape` |
| **`json-sort-keys`** | Recursively sort object keys alphabetically or via custom comparator. | `@kjangid/json-tools/sort-keys` |
| **`jsonl`** | Parse, validate, and stringify newline-delimited JSON (JSONL/NDJSON). | `@kjangid/json-tools/jsonl` |
| **`json-merge`** | Deep-merge JSON documents with array strategies (`replace`, `concat`, `union`). | `@kjangid/json-tools/merge` |
| **`json-repair`** | Heuristically fix trailing commas, quotes, bare keys, comments, brackets. | `@kjangid/json-tools/repair` |
| **`json-view`** | Render JSON data structures as Unicode/ASCII box-drawing trees. | `@kjangid/json-tools/view` |
| **`json-patch`** | Generate and apply RFC 6902 JSON patches with JSON Pointer (`~0`, `~1`). | `@kjangid/json-tools/patch` |
| **`jsonpath-test`** | Query and test RFC 9535 JSONPath expressions (`$`, `.prop`, `[*]`, `[0:1]`, `..`). | `@kjangid/json-tools/jsonpath` |
| **`json-schema-generate`** | Infer standard Draft-07 JSON Schema with structural typing from sample payloads. | `@kjangid/json-tools/schema-generate` |
| **`json-schema-validate`** | Validate documents against JSON Schema Draft-07 rules with diagnostic errors. | `@kjangid/json-tools/schema-validate` |

See [docs/FEATURES.md](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/FEATURES.md) for complete API signatures, options, and full method documentation.

---

## CLI Tools

Run via `npx` or install globally (`npm install -g @kjangid/json-tools`):

```bash
# Unified CLI runner
json-tools format data.json --indent=4 --sort-keys --color
json-tools minify data.json > minified.json
json-tools validate data.json
json-tools diff config.dev.json config.prod.json --color
json-tools merge base.json override.json --arrays=union
json-tools repair broken.json > fixed.json
json-tools view data.json --depth=3 --color
json-tools patch create base.json target.json > patch.json
json-tools jsonpath store.json "$.books[*].title"
json-tools schema-gen sample.json --title="User" > schema.json
json-tools schema-val schema.json data.json

# Direct command aliases
json-format data.json
json-minify data.json
json-validate data.json
json-diff doc1.json doc2.json
json-merge base.json patch.json
json-repair broken.json
json-view data.json
json-patch apply base.json patch.json
jsonpath-test store.json "$.books[0]" --test
json-schema-generate sample.json
json-schema-validate schema.json data.json

# Stdin piping
cat data.json | json-tools minify
cat invalid.json | json-tools validate
```

---

## Limitations & Operational Boundaries

To maintain zero runtime dependencies and predictable performance, the library operates within explicit boundaries:

1. **In-Memory Payloads**: Optimized for microservice payloads, API requests, configuration files, and state trees up to tens of megabytes. For multi-gigabyte files exceeding V8 heap RAM (>1.5 GB), use a streaming token parser.
2. **BigInt 64-bit Format**: To prevent silent IEEE 754 precision loss, `safeStringify` serializes BigInts as string literals (e.g. `"9007199254740993n"`).
3. **Prototype Pollution Protection**: Dangerous keys (`__proto__`, `constructor`, `prototype`) are dropped and blocked from property traversal and unflattening.
4. **JSON Schema Scope**: In-memory Draft-07 rule validator. Remote `$ref` network HTTP dereferencing is deliberately excluded to prevent SSRF vulnerabilities and network latency.
5. **JSONPath Script Predicates**: RFC 9535 structural queries (`$`, `.prop`, `[*]`, slices, `..`) are supported. Arbitrary script execution expressions (`[?(@.price < 10)]`) requiring `eval()` are intentionally omitted to maintain strict security.

See [docs/LIMITATIONS.md](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/LIMITATIONS.md) for full details on edge cases and design decisions.

---

## Comprehensive Documentation

- [Features & Full API Reference](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/FEATURES.md)
- [Architecture & Design Decisions](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/ARCHITECTURE.md)
- [Installation & Subpath Imports Guide](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/INSTALLATION.md)
- [Limitations & Operational Boundaries](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/LIMITATIONS.md)
- [Future Improvements & Roadmap](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/FUTURE_IMPROVEMENTS.md)
- [Testing Strategy & Test Matrix](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/TESTING.md)
- [Deployment & Release Guide](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/DEPLOYMENT.md)

---

## Contributing

Contributions, bug reports, and suggestions are welcome! Please check our [Contributing Guide](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/CONTRIBUTING.md) for setup instructions, coding conventions, and PR requirements.

---

## Security

All traversal, path setting, unflattening, and deep merging functions strictly guard against prototype pollution attacks:
- `__proto__` is dropped and blocked from object traversal.
- `constructor` and `prototype` property mutations are safely rejected.

---

## License

[MIT](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/LICENSE) © 2026 Karan Jangid
