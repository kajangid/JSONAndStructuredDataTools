# Deployment & Publishing Guide: @kjangid/json-tools

Comprehensive guide for version management, continuous integration, GitHub Actions release automation with npm Trusted Publishing (OIDC), and package verification.

---

## 1. Version Management (Single Source of Truth)

The package version is maintained strictly in `package.json`. Source code never hardcodes the version number; `tsup` and `vitest` inject it during build and test from `package.json`.

Use standard `npm version` commands to bump the version, commit the change, and create a Git tag in a single atomic step:

```bash
# Bump patch version: 1.0.0 -> 1.0.1 (bug fixes)
npm version patch
# Or using the npm script:
npm run bump:patch

# Bump minor version: 1.0.0 -> 1.1.0 (new features, backward compatible)
npm version minor
# Or using the npm script:
npm run bump:minor

# Bump major version: 1.0.0 -> 2.0.0 (breaking changes)
npm version major
# Or using the npm script:
npm run bump:major
```

### Push the Release

Once bumped, push the version commit and newly created tag to GitHub:

```bash
git push --follow-tags
```

---

## 2. Continuous Integration Pipeline (CI)

Workflow file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Triggers on:
- Every push to `main` and `master`
- Every pull request targeting `main` and `master`

### CI Stages:
1. **Checkout**: Checks out the branch commit (`actions/checkout@v4`).
2. **Setup Node.js**: Configures Node.js 22 with dependency caching (`actions/setup-node@v4`).
3. **Clean Install**: Runs `npm ci` for deterministic dependencies.
4. **Lint / Typecheck**: Runs `npm run lint` (`tsc --noEmit`) to verify strict static typing.
5. **Test Suite**: Runs `npm test` (`vitest run`) across all unit and integration test suites.
6. **Build**: Runs `npm run build` (`tsup`) to verify clean compilation of ESM, CommonJS, and DTS bundles.

---

## 3. Automated Release & CD Pipeline (npm Trusted Publishing via OIDC)

Workflow file: [`.github/workflows/release.yml`](../.github/workflows/release.yml)

Triggers on:
- Every Git tag push matching `v*` (e.g. `v1.0.1`, `v1.1.0`, `v2.0.0`)

### Key Features:
- **Zero Secrets**: Uses npm Trusted Publishing via OpenID Connect (OIDC). No long-lived `NPM_TOKEN` or `NODE_AUTH_TOKEN` is required or stored.
- **Tag vs `package.json` Guard**: Validates that the pushed Git tag exactly matches the version declared in `package.json`. If mismatched, execution halts immediately.
- **Provenance Attestation**: Publishes with `--provenance` to generate verifiable build attestations on npmjs.com.
- **GitHub Release**: Automatically creates a GitHub Release with auto-generated changelog notes using the native `gh` CLI.

### Release Workflow Architecture:

```text
npm version <patch|minor|major>
            ↓
git push --follow-tags
            ↓
Git tag vX.Y.Z pushed to GitHub
            ↓
GitHub Actions: .github/workflows/release.yml
            ↓
1. npm ci (Node.js 22)
2. Verify tag (vX.Y.Z) == package.json (X.Y.Z)
3. npm run lint && npm test
4. npm run build
5. npm publish --access public --provenance (via OIDC)
6. gh release create vX.Y.Z --generate-notes
```

---

## 4. One-Time Setup: npm Trusted Publishing

To allow GitHub Actions to publish without static tokens:

1. **Prerequisite**: The package must exist on npmjs.com. If this is a brand new package that has never been published, perform a one-time initial manual publish:
   ```bash
   npm login
   npm publish --access public
   ```
2. Go to **[npmjs.com](https://www.npmjs.com)** and navigate to:
   - **Packages** ➔ `@kjangid/json-tools` ➔ **Settings** tab.
3. Scroll down to **Trusted Publishers** and click **Add Publisher**.
4. Select **GitHub Actions** and configure:
   - **Organization / User**: `kajangid`
   - **Repository**: `JSONAndStructuredDataTools`
   - **Workflow filename**: `release.yml`
   - **Environment**: *(leave blank)*
5. Click **Add Publisher**.

From this point forward, GitHub Actions publishes automatically and securely using short-lived OIDC tokens.

---

## 5. Pre-Publish Validation Pipeline

Before any code is published, npm automatically executes the `prepublishOnly` lifecycle hook declared in `package.json`:

```json
"prepublishOnly": "npm run typecheck && npm run test && npm run build"
```

This guarantees that:
1. TypeScript static analysis passes without errors (`tsc --noEmit`).
2. All 101 unit and integration tests pass cleanly (`vitest run`).
3. Fresh dual ESM, CommonJS, and DTS bundles are emitted into `dist/`.

---

## 6. Dry-Run Verification

Before publishing, you can inspect the exact tarball contents that npm will pack:

```bash
npm run publish:dry
```

Ensure only required distribution files are included:
- `dist/**` (ESM, CJS, DTS, sourcemaps)
- `README.md`
- `LICENSE`
- `docs/**`
- `package.json`
