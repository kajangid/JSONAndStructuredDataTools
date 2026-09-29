# Limitations & Edge Cases: @kjangid/json-tools

This document outlines architectural boundaries, trade-offs, and operational limitations.

---

## 1. Memory and Payload Size
- **In-Memory Operation**: All utilities operate synchronously or in-memory. They are optimized for microservice payloads, API requests, configuration files, and state objects up to tens of megabytes.
- **Large File Streaming**: For multi-gigabyte JSON files that exceed the V8 heap limit (e.g. >1.5 GB), use a streaming pipeline (e.g. streaming SAX parser) rather than loading the entire payload into RAM at once.

---

## 2. BigInt and JSON RFC Compliance
- The official JSON specification (RFC 8259) does not define a 64-bit integer type.
- Native `JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt`.
- In `safeStringify`, BigInt values are converted to string format (e.g. `"9007199254740993n"`) to preserve exact numeric precision without silent IEEE 754 truncation.

---

## 3. Sparse Arrays in `unflattenJson`
- When unflattening keys containing large numeric indices (e.g. `items.1000000.name`), JavaScript creates a sparse array with a length of `1000001`.
- While V8 handles sparse arrays via dictionary mode, creating extremely large sparse arrays can incur memory overhead. For arbitrary key-value mappings that happen to be numeric IDs, use a non-numeric prefix or consider treating keys as an object dictionary.

---

## 4. Prototype Pollution Defenses
- The package strictly blocks the mutation or reconstruction of `__proto__`, `constructor`, and `prototype` in `unflattenJson` and `setPath`.
- Attempting to set or unflatten these keys will silently drop the malicious property and protect `Object.prototype` from pollution.

---

## 5. Object Key Sorting in `formatJson`
- `sortKeys: true` uses JavaScript's standard alphabetical sorting (`String.prototype.localeCompare`).
- Key sorting is deterministic, but note that JavaScript engines internally iterate integer keys before string keys. Our recursive sort returns a freshly constructed object with sorted keys.

---

## 6. Date Objects in `safeParse`
- In accordance with standard JSON specifications, ISO 8601 date strings (e.g. `"2026-01-01T00:00:00.000Z"`) parse as strings.
- To instantiate `Date` objects, pass a custom `reviver` function to `safeParse`:
  ```typescript
  safeParse(jsonString, {
    reviver: (key, val) => (key === 'createdAt' ? new Date(val) : val)
  });
  ```

---

## 7. String Escaping & Unescaping (`json-escape`)
- **RFC 8259 Standard Conformance**: `escapeJsonString` and `unescapeJsonString` strictly follow RFC 8259 escape rules (`\"`, `\\`, `\/`, `\b`, `\f`, `\n`, `\r`, `\t`, and unicode `\uXXXX`).
- **Non-Standard & ECMAScript Escapes**: Non-JSON escapes such as vertical tabs (`\v`), null bytes (`\0`), hex byte escapes (`\xHH`), or octal escapes (`\123`) are not automatically converted into valid JSON escape syntax.
- **HTML Sanitization**: Does not encode HTML entities (`&`, `<`, `>`). If embedding within HTML script tags, additional HTML entity escaping or serializer defenses are recommended.

---

## 8. Recursive Key Sorting (`json-sort-keys`)
- **Array Value Preservation**: `sortKeys` sorts object properties only. It intentionally preserves array item order as arrays represent ordered sequences where sorting would mutate data semantics.
- **JavaScript Engine Property Order**: In modern ECMAScript engines (V8, JavaScriptCore), integer index keys (`"0"`, `"1"`, `"42"`) are iterated before string keys regardless of insertion order. For strict alphabetical byte-level ordering in text output, serialize through `sortKeysJson` or `formatJson`.
- **Special Types**: Map entries, Set elements, and Symbol-keyed properties are not sorted or enumerated.

---

## 9. Newline-Delimited JSON (`jsonl`)
- **Single-Line Boundary**: Each record must reside entirely on a single physical line. Pretty-printed, multiline JSON blocks within a `.jsonl` file will fail parsing and be recorded as line-level errors.
- **In-Memory Buffering**: `parseJsonl` processes string inputs in memory. For continuous streaming pipelines or files exceeding available RAM (e.g. >500 MB), use Node.js stream interfaces with line-by-line chunking.

