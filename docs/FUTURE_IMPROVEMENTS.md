# Future Improvements & Deferred Enhancements: @kjangid/json-tools

This document tracks deliberate simplifications, architectural deferrals, and future upgrade paths for `@kjangid/json-tools`.

Guided by the **Ponytail (lazy senior developer)** principle:
- Build the simplest solution that works today (stdlib first, reuse existing primitives, zero dependencies).
- Avoid speculative complexity.
- Document known performance ceilings and explicit upgrade triggers before writing additional code.

---

## 1. Extension Tools Suite (Phases 1–4)

### 1.1 `json-escape` (Phase 1)
- **Current Architecture**: Native `JSON.stringify().slice(1, -1)` and `JSON.parse` with quote-wrapping. Zero custom lexer.
- **Skipped / Deferred**:
  - Non-standard ECMAScript escape sequences (vertical tab `\v`, null byte `\0`, octal `\123`, hex byte `\xHH`).
  - Contextual escaping for non-JSON targets (e.g. SQL string literals, GraphQL queries, HTML attributes).
- **Upgrade Trigger**:
  - Implement a dedicated character-by-character scanner only if consumers report needing non-standard ECMAScript escape support or multi-dialect escaping.

### 1.2 `json-sort-keys` (Phase 1)
- **Current Architecture**: Reusable recursive key sorter using `Object.keys()` and `String.prototype.localeCompare`. Prototype-safe key filtering.
- **Skipped / Deferred**:
  - In-place mutation sort (creates a fresh object to maintain purity).
  - Array element sorting (arrays represent ordered lists; sorting elements corrupts data semantics).
  - Locale-sensitive custom collation tables (e.g. German umlauts, Swedish collation).
- **Upgrade Trigger**:
  - Expose an `Intl.Collator` option if internationalized sorting becomes a requirement for consumer applications.

### 1.3 `jsonl` (Phase 1)
- **Current Architecture**: In-memory newline splitter with line-indexed error reporting and summary formatting.
- **Skipped / Deferred**:
  - Node.js `stream.Transform` and WHATWG Web Streams chunking for multi-gigabyte log files.
  - Asynchronous generator parser (`for await (const record of parseJsonlStream(stream))`).
- **Upgrade Trigger**:
  - Add `parseJsonlStream()` when consumers need to ingest multi-gigabyte NDJSON log dumps exceeding available V8 heap RAM (>1.5 GB).

---

### 1.4 `json-merge` (Phase 2 - Implemented)
- **Current Architecture**: Recursive object merger with prototype pollution defense (`isUnsafePropertyKey`) and configurable array resolution (`'replace' | 'concat' | 'union'`). Deep-clones inputs to avoid mutating originals.
- **Skipped / Deferred**:
  - RFC 7396 (JSON Merge Patch) strict compliance mode (null-as-delete semantics).
  - Custom field-level merge resolvers `(targetVal, sourceVal, keyPath) => resolvedVal`.
  - Merging nested array items by object ID.
- **Upgrade Trigger**:
  - Add an RFC 7396 compliant mode or custom conflict callbacks if consumer workflows require fine-grained domain-specific conflict resolution or null-deletion semantics.

### 1.5 `json-repair` (Phase 2 - Implemented)
- **Current Architecture**: Multi-pass character scanner and string regularizer. Strips `//` and `/* */` comments without breaking URLs inside strings, normalizes single quotes to double quotes, quotes bare identifier keys, strips trailing commas, and auto-balances open brackets/braces via token stack.
- **Skipped / Deferred**:
  - Full fault-tolerant PEG/Lezer grammar parser.
  - Auto-correcting heavily mismatched or interleaved syntax (e.g. `{"a": [}`).
- **Upgrade Trigger**:
  - Migrate from character regularizers to a full token-stream state machine only if malformed JSON repair success falls below 98% in production payloads.

