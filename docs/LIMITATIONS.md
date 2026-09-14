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
