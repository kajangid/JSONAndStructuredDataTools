export interface MinifyJsonOptions {
  /**
   * Whether to strictly validate the JSON syntax during minification. Default: true
   */
  validate?: boolean;
}

/**
 * Minifies a JSON string or object by stripping all extraneous whitespace
 * while strictly preserving whitespace and escape sequences inside strings.
 *
 * Preserves high-precision numbers without precision loss.
 */
export function minifyJson(input: unknown, options?: MinifyJsonOptions): string {
  const shouldValidate = options?.validate !== false;

  if (typeof input !== 'string') {
    return JSON.stringify(input);
  }

  let inString = false;
  let isEscaped = false;
  let result = '';
  const len = input.length;

  for (let i = 0; i < len; i++) {
    const ch = input[i]!;

    if (inString) {
      result += ch;
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
        isEscaped = false;
        result += ch;
      } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        // Skip whitespace outside of string literals
        continue;
      } else {
        result += ch;
      }
    }
  }

  if (inString) {
    throw new SyntaxError('Unterminated string literal in JSON');
  }

  if (shouldValidate) {
    // Validate final output syntax
    JSON.parse(result);
  }

  return result;
}
