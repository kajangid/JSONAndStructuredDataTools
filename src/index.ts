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