### 1.6 `json-view` (Phase 2 - Implemented)
- **Current Architecture**: Unicode/ASCII box-drawing tree renderer (`├──`, `└──`, `│   `) with `maxDepth` truncation, typed node annotations (`(Array[N])`, `(Object)`), and ANSI terminal color highlighting. Zero heavy terminal UI dependencies.
- **Skipped / Deferred**:
  - Interactive terminal TUI with keyboard-driven node collapse/expansion (blessed/ink).
- **Upgrade Trigger**:
  - Add an interactive readline-based expander only if CLI power users demand terminal navigation without external tools like `jq` or `fx`.

---

### 1.7 `json-patch` (Phase 3 - Implemented)
- **Current Architecture**: Generates RFC 6902 patch arrays (`add`, `remove`, `replace`) with reverse-ordered array removals to preserve indices. Fully applies `add`, `remove`, `replace`, `move`, `copy`, `test` with RFC 6901 JSON pointer escaping and prototype pollution protection.
- **Skipped / Deferred**:
  - Automatic synthesis of `move` and `copy` operations from diffs using a Graph-based Longest Common Subsequence (LCS) matrix.
- **Upgrade Trigger**:
  - Implement `move`/`copy` heuristics only if payload size benchmarks prove that diffing large array reorderings creates unacceptable patch file sizes.

### 1.8 `jsonpath-test` (Phase 3 - Implemented)
- **Current Architecture**: Evaluates RFC 9535 queries supporting root `$`, dot child notation, bracket strings, integer indices with negative offsets, slices (`[start:end]`), wildcards (`*`), unions (`[a, b]`), and recursive descent (`..prop`). Pre-compiles steps via `compileJsonPath`. Zero dependencies, zero `eval()`.
- **Skipped / Deferred**:
  - Arbitrary script expressions (`[?(@.price < 10)]`) and custom regex predicates.
- **Upgrade Trigger**:
  - Add a sandboxed expression evaluator if filter predicates are required without introducing security risks or `eval()`.

---

### 1.9 `json-schema-generate` (Phase 4)
- **Planned Architecture**: Recursive type inferrer generating Draft-07 schemas (`type`, `properties`, `required`, `items`).
- **Skipped / Deferred**:
  - Union type inference (`anyOf`), pattern format detection (UUID, email, ISO date-time), and automated enum deduction.
- **Upgrade Trigger**:
  - Add heuristic format matchers if users require automated API contract generation from dynamic responses.

### 1.10 `json-schema-validate` (Phase 4)
- **Planned Architecture**: Synchronous, in-memory validator verifying core schema constraints (`type`, `properties`, `required`, `items`, `enum`, `minimum`, `maximum`, `minLength`, `pattern`).
- **Skipped / Deferred**:
  - JIT dynamic code compilation (Ajv style).
  - Remote `$ref` network dereferencing.
- **Upgrade Trigger**:
  - Implement schema pre-compilation only if validation throughput benchmarks require >100,000 validations per second.

---

## 2. Core Utilities (Original 9 Tools)

### 2.1 Streaming Pipelines (`safe-parse`, `validator`, `minify`)
- **Current State**: Synchronous in-memory processing optimized for payloads up to tens of megabytes.
- **Future Improvement**: Expose Node.js and Web Streams (`TransformStream`) to format, minify, or validate multi-gigabyte files with constant memory consumption.

### 2.2 Array Diffing Optimization (`diff`)
- **Current State**: Compares array elements index-by-index (`array[0]`, `array[1]`).
- **Future Improvement**: Implement Myers / Levenshtein diffing for arrays when detecting item insertions/deletions in the middle of lists.

### 2.3 Browser Web Worker Offloading
- **Current State**: Synchronous execution on the main JavaScript thread.
- **Future Improvement**: Provide optional Web Worker wrappers for CPU-intensive operations (deep diffing of 50MB+ objects, schema generation) to avoid UI blocking.
