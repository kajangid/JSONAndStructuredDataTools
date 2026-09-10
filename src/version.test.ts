import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { VERSION } from './version';

describe('VERSION constant', () => {
  it('matches the version specified in package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    expect(VERSION).toBe(pkg.version);
  });
});
