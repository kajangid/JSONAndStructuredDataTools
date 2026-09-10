# Deployment & Publishing Guide: @omnidev-tools/json-structured-data

Step-by-step instructions for version management, local verification, CI/CD automation, and publishing to the NPM registry.

---

## 1. Version Bumping Scripts

The package includes built-in scripts to bump semantic versions in `package.json` and create corresponding Git tags:

```bash
# Bump patch version: 1.0.0 -> 1.0.1 (bug fixes)
npm run bump:patch

# Bump minor version: 1.0.0 -> 1.1.0 (new features, backward compatible)
npm run bump:minor

# Bump major version: 1.0.0 -> 2.0.0 (breaking changes)
npm run bump:major
```

> **Single Source of Truth Automation**:
> Running `npm run bump:*` only updates `package.json`. You do NOT need to edit source files. During the `prepublishOnly` build, `tsup` reads `package.json` and automatically bakes the bumped version into the compiled library and CLI binaries.

---

## 2. Pre-Publish Validation Pipeline

Before any code is published, npm automatically executes the `prepublishOnly` lifecycle hook:

```json
"prepublishOnly": "npm run typecheck && npm run test && npm run build"
```

This sequence guarantees that:
1. TypeScript strict typechecking succeeds without errors (`tsc --noEmit`).
2. All 101 unit and integration tests pass cleanly (`vitest run`).
3. Fresh dual ESM, CommonJS, and DTS bundles are emitted into `dist/`.

---

## 3. Dry-Run Verification

Before publishing to NPM, run a dry-run to inspect the exact files packaged into the tarball:

```bash
npm run publish:dry
```

Ensure only required distribution files are included:
- `dist/**` (ESM, CJS, DTS, sourcemaps)
- `README.md`
- `LICENSE`
- `docs/**`
- `package.json`

---

## 4. Manual Publishing Steps

### Step 1: Log in to NPM
```bash
npm login
```

### Step 2: Verify Package Name & Organization
Since `@omnidev-tools/json-structured-data` is a scoped package, publish with public access:

```bash
npm publish --access public
```

---

## 5. Automated CI/CD Publishing (GitHub Actions)

Create `.github/workflows/publish.yml` to automatically test, build, and publish releases upon creating a Git tag:

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'

      - name: Install Dependencies
        run: npm ci

      - name: Run Tests & Typecheck
        run: |
          npm run typecheck
          npm test

      - name: Build Package
        run: npm run build

      - name: Publish to NPM with Provenance
        run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
