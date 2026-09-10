export interface FormatJsonOptions {
  /**
   * Indentation: number of spaces (e.g. 2, 4) or string (e.g. '\t'). Default: 2
   */
  indent?: number | string;
  /**
   * Sort object keys alphabetically or using a custom comparator function.
   * Default: false
   */
  sortKeys?: boolean | ((a: string, b: string) => number);
  /**
   * Apply ANSI terminal color codes to the output.
   * Default: false
   */
  color?: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  key: '\x1b[36m', // Cyan
  string: '\x1b[32m', // Green
  number: '\x1b[33m', // Yellow
  boolean: '\x1b[35m', // Magenta
  null: '\x1b[90m', // Dim gray
};

/**
 * Colorizes a JSON string using ANSI escape codes.
 */
export function colorizeJson(json: string): string {
  const jsonTokenRegex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  return json.replace(jsonTokenRegex, (match) => {
    let color = COLORS.number;

    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        // Object key (with trailing colon)
        const colonIdx = match.lastIndexOf(':');
        const keyPart = match.slice(0, colonIdx);
        const rest = match.slice(colonIdx);
        return `${COLORS.key}${keyPart}${COLORS.reset}${rest}`;
      } else {
        // String value
        color = COLORS.string;
      }
    } else if (/true|false/.test(match)) {
      color = COLORS.boolean;
    } else if (/null/.test(match)) {
      color = COLORS.null;
    }

    return `${color}${match}${COLORS.reset}`;
  });
}

/**
 * Recursively sorts object keys.
 */
function sortObjectKeys(
  value: unknown,
  compareFn: (a: string, b: string) => number
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item, compareFn));
  }

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(value as object).sort(compareFn);

  for (const k of keys) {
    sortedObj[k] = sortObjectKeys((value as Record<string, unknown>)[k], compareFn);
  }

  return sortedObj;
}

/**
 * Pretty-prints a JSON string or JavaScript object with custom indentation, key sorting, and optional colors.
 */
export function formatJson(input: unknown, options?: FormatJsonOptions): string {
  let data = input;

  if (typeof input === 'string') {
    data = JSON.parse(input);
  }

  const indent = options?.indent !== undefined ? options.indent : 2;

  if (options?.sortKeys) {
    const compareFn = typeof options.sortKeys === 'function'
      ? options.sortKeys
      : (a: string, b: string) => a.localeCompare(b);
    data = sortObjectKeys(data, compareFn);
  }

  const formatted = JSON.stringify(data, null, indent);

  if (options?.color) {
    return colorizeJson(formatted);
  }

  return formatted;
}
