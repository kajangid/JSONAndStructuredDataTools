export type DiffType = 'add' | 'remove' | 'modify';

export interface DiffEntry {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffSummary {
  additions: number;
  removals: number;
  modifications: number;
  total: number;
}

export interface JsonDiffResult {
  hasChanges: boolean;
  additions: DiffEntry[];
  removals: DiffEntry[];
  modifications: DiffEntry[];
  all: DiffEntry[];
  summary: DiffSummary;
}

export interface DiffOptions {
  /**
   * Treat arrays as sets or strictly by index. Default: 'index'
   */
  arrayMode?: 'index';
}

export interface FormatDiffOptions {
  color?: boolean;
}

const DIFF_COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[90m',
};

function formatPath(parentPath: string, key: string | number): string {
  if (typeof key === 'number') {
    return `${parentPath}[${key}]`;
  }
  // Check if key is a standard identifier
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return parentPath ? `${parentPath}.${key}` : key;
  }
  return parentPath ? `${parentPath}["${key}"]` : `["${key}"]`;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date);
}

/**
 * Computes deep differences between two JSON structures (objects, arrays, primitives, or JSON strings).
 */
export function diffJson(
  leftInput: unknown,
  rightInput: unknown,
  _options?: DiffOptions
): JsonDiffResult {
  const left = typeof leftInput === 'string' ? safeJsonParse(leftInput) : leftInput;
  const right = typeof rightInput === 'string' ? safeJsonParse(rightInput) : rightInput;

  const additions: DiffEntry[] = [];
  const removals: DiffEntry[] = [];
  const modifications: DiffEntry[] = [];

  function compare(l: unknown, r: unknown, currentPath: string): void {
    // 1. Exact equality
    if (Object.is(l, r)) {
      return;
    }

    // 2. Arrays comparison
    if (Array.isArray(l) && Array.isArray(r)) {
      const maxLen = Math.max(l.length, r.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = formatPath(currentPath, i);
        if (i >= l.length) {
          additions.push({ path: itemPath, type: 'add', newValue: r[i] });
        } else if (i >= r.length) {
          removals.push({ path: itemPath, type: 'remove', oldValue: l[i] });
        } else {
          compare(l[i], r[i], itemPath);
        }
      }
      return;
    }

    // 3. Plain objects comparison
    if (isPlainObject(l) && isPlainObject(r)) {
      const leftKeys = new Set(Object.keys(l));
      const rightKeys = new Set(Object.keys(r));

      // Removals
      for (const key of leftKeys) {
        if (!rightKeys.has(key)) {
          removals.push({
            path: formatPath(currentPath, key),
            type: 'remove',
            oldValue: l[key],
          });
        }
      }

      // Additions
      for (const key of rightKeys) {
        if (!leftKeys.has(key)) {
          additions.push({
            path: formatPath(currentPath, key),
            type: 'add',
            newValue: r[key],
          });
        }
      }

      // Recurse common keys
      for (const key of leftKeys) {
        if (rightKeys.has(key)) {
          compare(l[key], r[key], formatPath(currentPath, key));
        }
      }
      return;
    }

    // 4. Mismatched types or different primitive values
    modifications.push({
      path: currentPath || 'root',
      type: 'modify',
      oldValue: l,
      newValue: r,
    });
  }

  compare(left, right, '');

  const all = [...additions, ...removals, ...modifications];
  const hasChanges = all.length > 0;

  return {
    hasChanges,
    additions,
    removals,
    modifications,
    all,
    summary: {
      additions: additions.length,
      removals: removals.length,
      modifications: modifications.length,
      total: all.length,
    },
  };
}

function safeJsonParse(val: string): unknown {
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

/**
 * Formats a JsonDiffResult into a clean, human-readable terminal or text report.
 */
export function formatDiff(diff: JsonDiffResult, options?: FormatDiffOptions): string {
  if (!diff.hasChanges) {
    return 'No changes detected.';
  }

  const useColor = options?.color === true;
  const lines: string[] = [];

  for (const add of diff.additions) {
    const text = `+ ${add.path}: ${JSON.stringify(add.newValue)}`;
    lines.push(useColor ? `${DIFF_COLORS.green}${text}${DIFF_COLORS.reset}` : text);
  }

  for (const rem of diff.removals) {
    const text = `- ${rem.path}: ${JSON.stringify(rem.oldValue)}`;
    lines.push(useColor ? `${DIFF_COLORS.red}${text}${DIFF_COLORS.reset}` : text);
  }

  for (const mod of diff.modifications) {
    const text = `~ ${mod.path}: ${JSON.stringify(mod.oldValue)} => ${JSON.stringify(mod.newValue)}`;
    lines.push(useColor ? `${DIFF_COLORS.yellow}${text}${DIFF_COLORS.reset}` : text);
  }

  const summary = `\nSummary: +${diff.summary.additions} added, -${diff.summary.removals} removed, ~${diff.summary.modifications} modified (${diff.summary.total} total)`;
  lines.push(useColor ? `${DIFF_COLORS.dim}${summary}${DIFF_COLORS.reset}` : summary);

  return lines.join('\n');
}
