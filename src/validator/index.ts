import { locateJsonSyntaxError, createErrorSnippet } from '../shared/parser';

export interface ValidationError {
  message: string;
  line: number;
  column: number;
  index: number;
  snippet: string;
}

export interface ValidationSuccess {
  valid: true;
  error?: never;
}

export interface ValidationFailure {
  valid: false;
  error: ValidationError;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export interface ValidateJsonOptions {
  /**
   * Number of surrounding lines of context to include in the code snippet. Default: 1
   */
  maxContextLines?: number;
}

/**
 * Validates JSON syntax and reports detailed error diagnostics including line, column,
 * character index, and a caret-pointed visual code snippet.
 */
export function validateJson(
  input: unknown,
  options?: ValidateJsonOptions
): ValidationResult {
  if (typeof input !== 'string') {
    return {
      valid: false,
      error: {
        message: `Expected input to be a string, received ${input === null ? 'null' : typeof input}`,
        line: 1,
        column: 1,
        index: 0,
        snippet: '',
      },
    };
  }

  try {
    JSON.parse(input);
    return { valid: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const position = locateJsonSyntaxError(input, error);
    const snippet = createErrorSnippet(input, position.index, options?.maxContextLines ?? 1);

    return {
      valid: false,
      error: {
        message: error.message,
        line: position.line,
        column: position.column,
        index: position.index,
        snippet,
      },
    };
  }
}

/**
 * Returns true if the given input is a valid JSON string.
 */
export function isValidJson(input: unknown): boolean {
  return validateJson(input).valid;
}

/**
 * Asserts that the given input is valid JSON, throwing an error with visual snippet if invalid.
 */
export function assertValidJson(input: string, options?: ValidateJsonOptions): void {
  const result = validateJson(input, options);
  if (!result.valid) {
    const err = new SyntaxError(
      `JSON Validation Failed at line ${result.error.line}, column ${result.error.column}:\n${result.error.snippet}\n${result.error.message}`
    );
    throw err;
  }
}
