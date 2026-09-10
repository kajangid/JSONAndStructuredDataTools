import { defineConfig } from 'tsup';
import * as fs from 'node:fs';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'safe-parse/index': 'src/safe-parse/index.ts',
    'safe-stringify/index': 'src/safe-stringify/index.ts',
    'formatter/index': 'src/formatter/index.ts',
    'minify/index': 'src/minify/index.ts',
    'validator/index': 'src/validator/index.ts',
    'diff/index': 'src/diff/index.ts',
    'flatten/index': 'src/flatten/index.ts',
    'unflatten/index': 'src/unflatten/index.ts',
    'path/index': 'src/path/index.ts',
    'bin/cli': 'src/bin/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  define: {
    __PACKAGE_VERSION__: JSON.stringify(packageJson.version),
  },
  banner: {
    js: '/* @omnidev-tools/json-structured-data */',
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
});
