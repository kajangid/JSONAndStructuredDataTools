/**
 * Escapes a string so it can be safely placed inside a JSON string literal.
 */
export function escapeJsonString(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }
  return JSON.stringify(input).slice(1, -1);
}

/**
 * Unescapes a JSON-escaped string literal back to its raw characters.
 */
export function unescapeJsonString(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  const trimmed = input.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      // Fall through to quote-wrapping
    }
  }

  return JSON.parse(`"${input.replace(/(?<!\\)"/g, '\\"')}"`) as string;
}
