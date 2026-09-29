# Package Architecture: @kjangid/json-tools

## 1. Overview and Core Philosophy

`@kjangid/json-tools` is an enterprise-grade, isomorphic, zero-runtime-dependency TypeScript library and CLI toolset designed for safe, deterministic, and high-performance manipulation of JSON and structured data.

### Core Architectural Principles
1. **Zero Runtime Dependencies**: Every utility is built from foundational algorithms without pulling in third-party runtime code. This ensures zero supply-chain risk, instant cold starts, and minimal bundle footprint.
2. **Security by Default**: Strict prototype pollution defense blocks malicious keys (`__proto__`, `constructor`, `prototype`) across all deep traversal and unflattening paths.
3. **Isomorphic Compatibility**: Operates seamlessly in Node.js (>=18), modern browsers, Cloudflare Workers, Deno, and Bun.
4. **Dual Module Output**: Full ESM (`.mjs`) and CommonJS (`.cjs`) support with precise TypeScript `.d.ts` declaration maps.
5. **Granular Tree-Shaking**: Every utility is exposed as an isolated subpath import (`@kjangid/json-tools/safe-parse`), allowing bundlers to package only the exact code used.

---

## 2. Directory and Module Organization

```text
├── package.json               # Package manifests, exports map, CLI definitions
├── tsconfig.json              # Strict TypeScript compiler options
├── tsup.config.ts             # ESM, CJS, and DTS bundling
├── vitest.config.ts           # Vitest unit test & coverage runner
├── docs/                      # Dedicated architectural & usage documentation
└── src/
    ├── index.ts               # Primary bundle re-exporting all tools
    ├── index.test.ts          # Root entrypoint & integration test suite
    ├── shared/
    │   ├── types.ts           # JSON primitives and generic types
    │   ├── security.ts        # Prototype pollution guards and safe record factories
    │   ├── security.test.ts   # Security & prototype pollution unit tests
    │   ├── parser.ts          # Lexical scanner & syntax error position locator
    │   └── parser.test.ts     # Parser diagnostics & error coordinate tests
    ├── safe-parse/            # json-safe-parse implementation & unit tests
    ├── safe-stringify/        # json-safe-stringify implementation & unit tests
    ├── formatter/             # json-formatter implementation & unit tests
    ├── minify/                # json-minify implementation & unit tests
    ├── validator/             # json-validator implementation & unit tests
    ├── diff/                  # json-diff implementation & unit tests
    ├── flatten/               # json-flatten implementation & unit tests
    ├── unflatten/             # json-unflatten implementation & unit tests
    ├── path/                  # json-path implementation & unit tests
    ├── escape/                # json-escape implementation & unit tests
    ├── sort-keys/             # json-sort-keys implementation & unit tests
    ├── jsonl/                 # jsonl implementation & unit tests
    ├── merge/                 # json-merge implementation & unit tests
    ├── repair/                # json-repair implementation & unit tests
    ├── view/                  # json-view implementation & unit tests
    ├── patch/                 # json-patch implementation & unit tests
    ├── jsonpath/              # jsonpath-test implementation & unit tests
    ├── schema-generate/       # json-schema-generate implementation & unit tests
    ├── schema-validate/       # json-schema-validate implementation & unit tests
    ├── version.ts             # Compile-time package version synchronization
    ├── version.test.ts        # Version synchronization unit test
    └── bin/
        ├── cli.ts             # CLI command runner & argument parser
        └── cli.test.ts        # CLI integration test suite
```

---

## 3. Subsystem Architecture

### 3.1 Lexical Scanner & Diagnostic Parser (`shared/parser.ts`)
Standard V8 and browser `JSON.parse` implementations provide varying error messages across versions. In newer V8 engines, syntax errors frequently omit explicit line and column coordinates.

The internal diagnostic scanner performs character-level lexical analysis when an error occurs:
1. It scans tokens (strings, numbers, booleans, arrays, objects) up to the failure point.
2. It calculates the exact 1-indexed line and column offset.
3. It constructs an ASCII context snippet with an arrow indicator (`^`) pointing directly to the offending character.

### 3.2 Security Layer (`shared/security.ts`)
Object reconstruction, deep merging, and deep property setting are common vectors for Prototype Pollution attacks. The security layer enforces:
- Explicit blacklisting of `__proto__`, `prototype`, and `constructor`.
- Prototype pollution guards inside `unflattenJson`, `setPath`, `mergeJson`, and `applyPatch`.
- Clean prototype-free dictionary creation (`Object.create(null)`).

### 3.3 Circular Reference & Type Transform Engine (`safe-stringify`)
Uses a `Set` traversal tracker:
- When an object reference is encountered that is already in the active ancestor stack, it substitutes the reference with `[Circular]` (or user-defined placeholder).
- Automatically converts non-JSON primitive types (`BigInt`, `Map`, `Set`, `Error`, `RegExp`) into standard JSON representations.
- Enforces a recursion limit (`maxDepth`) to protect against stack overflows in pathological object graphs.

