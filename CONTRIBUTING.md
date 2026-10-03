# Contributing to @kjangid/json-tools

Thank you for your interest in contributing to `@kjangid/json-tools`! This guide explains how to set up your local development environment, run the test suite, and submit contributions.

---

## Architectural Principles

1. **Zero Runtime Dependencies**: We do not add runtime `dependencies`. Everything is built with standard ECMAScript / Node.js standard libraries.
2. **Security by Default**: All object transformations and traversals must defend against prototype pollution (`__proto__`, `constructor`, `prototype`).
3. **Isomorphic Execution**: Code must work identically across Node.js (>=18), modern browsers, and edge workers.
4. **100% Test Coverage**: Every feature, bug fix, or edge case must include runnable Vitest test cases.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: `>=18.0.0`
- **npm**: `>=8.0.0`

### 2. Clone and Install
```bash
git clone https://github.com/kajangid/JSONAndStructuredDataTools.git
cd JSONAndStructuredDataTools
npm ci
```

---

## Development Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm test` | `vitest run` | Run all 186 unit tests once |
| `npm run test:watch` | `vitest` | Interactive watch mode during development |
| `npm run test:coverage` | `vitest run --coverage` | Generate V8 coverage report |
| `npm run typecheck` | `tsc --noEmit` | Strict TypeScript static validation |
| `npm run build` | `tsup` | Compile ESM, CJS, and `.d.ts` bundles to `dist/` |
| `npm run publish:dry` | `npm publish --dry-run` | Inspect packaged tarball contents before release |

---

## Project Structure

```text
├── src/
│   ├── index.ts               # Root library exports
│   ├── shared/                # Lexical scanner, types, and prototype security guards
│   ├── safe-parse/            # json-safe-parse
│   ├── safe-stringify/        # json-safe-stringify
│   ├── formatter/             # json-formatter
│   ├── minify/                # json-minify
│   ├── validator/             # json-validator
│   ├── diff/                  # json-diff
│   ├── flatten/               # json-flatten
│   ├── unflatten/             # json-unflatten
│   ├── path/                  # json-path
│   ├── escape/                # json-escape
│   ├── sort-keys/             # json-sort-keys
│   ├── jsonl/                 # jsonl / NDJSON
│   ├── merge/                 # json-merge
│   ├── repair/                # json-repair
│   ├── view/                  # json-view
│   ├── patch/                 # json-patch (RFC 6902)
│   ├── jsonpath/              # jsonpath-test (RFC 9535)
│   ├── schema-generate/       # json-schema-generate (Draft-07)
│   ├── schema-validate/       # json-schema-validate (Draft-07)
│   └── bin/                   # Unified CLI runner and aliases
├── docs/                      # Technical guides & architectural documentation
└── tsup.config.ts             # Multi-entry bundling configuration
```

---

## Pull Request Checklist

Before opening a pull request, ensure:
1. `npm run typecheck` passes with zero errors.
2. `npm test` passes with 100% pass rate.
3. `npm run build` succeeds and emits clean bundles.
4. No new dependencies were added to `"dependencies"` in `package.json`.
5. Related documentation in `README.md` and `docs/` is updated.

---

## Release Process

Releases are published automatically via GitHub Actions and npm Trusted Publishing (OIDC) when a version tag is pushed:
See [docs/DEPLOYMENT.md](https://github.com/kajangid/JSONAndStructuredDataTools/blob/master/docs/DEPLOYMENT.md) for details.
