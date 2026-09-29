# Testing Strategy & Verification: @kjangid/json-tools

Comprehensive testing guide and test suite architecture for the package.

---

## 1. Test Framework and Philosophy

The test suite is powered by **Vitest 3** with V8 code coverage. The test architecture enforces:
- **Zero Mocking of Core Logic**: All JSON transformations, validations, diffing, and path operations are tested directly against real data payloads.
- **Edge Case Coverage**: Trailing commas, unclosed strings, circular graphs, sparse arrays, and non-primitive values.
- **Security Boundary Verification**: Explicit attack vectors testing prototype pollution prevention.
- **CLI Subprocess & Integration Tests**: Testing arguments parsing, flags, file I/O, error codes, and stdout/stderr pipes.

---

## 2. Test Execution Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode during active development
npm run test:watch

# Generate V8 coverage report (terminal + HTML)
npm run test:coverage

# Static typecheck across all files
npm run typecheck
```

---

## 3. Test Suites Breakdown

| Module | Test File | Test Count | Description & Key Scenarios |
| :--- | :--- | :--- | :--- |
| **`json-safe-parse`** | `src/safe-parse/index.test.ts` | 9 | Parsing primitives, objects, multiline syntax error location, non-string safety, fallbacks, revivers |
| **`json-safe-stringify`** | `src/safe-stringify/index.test.ts` | 11 | Circular refs (direct, deep, arrays), BigInt, Map, Set, Error, RegExp, maxDepth limits, indentation |
| **`json-formatter`** | `src/formatter/index.test.ts` | 8 | 2-space, 4-space, tabs, deterministic key sorting, custom key comparators, ANSI terminal colors |
| **`json-minify`** | `src/minify/index.test.ts` | 7 | Stripping whitespace, preserving string spaces/tabs/newlines, escaped quotes, high-precision numbers |
| **`json-validator`** | `src/validator/index.test.ts` | 6 | Valid JSON, invalid JSON line/column diagnostics, caret snippets, `isValidJson`, `assertValidJson` |
| **`json-diff`** | `src/diff/index.test.ts` | 6 | Identity match, additions, removals, modifications, nested objects, array indices, terminal diff format |
| **`json-flatten`** | `src/flatten/index.test.ts` | 7 | Dot notation, custom delimiters, array index flattening, leaf arrays, maxDepth, empty objects/arrays |
| **`json-unflatten`** | `src/unflatten/index.test.ts` | 6 | Nested reconstruction, array inference, top-level arrays, prototype pollution defense, round-trip test |
| **`json-path`** | `src/path/index.test.ts` | 13 | Path parsing, safe retrieval, missing fallbacks, falsy value retention, prototype guard, mutable/immutable set/delete |
| **`json-escape`** | `src/escape/index.test.ts` | 6 | Escaping quotes/newlines/unicode, unescaping literals, round-trip fidelity, type guards |
| **`json-sort-keys`** | `src/sort-keys/index.test.ts` | 8 | Shallow/deep sorting, custom comparator, array preservation, prototype guard, sortKeysJson |
| **`jsonl`** | `src/jsonl/index.test.ts` | 8 | Valid JSONL parse, blank line skipping, line syntax error reports, maxRecords, stringify, summary |
| **`json-merge`** | `src/merge/index.test.ts` | 8 | Deep merging, array modes (replace, concat, union), prototype pollution guard, multi-source merging |
| **`json-repair`** | `src/repair/index.test.ts` | 8 | Trailing commas, single quotes, unquoted keys, line/block comments, auto-balancing brackets, safeRepairJson |
| **`json-view`** | `src/view/index.test.ts` | 6 | Box-drawing tree rendering, maxDepth truncation, ANSI terminal color toggles, root labels |
| **`json-patch`** | `src/patch/index.test.ts` | 8 | Pointer escaping, patch generation (objects, arrays), apply (add, remove, replace, move, copy, test), prototype defense |
| **`jsonpath-test`** | `src/jsonpath/index.test.ts` | 10 | Dot & bracket queries, indices, negative offsets, slicing, wildcards, recursive descent, unions, compiled queries, testJsonPath |
| **`shared/security`** | `src/shared/security.test.ts` | 6 | Prototype pollution keys, safe property checking, null-prototype objects |
| **`shared/parser`** | `src/shared/parser.test.ts` | 11 | Line/column calculations, visual caret error snippets, native message extraction, fallback scanner |
| **`root entrypoint`** | `src/index.test.ts` | 2 | Package export verification, end-to-end integration workflows across all utilities |
| **`version constant`** | `src/version.test.ts` | 1 | Dynamic package.json version synchronization validation |
| **`CLI Executable`** | `src/bin/cli.test.ts` | 16 | `--version`, `-v`, `--help`, `format`, `minify`, `validate`, `diff`, `flatten`, `unflatten`, `path`, `escape`, `sort-keys`, `jsonl`, `merge`, `repair`, `view`, `patch`, `jsonpath` |
| **Total** | **22 files** | **171 tests** | **100% Pass Rate** |

---

## 4. Key Security Test Cases

### Prototype Pollution Defense in `unflattenJson`
```typescript
it('prevents prototype pollution attacks', () => {
  const malicious = {
    '__proto__.polluted': 'yes',
    'constructor.prototype.polluted': 'yes',
  };

  unflattenJson(malicious);

  expect((Object.prototype as any).polluted).toBeUndefined();
  expect(({} as any).polluted).toBeUndefined();
});
```

### Prototype Pollution Defense in `setPath`
```typescript
it('guards against prototype pollution attacks on setPath', () => {
  const target: any = {};
  setPath(target, '__proto__.hacked', 'yes');
  setPath(target, 'constructor.prototype.hacked', 'yes');

  expect((Object.prototype as any).hacked).toBeUndefined();
  expect(({} as any).hacked).toBeUndefined();
});
```
