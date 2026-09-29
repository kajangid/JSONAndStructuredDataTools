export interface JsonlError {
  line: number;
  error: string;
  raw: string;
}

export interface JsonlParseResult<T = unknown> {
  records: T[];
  total: number;
  validCount: number;
  errorCount: number;
  errors: JsonlError[];
}

export interface JsonlParseOptions {
  /**
   * If true, keeps parsing even if multiple lines fail. Default: true
   */
  ignoreErrors?: boolean;
  /**
   * Maximum records to read before stopping. Default: Infinity
   */
  maxRecords?: number;
}

/**
 * Parses newline-delimited JSON (JSONL) into typed records, collecting diagnostic errors for malformed lines.
 */
export function parseJsonl<T = unknown>(text: string, options?: JsonlParseOptions): JsonlParseResult<T> {
  if (typeof text !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  const lines = text.split(/\r?\n/);
  const records: T[] = [];
  const errors: JsonlError[] = [];
  const max = options?.maxRecords ?? Infinity;
  const ignoreErrors = options?.ignoreErrors !== false;

  let lineNumber = 0;
  for (const rawLine of lines) {
    lineNumber++;
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue; // Skip blank lines
    }

    try {
      const parsed = JSON.parse(trimmed) as T;
      records.push(parsed);
      if (records.length >= max) {
        break;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push({ line: lineNumber, error: errorMsg, raw: trimmed });
      if (!ignoreErrors) {
        break;
      }
    }
  }

  return {
    records,
    total: records.length + errors.length,
    validCount: records.length,
    errorCount: errors.length,
    errors,
  };
}

/**
 * Serializes an array of records into a newline-delimited JSON (JSONL) string.
 */
export function stringifyJsonl(records: unknown[]): string {
  if (!Array.isArray(records)) {
    throw new TypeError('Expected records to be an array');
  }
  return records.map((rec) => JSON.stringify(rec)).join('\n');
}

/**
 * Generates an inspection summary of a JSONL string with record counts and preview.
 */
export function formatJsonlSummary(text: string, options?: { limit?: number }): string {
  const limit = options?.limit ?? 5;
  const result = parseJsonl(text, { maxRecords: limit });
  const preview = result.records
    .slice(0, limit)
    .map((r, i) => {
      const serialized = JSON.stringify(r);
      const truncated = serialized.length > 80 ? serialized.slice(0, 77) + '...' : serialized;
      return `  [${i + 1}] ${truncated}`;
    })
    .join('\n');

  return [
    `JSONL Summary:`,
    `  Valid Records: ${result.validCount}`,
    `  Errors:        ${result.errorCount}`,
    `  Preview:`,
    preview || '  (no records)',
  ].join('\n');
}
