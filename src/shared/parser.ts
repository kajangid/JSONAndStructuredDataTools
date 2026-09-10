export interface ErrorPosition {
  line: number;
  column: number;
  index: number;
}

/**
 * Computes line (1-indexed) and column (1-indexed) from a character index in the input.
 */
export function getLineAndColumn(input: string, index: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(index, input.length));
  let line = 1;
  let column = 1;

  for (let i = 0; i < clamped; i++) {
    if (input[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Creates a formatted code snippet pointing to the error location with a caret (^).
 */
export function createErrorSnippet(input: string, index: number, maxContextLines = 1): string {
  const lines = input.split('\n');
  const { line, column } = getLineAndColumn(input, index);
  const lineIdx = line - 1;

  const startLine = Math.max(0, lineIdx - maxContextLines);
  const endLine = Math.min(lines.length - 1, lineIdx + maxContextLines);

  const padSize = String(endLine + 1).length;
  const result: string[] = [];

  for (let i = startLine; i <= endLine; i++) {
    const lineNum = String(i + 1).padStart(padSize, ' ');
    result.push(`${lineNum} | ${lines[i] ?? ''}`);
    if (i === lineIdx) {
      const caretIndent = ' '.repeat(padSize + 3 + (column - 1));
      result.push(`${caretIndent}^`);
    }
  }

  return result.join('\n');
}

/**
 * A lightweight JSON scanner that locates the exact character index where a syntax error occurs.
 */
export function locateJsonSyntaxError(input: string, nativeError?: Error): ErrorPosition {
  const msg = nativeError?.message || '';

  // 1. Try extracting position directly from standard V8 / SpiderMonkey / JavaScriptCore messages
  const posMatch = msg.match(/at position (\d+)/i) || msg.match(/\(char (\d+)\)/i);
  if (posMatch && posMatch[1]) {
    const index = parseInt(posMatch[1], 10);
    const { line, column } = getLineAndColumn(input, index);
    return { line, column, index };
  }

  const lineColMatch = msg.match(/line (\d+) column (\d+)/i);
  if (lineColMatch && lineColMatch[1] && lineColMatch[2]) {
    const line = parseInt(lineColMatch[1], 10);
    const col = parseInt(lineColMatch[2], 10);
    // Find index for this line and column
    let curLine = 1;
    let curCol = 1;
    let index = input.length;
    for (let i = 0; i < input.length; i++) {
      if (curLine === line && curCol === col) {
        index = i;
        break;
      }
      if (input[i] === '\n') {
        curLine++;
        curCol = 1;
      } else {
        curCol++;
      }
    }
    return { line, column: col, index };
  }

  // 2. If it's an empty input or EOF error
  if (input.trim() === '' || /end of (json|input)/i.test(msg)) {
    const index = input.length;
    const { line, column } = getLineAndColumn(input, index);
    return { line, column, index };
  }

  // 3. Fallback: Parse token by token to find the exact character index where JSON syntax is broken
  let pos = 0;
  const len = input.length;

  function skipWhitespace(): void {
    while (pos < len) {
      const ch = input[pos];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        pos++;
      } else {
        break;
      }
    }
  }

  function parseString(): boolean {
    if (input[pos] !== '"') return false;
    pos++; // skip opening quote
    while (pos < len) {
      const ch = input[pos];
      if (ch === '\\') {
        pos += 2; // skip escape
      } else if (ch === '"') {
        pos++; // skip closing quote
        return true;
      } else if (ch === '\n' || ch === '\r') {
        return false; // unescaped newline in string
      } else {
        pos++;
      }
    }
    return false; // unclosed string
  }

  function parseNumber(): boolean {
    const start = pos;
    if (input[pos] === '-') pos++;
    if (input[pos] === '0') {
      pos++;
    } else if (pos < len && input[pos]! >= '1' && input[pos]! <= '9') {
      while (pos < len && input[pos]! >= '0' && input[pos]! <= '9') pos++;
    } else {
      return false;
    }

    if (pos < len && input[pos] === '.') {
      pos++;
      if (pos >= len || input[pos]! < '0' || input[pos]! > '9') return false;
      while (pos < len && input[pos]! >= '0' && input[pos]! <= '9') pos++;
    }

    if (pos < len && (input[pos] === 'e' || input[pos] === 'E')) {
      pos++;
      if (pos < len && (input[pos] === '+' || input[pos] === '-')) pos++;
      if (pos >= len || input[pos]! < '0' || input[pos]! > '9') return false;
      while (pos < len && input[pos]! >= '0' && input[pos]! <= '9') pos++;
    }

    return pos > start;
  }

  function parseLiteral(lit: string): boolean {
    if (input.startsWith(lit, pos)) {
      pos += lit.length;
      return true;
    }
    return false;
  }

  function parseValue(): boolean {
    skipWhitespace();
    if (pos >= len) return false;

    const ch = input[pos];
    if (ch === '"') return parseString();
    if (ch === '{') return parseObject();
    if (ch === '[') return parseArray();
    if (ch === 't') return parseLiteral('true');
    if (ch === 'f') return parseLiteral('false');
    if (ch === 'n') return parseLiteral('null');
    if (ch === '-' || (ch! >= '0' && ch! <= '9')) return parseNumber();

    return false;
  }

  function parseObject(): boolean {
    if (input[pos] !== '{') return false;
    pos++; // skip '{'
    skipWhitespace();

    if (pos < len && input[pos] === '}') {
      pos++;
      return true;
    }

    while (pos < len) {
      skipWhitespace();
      if (!parseString()) return false;
      skipWhitespace();
      if (pos >= len || input[pos] !== ':') return false;
      pos++; // skip ':'
      skipWhitespace();
      if (!parseValue()) return false;
      skipWhitespace();
      if (pos < len && input[pos] === ',') {
        pos++; // skip ','
        skipWhitespace();
        // Disallow trailing comma
        if (pos < len && input[pos] === '}') return false;
      } else if (pos < len && input[pos] === '}') {
        pos++;
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  function parseArray(): boolean {
    if (input[pos] !== '[') return false;
    pos++; // skip '['
    skipWhitespace();

    if (pos < len && input[pos] === ']') {
      pos++;
      return true;
    }

    while (pos < len) {
      skipWhitespace();
      if (!parseValue()) return false;
      skipWhitespace();
      if (pos < len && input[pos] === ',') {
        pos++; // skip ','
        skipWhitespace();
        // Disallow trailing comma
        if (pos < len && input[pos] === ']') return false;
      } else if (pos < len && input[pos] === ']') {
        pos++;
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  // Scan root value
  skipWhitespace();
  if (pos >= len) {
    const { line, column } = getLineAndColumn(input, 0);
    return { line, column, index: 0 };
  }

  const success = parseValue();
  if (!success) {
    const errorIndex = Math.min(pos, len);
    const { line, column } = getLineAndColumn(input, errorIndex);
    return { line, column, index: errorIndex };
  }

  skipWhitespace();
  if (pos < len) {
    // Unexpected trailing character after root
    const { line, column } = getLineAndColumn(input, pos);
    return { line, column, index: pos };
  }

  // Default to end of input if unknown
  const index = Math.min(pos, len);
  const { line, column } = getLineAndColumn(input, index);
  return { line, column, index };
}
