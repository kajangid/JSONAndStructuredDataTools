# @omnidev-tools/json-structured-data

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()
[![Module](https://img.shields.io/badge/Module-ESM%20%7C%20CJS-orange.svg)]()
[![Tests](https://img.shields.io/badge/Tests-101%20passed-success.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance, **zero-dependency**, type-safe utility toolkit and CLI for robust JSON and structured data manipulation in Node.js, browsers, and edge environments.

---

## 🚀 Key Features

- **Zero Runtime Dependencies**: Ultra-lightweight, zero vulnerability bloat, and minimal bundle footprint.
- **Isomorphic (Node & Browser)**: Seamlessly works across Node.js (>=18), modern browsers, Cloudflare Workers, Deno, and Bun.
- **Dual ESM & CommonJS**: Full support for both `import` and `require` with first-class TypeScript `.d.ts` declaration maps.
- **Granular Subpath Imports**: Import individual tools (`@omnidev-tools/json-structured-data/safe-parse`) for maximum tree-shaking efficiency.
- **Built-in CLI Executables**: Includes both unified `json-tools <command>` and individual command aliases (`json-format`, `json-minify`, `json-validate`, `json-diff`, etc.).
- **Security by Default**: Strict prototype pollution defenses against `__proto__`, `constructor`, and `prototype` exploits.

---

## 📦 The 9 Core Utilities

| Utility | Description | Primary Exports |
| :--- | :--- | :--- |
| **`json-safe-parse`** | Parse JSON without throwing exceptions; returns typed results with exact error line/column coordinates. | `safeParse`, `safeParseOrDefault` |
| **`json-safe-stringify`** | Stringify data safely, handling circular references, `BigInt`, `Map`, `Set`, `Error`, and `RegExp`. | `safeStringify` |
| **`json-formatter`** | Pretty-print JSON with custom indents, deterministic key sorting, and ANSI terminal colors. | `formatJson`, `colorizeJson` |
| **`json-minify`** | Strip whitespace from JSON while preserving string literal spacing and high-precision numbers. | `minifyJson` |
| **`json-validator`** | Validate RFC 8259 JSON compliance with visual caret-pointed error code snippets. | `validateJson`, `isValidJson`, `assertValidJson` |
| **`json-diff`** | Deep structural diff between objects or JSON strings, reporting additions, removals, and changes. | `diffJson`, `formatDiff` |
| **`json-flatten`** | Flatten deeply nested objects and arrays into dot notation. | `flattenJson` |
| **`json-unflatten`** | Reconstruct nested objects/arrays from dot notation with prototype pollution protection. | `unflattenJson` |
| **`json-path`** | Safely read, test, modify, and delete nested values using dot/bracket paths. | `getPath`, `setPath`, `hasPath`, `deletePath` |

---

## 🛠 Installation

```bash
# npm
npm install @omnidev-tools/json-structured-data

# pnpm
pnpm add @omnidev-tools/json-structured-data

# yarn
yarn add @omnidev-tools/json-structured-data

# bun
bun add @omnidev-tools/json-structured-data
```

---

## ⚡ Quick Start

### 1. `json-safe-parse`
```typescript
import { safeParse, safeParseOrDefault } from '@omnidev-tools/json-structured-data/safe-parse';

const result = safeParse<{ name: string }>('{"name": "Alice"}');
if (result.success) {
  console.log(result.data.name); // "Alice"
} else {
  console.error(`Error at line ${result.position?.line}, col ${result.position?.column}: ${result.error.message}`);
}

// Fallback default
const config = safeParseOrDefault('invalid json', { debug: false });
```

### 2. `json-safe-stringify`
```typescript
import { safeStringify } from '@omnidev-tools/json-structured-data/safe-stringify';

const obj: any = { name: 'Graph' };
obj.self = obj; // Circular reference

console.log(safeStringify(obj));
// Output: {"name":"Graph","self":"[Circular]"}

// Handles BigInt, Map, Set, Error
const payload = {
  id: 9007199254740993n,
  tags: new Set(['tech', 'dev']),
  data: new Map([['k', 'v']]),
};
console.log(safeStringify(payload, 2));
```

### 3. `json-formatter`
```typescript
import { formatJson } from '@omnidev-tools/json-structured-data/formatter';

// Deterministic key sorting (ideal for git diffs and checksums)
const formatted = formatJson(payload, {
  indent: 2,
  sortKeys: true,
  color: true, // ANSI colors for terminal display
});
console.log(formatted);
```

### 4. `json-minify`
```typescript
import { minifyJson } from '@omnidev-tools/json-structured-data/minify';

const compact = minifyJson(`{
  "title": "Minified JSON",
  "items": [1, 2, 3]
}`);
// Output: {"title":"Minified JSON","items":[1,2,3]}
```

### 5. `json-validator`
```typescript
import { validateJson, isValidJson } from '@omnidev-tools/json-structured-data/validator';

const result = validateJson('{\n  "age": 30,\n}');
if (!result.valid) {
  console.log(`Error at line ${result.error.line}, col ${result.error.column}:`);
  console.log(result.error.snippet);
  // 1 | {
  // 2 |   "age": 30,
  // 3 | }
  //     ^
}
```

### 6. `json-diff`
```typescript
import { diffJson, formatDiff } from '@omnidev-tools/json-structured-data/diff';

const diff = diffJson(
  { env: 'dev', port: 3000, active: true },
  { env: 'prod', port: 8080 }
);

console.log(diff.hasChanges); // true
console.log(formatDiff(diff, { color: true }));
// - active: true
// ~ env: "dev" => "prod"
// ~ port: 3000 => 8080
// Summary: +0 added, -1 removed, ~2 modified (3 total)
```

### 7. `json-flatten` & `json-unflatten`
```typescript
import { flattenJson } from '@omnidev-tools/json-structured-data/flatten';
import { unflattenJson } from '@omnidev-tools/json-structured-data/unflatten';

const flat = flattenJson({
  user: { profile: { name: 'Alice' }, tags: ['admin', 'dev'] }
});
// Result:
// {
//   "user.profile.name": "Alice",
//   "user.tags.0": "admin",
//   "user.tags.1": "dev"
// }

// Reconstruct with prototype pollution safety
const original = unflattenJson(flat);
```

### 8. `json-path`
```typescript
import { getPath, setPath, hasPath, deletePath } from '@omnidev-tools/json-structured-data/path';

const store = { users: [{ id: 1, name: 'Alice' }] };

// Safe nested read
const name = getPath(store, 'users[0].name'); // "Alice"
const fallback = getPath(store, 'users[10].name', 'Anonymous'); // "Anonymous"

// Safe nested write (mutable or immutable)
const updated = setPath(store, 'users[0].role', 'Admin', { immutable: true });
```

---

## 💻 CLI Tools

Run via `npx` or install globally (`npm install -g @omnidev-tools/json-structured-data`):

```bash
# Pretty-print
json-tools format data.json --indent=4 --sort-keys --color
json-format data.json

# Minify
json-tools minify data.json > minified.json
json-minify data.json

# Validate
json-tools validate data.json
json-validate data.json

# Structural Diff
json-tools diff config.dev.json config.prod.json --color
json-diff config.dev.json config.prod.json

# Flatten & Unflatten
json-tools flatten nested.json
json-tools unflatten flat.json

# Query Path
json-tools path data.json "users[0].profile.name"

# Stdin Piping
cat data.json | json-tools minify
cat invalid.json | json-tools validate

# Print Version
json-tools --version
json-tools -v
```

---

## 📚 Detailed Documentation

Dive deeper into our dedicated architecture and operational sub-documents:
- [Architecture & Design Decisions](docs/ARCHITECTURE.md)
- [Installation & Runtime Support](docs/INSTALLATION.md)
- [Features & API Reference](docs/FEATURES.md)
- [Limitations & Operational Boundaries](docs/LIMITATIONS.md)
- [Testing Strategy & Test Cases](docs/TESTING.md)
- [Deployment, Version Bumping & CI/CD](docs/DEPLOYMENT.md)

---

## 🚦 NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run build` | `tsup` | Build ESM, CommonJS, and DTS bundles |
| `npm test` | `vitest run` | Run the complete 80-test unit test suite |
| `npm run test:watch` | `vitest` | Run tests in interactive watch mode |
| `npm run test:coverage` | `vitest run --coverage` | Generate V8 coverage report |
| `npm run typecheck` | `tsc --noEmit` | Strict static type validation |
| `npm run bump:patch` | `npm version patch` | Bump patch version and create Git tag |
| `npm run bump:minor` | `npm version minor` | Bump minor version and create Git tag |
| `npm run bump:major` | `npm version major` | Bump major version and create Git tag |
| `npm run publish:dry` | `npm publish --dry-run` | Inspect packaged tarball before shipping |

---

## 🛡 Security

All path accessors and unflattening operations contain strict guards against prototype pollution attacks, preventing unwanted mutation of `Object.prototype`:
- `__proto__` is dropped and blocked from property traversal.
- `constructor` and `prototype` property mutations are safely rejected.

---

## 📄 License

[MIT](LICENSE) © 2026 OmniDev Tools
