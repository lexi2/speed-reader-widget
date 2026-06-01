import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BUDGET_BYTES = 30 * 1024; // 30 KB
const BUNDLE = resolve(process.cwd(), 'dist/rsvp-reader.iife.js');

test('IIFE bundle is under the 30KB gzipped budget', () => {
  if (!existsSync(BUNDLE)) {
    execSync('npm run build', { stdio: 'inherit' });
  }
  const raw = readFileSync(BUNDLE);
  const gzipped = gzipSync(raw);
  const size = gzipped.byteLength;

  console.log(`[bundle-size] raw=${statSync(BUNDLE).size}B  gzipped=${size}B  budget=${BUDGET_BYTES}B`);
  expect(size).toBeLessThan(BUDGET_BYTES);
});
