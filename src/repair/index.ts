export interface SafeRepairResult<T = unknown> {
  success: boolean;
  data?: T;
  repairedText: string;
  error?: string;
}

/**
 * Strips line comments (//) and block comments (/* *\/) outside strings.
 */
function stripComments(input: string): string {
  let inString = false;
  let quoteChar = '';
  let result = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];

    if (inString) {
      result += ch;
      if (ch === '\\' && next !== undefined) {
        result += next;
        i++;
      } else if (ch === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      result += ch;
      continue;
    }

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n' && input[i] !== '\r') {
        i++;
      }
      if (i < input.length) {
        result += input[i];
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < input.length - 1 && !(input[i] === '*' && input[i + 1] === '/')) {
        i++;
      }
      i++; // skip /
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Normalizes single-quoted strings to double-quoted JSON strings.
 */
function fixSingleQuotes(input: string): string {
  let result = '';
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];

    if (inDouble) {
      result += ch;
      if (ch === '\\' && next !== undefined) {
        result += next;
        i++;
      } else if (ch === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inSingle) {
      if (ch === '\\' && next !== undefined) {
        if (next === "'") {
          result += "'";
        } else {
          result += '\\' + next;
        }
        i++;
      } else if (ch === "'") {
        result += '"';
        inSingle = false;
      } else if (ch === '"') {
        result += '\\"';
      } else {
        result += ch;
      }
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      result += ch;
    } else if (ch === "'") {
      inSingle = true;
      result += '"';
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Repairs unclosed brackets and braces at the end of the input.
 */
function balanceEnclosingTokens(input: string): string {
  const stack: string[] = [];
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];

    if (inString) {
      if (ch === '\\' && next !== undefined) {
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      stack.push('}');
    } else if (ch === '[') {
      stack.push(']');
    } else if (ch === '}' || ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  let repaired = input.trimEnd();
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  return repaired;
}

/**
 * Repairs malformed JSON strings by fixing trailing commas, unquoted keys,
 * single quotes, JavaScript comments, and missing closing brackets.
 */
export function repairJson(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  let text = input.trim();
  if (!text) {
    return text;
  }

  // 1. Strip comments
  text = stripComments(text);

  // 2. Fix single quotes to double quotes
  text = fixSingleQuotes(text);

  // 3. Fix unquoted object keys
  text = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 4. Remove trailing commas in objects and arrays
  text = text.replace(/,\s*([}\]])/g, '$1');

  // 5. Auto-balance any open brackets/braces
  text = balanceEnclosingTokens(text);

  return text;
}

/**
 * Safely attempts to repair and parse a malformed JSON string, returning a result object.
 */
export function safeRepairJson<T = unknown>(input: string): SafeRepairResult<T> {
  try {
    const repairedText = repairJson(input);
    const data = JSON.parse(repairedText) as T;
    return {
      success: true,
      data,
      repairedText,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      repairedText: input,
      error: errorMsg,
    };
  }
}
