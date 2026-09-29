// 1. json-safe-parse
export {
  safeParse,
  safeParseOrDefault,
  extractErrorPosition,
  type SafeParseOptions,
  type SafeParseResult,
  type SafeParseSuccess,
  type SafeParseFailure,
  type ErrorPosition,
} from './safe-parse/index';

// 2. json-safe-stringify
export {
  safeStringify,
  type SafeStringifyOptions,
  type Replacer,
  type ReplacerFunction,
} from './safe-stringify/index';

// 3. json-formatter
export {
  formatJson,
  colorizeJson,
  type FormatJsonOptions,
} from './formatter/index';

// 4. json-minify
export {
  minifyJson,
  type MinifyJsonOptions,
} from './minify/index';

// 5. json-validator
export {
  validateJson,
  isValidJson,
  assertValidJson,
  type ValidateJsonOptions,
  type ValidationResult,
  type ValidationSuccess,
  type ValidationFailure,
  type ValidationError,
} from './validator/index';

// 6. json-diff
export {
  diffJson,
  formatDiff,
  type DiffEntry,
  type DiffType,
  type DiffSummary,
  type JsonDiffResult,
  type DiffOptions,
  type FormatDiffOptions,
} from './diff/index';

// 7. json-flatten
export {
  flattenJson,
  type FlattenOptions,
} from './flatten/index';

// 8. json-unflatten
export {
  unflattenJson,
  type UnflattenOptions,
} from './unflatten/index';

// 9. json-path
export {
  getPath,
  setPath,
  hasPath,
  deletePath,
  parsePath,
  type PathInput,
  type PathSegment,
  type PathOptions,
} from './path/index';

// 10. json-escape
export {
  escapeJsonString,
  unescapeJsonString,
} from './escape/index';

// 11. json-sort-keys
export {
  sortKeys,
  sortKeysJson,
  type SortKeysOptions,
  type SortKeysJsonOptions,
} from './sort-keys/index';

// 12. jsonl
export {
  parseJsonl,
  stringifyJsonl,
  formatJsonlSummary,
  type JsonlParseResult,
  type JsonlParseOptions,
  type JsonlError,
} from './jsonl/index';

// 13. json-merge
export {
  mergeJson,
  mergeJsonWithOptions,
  type MergeJsonOptions,
} from './merge/index';

// 14. json-repair
export {
  repairJson,
  safeRepairJson,
  type SafeRepairResult,
} from './repair/index';

// 15. json-view
export {
  renderJsonTree,
  type RenderJsonTreeOptions,
} from './view/index';

// 16. json-patch
export {
  createPatch,
  applyPatch,
  safeApplyPatch,
  applyOperation,
  escapeJsonPointer,
  unescapeJsonPointer,
  parseJsonPointer,
  compileJsonPointer,
  JsonPatchError,
  type JsonPatchOp,
  type JsonPatchOperation,
  type ApplyPatchOptions,
  type SafeApplyPatchResult,
} from './patch/index';

// 17. jsonpath-test
export {
  queryJsonPath,
  testJsonPath,
  compileJsonPath,
  parseJsonPath,
  type JsonPathStep,
} from './jsonpath/index';

// 18. json-schema-generate
export {
  generateSchema,
  generateSchemaJson,
  type JsonSchema,
  type GenerateSchemaOptions,
} from './schema-generate/index';

// 19. json-schema-validate
export {
  validateSchema,
  isValidSchema,
  assertValidSchema,
  type SchemaValidationError,
  type SchemaValidationResult,
} from './schema-validate/index';

// Shared types and utilities
export {
  type JsonValue,
  type JsonPrimitive,
  type JsonObject,
  type JsonArray,
} from './shared/types';
export {
  isUnsafePropertyKey,
  hasOwn,
  createSafeRecord,
} from './shared/security';

// Package version
export { VERSION } from './version';