### 3.4 Deep Structural Diff Engine (`diff`)
Recursively explores both left and right objects/arrays:
- Distinguishes between additions, removals, and modifications.
- Produces normalized path strings conforming to JavaScript property access notation (e.g. `users[2].address.city`).

### 3.5 Deep Merge Engine (`merge`)
Merges multiple objects recursively with configurable array strategies (`replace`, `concat`, `union`):
- Defends against prototype poisoning by skipping harmful keys during both object cloning and recursive key assignment.
- Deep clones all inputs to prevent mutation of the original source objects.

### 3.6 Heuristic Repair Engine (`repair`)
Multi-pass scanner and string regularizer:
- Strips `//` line comments and `/* */` block comments outside string literals.
- Normalizes single-quoted strings into valid JSON double quotes with escape handling.
- Quotes bare identifier keys (`{ key: "val" }` -> `{ "key": "val" }`).
- Removes trailing commas before `}` and `]`.
- Auto-balances missing closing brackets using a token stack tracker.

### 3.7 Tree Visualizer (`view`)
Transforms complex JSON graphs into Unicode/ASCII box-drawing hierarchies (`├──`, `└──`, `│   `):
- Traverses nested objects and arrays recursively with configurable `maxDepth` truncation.
- Applies optional terminal ANSI color codes for keys, strings, numbers, booleans, and nulls.

### 3.8 RFC 6902 JSON Patch Engine (`patch`)
Generates and sequentially executes standard RFC 6902 patch operations (`add`, `remove`, `replace`, `move`, `copy`, `test`):
- Uses RFC 6901 JSON Pointer escaping (`~0` for `~`, `~1` for `/`).
- Enforces strict prototype pollution blocking across all JSON Pointer traversals.
- Implements both throwing `applyPatch` and non-throwing diagnostic `safeApplyPatch`.

### 3.9 RFC 9535 JSONPath Evaluator (`jsonpath`)
Pure-JavaScript evaluator compiling and executing JSONPath queries without runtime code generation:
- Supports root `$`, dot child notation (`.prop`), quoted/unquoted bracket notation (`['prop']`), index notation with negative offsets (`[-1]`), slices (`[start:end]`), wildcards (`*`), and recursive descent (`..prop`).
- Features a compiled query caching pattern (`compileJsonPath`) for high-performance repeated queries.

### 3.10 Schema Inference Engine (`schema-generate`)
Infers standard Draft-07 JSON Schemas from representative sample documents:
- Analyzes structural types: `null`, `boolean`, `integer`, `number`, `string`, `array`, and `object`.
- Resolves polymorphic array element types into type unions (`type: ['string', 'number']`).
- Uses `createSafeRecord()` for schema `properties` dictionaries to protect against prototype tampering.
- Supports configurable `$schema`, `title`, `description`, and `requiredAll` settings.

### 3.11 In-Memory Draft-07 Schema Validator (`schema-validate`)
Zero-dependency, synchronous JSON Schema Draft-07 rule evaluator:
- Validates data types, required object properties, and `additionalProperties` constraints.
- Validates numerical bounds (`minimum`, `maximum`), string lengths and regular expressions (`minLength`, `maxLength`, `pattern`).
- Validates array structures (`items`, `minItems`, `maxItems`, `uniqueItems`) and enum membership (`enum`).
- Produces normalized diagnostics (`ValidationError[]`) with exact property paths and violated constraint rules.

### 3.12 Version Synchronization & Single Source of Truth (`version.ts`)
The package version is maintained strictly in `package.json`:
- `tsup.config.ts` and `vitest.config.ts` dynamically read `package.json` at build and test time, injecting `__PACKAGE_VERSION__`.
- The CLI (`src/bin/cli.ts`) and root library exports (`src/index.ts`) consume `VERSION` directly, eliminating any manual file edits when bumping versions.

---

## 4. Build and Distribution Pipeline

```mermaid
flowchart LR
    Source["TypeScript Source (src/)"] --> Tsup["tsup Bundler"]
    Tsup --> ESM["ESM Output (dist/**/*.mjs)"]
    Tsup --> CJS["CommonJS Output (dist/**/*.cjs)"]
    Tsup --> DTS["Type Definitions (dist/**/*.d.ts)"]
    Tsup --> CLI["CLI Executables (dist/bin/cli.cjs)"]
```

The build process uses `tsup` (backed by `esbuild`) to simultaneously emit:
1. **ESM Modules** for modern bundlers (Vite, Rollup, Webpack 5, Next.js).
2. **CommonJS Modules** for legacy Node.js environments.
3. **Type Declaration Maps** for full IDE autocompletion and type validation.
