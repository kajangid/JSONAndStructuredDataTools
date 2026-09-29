export interface RenderJsonTreeOptions {
  /**
   * Maximum depth to traverse before showing ellipsis (...). Default: Infinity
   */
  maxDepth?: number;
  /**
   * Label for the root node. Default: 'root'
   */
  rootLabel?: string;
  /**
   * Enable ANSI terminal color highlighting. Default: false
   */
  colors?: boolean;
}

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[90m',
  key: '\x1b[36m', // Cyan
  string: '\x1b[32m', // Green
  number: '\x1b[33m', // Yellow
  boolean: '\x1b[35m', // Magenta
  null: '\x1b[90m', // Dim
  type: '\x1b[34m', // Blue
};

function formatLeaf(val: unknown, colors: boolean): string {
  if (val === null) {
    return colors ? `${COLORS.null}null${COLORS.reset}` : 'null';
  }
  if (typeof val === 'string') {
    const formatted = JSON.stringify(val);
    return colors ? `${COLORS.string}${formatted}${COLORS.reset}` : formatted;
  }
  if (typeof val === 'number') {
    return colors ? `${COLORS.number}${val}${COLORS.reset}` : String(val);
  }
  if (typeof val === 'boolean') {
    return colors ? `${COLORS.boolean}${val}${COLORS.reset}` : String(val);
  }
  return String(val);
}

function buildTreeLines(
  value: unknown,
  prefix: string,
  depth: number,
  options: RenderJsonTreeOptions
): string[] {
  const maxDepth = options.maxDepth ?? Infinity;
  const colors = options.colors ?? false;

  if (depth >= maxDepth && typeof value === 'object' && value !== null) {
    return [`${prefix}${colors ? COLORS.dim : ''}...${colors ? COLORS.reset : ''}`];
  }

  const lines: string[] = [];

  if (Array.isArray(value)) {
    const total = value.length;
    for (let i = 0; i < total; i++) {
      const isLast = i === total - 1;
      const branch = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      const item = value[i];
      const keyLabel = `[${i}]`;

      if (typeof item === 'object' && item !== null) {
        const typeDesc = Array.isArray(item) ? `Array[${item.length}]` : 'Object';
        const typeStr = colors ? `${COLORS.type}(${typeDesc})${COLORS.reset}` : `(${typeDesc})`;
        lines.push(`${prefix}${branch}${keyLabel} ${typeStr}`);
        lines.push(...buildTreeLines(item, nextPrefix, depth + 1, options));
      } else {
        lines.push(`${prefix}${branch}${keyLabel}: ${formatLeaf(item, colors)}`);
      }
    }
    return lines;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const total = entries.length;
    for (let i = 0; i < total; i++) {
      const [k, v] = entries[i]!;
      const isLast = i === total - 1;
      const branch = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      const keyLabel = colors ? `${COLORS.key}${k}${COLORS.reset}` : k;

      if (typeof v === 'object' && v !== null) {
        const typeDesc = Array.isArray(v) ? `Array[${v.length}]` : 'Object';
        const typeStr = colors ? `${COLORS.type}(${typeDesc})${COLORS.reset}` : `(${typeDesc})`;
        lines.push(`${prefix}${branch}${keyLabel} ${typeStr}`);
        lines.push(...buildTreeLines(v, nextPrefix, depth + 1, options));
      } else {
        lines.push(`${prefix}${branch}${keyLabel}: ${formatLeaf(v, colors)}`);
      }
    }
    return lines;
  }

  return [`${prefix}${formatLeaf(value, colors)}`];
}

/**
 * Renders a JSON document or JavaScript data structure as an ASCII/Unicode box-drawing tree.
 */
export function renderJsonTree(input: unknown, options: RenderJsonTreeOptions = {}): string {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      // Use raw input if parse fails
    }
  }

  const rootLabel = options.rootLabel ?? 'root';
  const colors = options.colors ?? false;
  const rootHeader = colors ? `${COLORS.type}${rootLabel}${COLORS.reset}` : rootLabel;

  if (typeof data !== 'object' || data === null) {
    return `${rootHeader}: ${formatLeaf(data, colors)}`;
  }

  const childLines = buildTreeLines(data, '', 0, options);
  if (childLines.length === 0) {
    const emptyDesc = Array.isArray(data) ? 'Array[0]' : 'Object(empty)';
    return `${rootHeader} (${emptyDesc})`;
  }

  return [rootHeader, ...childLines].join('\n');
}
