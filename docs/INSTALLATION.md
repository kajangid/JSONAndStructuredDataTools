# Installation & Setup Guide: @kjangid/json-tools

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
npm install @kjangid/json-tools

# pnpm
pnpm add @kjangid/json-tools

# yarn
yarn add @kjangid/json-tools

# bun
bun add @kjangid/json-tools
```

---

## 3. Global Installation for CLI Usage

To use the standalone CLI tools (`json-tools`, `json-format`, `json-minify`, `json-validate`, `json-diff`, `json-flatten`, `json-unflatten`, `json-path`, `json-escape`, `json-sort-keys`, `jsonl`, `json-merge`, `json-repair`, `json-view`, `json-patch`, `jsonpath-test`) globally in your terminal:

```bash
# Global install with npm
npm install -g @kjangid/json-tools

# Or execute on-demand without installation using npx
npx @kjangid/json-tools --help
npx @kjangid/json-tools --version
npx @kjangid/json-tools validate package.json
npx @kjangid/json-tools format input.json --sort-keys
npx @kjangid/json-tools repair broken.json
npx @kjangid/json-tools patch create doc1.json doc2.json
npx @kjangid/json-tools jsonpath store.json "$.books[*].title"
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
  setPath,
  escapeJsonString,
  unescapeJsonString,
  sortKeys,
  parseJsonl,
  mergeJson,
  repairJson,
  renderJsonTree,
  createPatch,
  applyPatch,
  queryJsonPath,
  testJsonPath,
  VERSION,
} from '@kjangid/json-tools';
```

### 4.2 Modular Subpath Imports (Optimized Tree-Shaking)
For micro-frontends, serverless lambdas, or bundle-sensitive client applications, import only what you need:

```typescript
// Only loads ~350 bytes of safeParse code
import { safeParse } from '@kjangid/json-tools/safe-parse';

// Only loads safeStringify
import { safeStringify } from '@kjangid/json-tools/safe-stringify';

// Only loads formatter
import { formatJson } from '@kjangid/json-tools/formatter';

// Only loads minify
import { minifyJson } from '@kjangid/json-tools/minify';

// Only loads validator
import { validateJson } from '@kjangid/json-tools/validator';

// Only loads diff engine
import { diffJson } from '@kjangid/json-tools/diff';

// Only loads flatten
import { flattenJson } from '@kjangid/json-tools/flatten';

// Only loads unflatten
import { unflattenJson } from '@kjangid/json-tools/unflatten';

// Only loads json-path accessor
import { getPath, setPath } from '@kjangid/json-tools/path';

// Only loads string escape / unescape
import { escapeJsonString, unescapeJsonString } from '@kjangid/json-tools/escape';

// Only loads sort-keys
import { sortKeys, sortKeysJson } from '@kjangid/json-tools/sort-keys';

// Only loads jsonl parser & stringifier
import { parseJsonl, stringifyJsonl } from '@kjangid/json-tools/jsonl';

// Only loads deep merge
import { mergeJson, mergeJsonWithOptions } from '@kjangid/json-tools/merge';

// Only loads repair
import { repairJson, safeRepairJson } from '@kjangid/json-tools/repair';

// Only loads tree view
import { renderJsonTree } from '@kjangid/json-tools/view';

// Only loads RFC 6902 patch
import { createPatch, applyPatch } from '@kjangid/json-tools/patch';

// Only loads RFC 9535 JSONPath evaluator
import { queryJsonPath, testJsonPath } from '@kjangid/json-tools/jsonpath';
```

### 4.3 CommonJS Support
Native CommonJS environments (`require`) are fully supported out-of-the-box:

```javascript
const { safeParse, formatJson } = require('@kjangid/json-tools');
// Or subpath
const { validateJson } = require('@kjangid/json-tools/validator');
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
