# Installation & Setup Guide: @omnidev-tools/json-structured-data

## 1. System Requirements

- **Node.js**: `v18.0.0` or higher
- **Package Managers**: `npm` (>= 8), `pnpm` (>= 8), `yarn` (>= 1.22 or Berry), or `bun` (>= 1.0)
- **Browsers**: All modern browsers supporting ECMAScript 2022+ (Chrome, Firefox, Safari, Edge)
- **Runtimes**: Node.js, Deno, Bun, Cloudflare Workers, Electron

---

## 2. Package Installation

Install via your preferred package manager:

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

## 3. Global Installation for CLI Usage

To use the standalone CLI tools (`json-tools`, `json-format`, `json-minify`, `json-validate`, `json-diff`, `json-flatten`, `json-unflatten`, `json-path`) globally in your terminal:

```bash
# Global install with npm
npm install -g @omnidev-tools/json-structured-data

# Or execute on-demand without installation using npx
npx @omnidev-tools/json-structured-data --help
npx @omnidev-tools/json-structured-data validate package.json
npx @omnidev-tools/json-structured-data format input.json --sort-keys
```

---

## 4. Import Patterns

### 4.1 All-in-One Root Import
Import any function directly from the root namespace:

```typescript
import {
  safeParse,
  safeStringify,
  formatJson,
  minifyJson,
  validateJson,
  diffJson,
  flattenJson,
  unflattenJson,
  getPath,
  setPath
} from '@omnidev-tools/json-structured-data';
```

### 4.2 Modular Subpath Imports (Optimized Tree-Shaking)
For micro-frontends, serverless lambdas, or bundle-sensitive client applications, import only what you need:

```typescript
// Only loads ~350 bytes of safeParse code
import { safeParse } from '@omnidev-tools/json-structured-data/safe-parse';

// Only loads safeStringify
import { safeStringify } from '@omnidev-tools/json-structured-data/safe-stringify';

// Only loads formatter
import { formatJson } from '@omnidev-tools/json-structured-data/formatter';

// Only loads minify
import { minifyJson } from '@omnidev-tools/json-structured-data/minify';

// Only loads validator
import { validateJson } from '@omnidev-tools/json-structured-data/validator';

// Only loads diff engine
import { diffJson } from '@omnidev-tools/json-structured-data/diff';

// Only loads flatten
import { flattenJson } from '@omnidev-tools/json-structured-data/flatten';

// Only loads unflatten
import { unflattenJson } from '@omnidev-tools/json-structured-data/unflatten';

// Only loads json-path accessor
import { getPath, setPath } from '@omnidev-tools/json-structured-data/path';
```

### 4.3 CommonJS Support
Native CommonJS environments (`require`) are fully supported out-of-the-box:

```javascript
const { safeParse, formatJson } = require('@omnidev-tools/json-structured-data');
// Or subpath
const { validateJson } = require('@omnidev-tools/json-structured-data/validator');
```

---

## 5. TypeScript Configuration
This package ships with generated `.d.ts` and `.d.cts` declarations. Ensure your `tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16" / "nodenext"
    "target": "ES2022"
  }
}
```
