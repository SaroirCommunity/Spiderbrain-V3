/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// io.test.mjs - lock down the io.mjs helpers that curated state depends on.
// In v3.0.1 the curated, append-only movemap.md gained an atomic-append path
// (appendTextAtomic). A regression here is silent data loss across a deploy,
// so it is worth a dedicated test surface.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { appendTextAtomic } from '../scripts/lib/io.mjs';

function withTmpDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'sb-test-io-'));
  try { return fn(dir); } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('appendTextAtomic: creates the file when missing', () => {
  withTmpDir((dir) => {
    const path = join(dir, 'movemap.md');
    appendTextAtomic(path, '# header\n\nfirst block\n');
    const got = readFileSync(path, 'utf8');
    assert.equal(got, '# header\n\nfirst block\n',
      'append into a missing file should write the new content verbatim');
  });
});

test('appendTextAtomic: appends to an existing file without losing prior bytes', () => {
  withTmpDir((dir) => {
    const path = join(dir, 'movemap.md');
    writeFileSync(path, '# header\n\nfirst block\n');
    appendTextAtomic(path, '\nsecond block\n');
    const got = readFileSync(path, 'utf8');
    assert.equal(got, '# header\n\nfirst block\n\nsecond block\n',
      'the prior content + the new content should both be present, in order');
  });
});

test('appendTextAtomic: leaves no stranded .tmp file on success', () => {
  withTmpDir((dir) => {
    const path = join(dir, 'movemap.md');
    appendTextAtomic(path, 'a\n');
    appendTextAtomic(path, 'b\n');
    appendTextAtomic(path, 'c\n');
    const files = readdirSync(dir);
    assert.deepEqual(files, ['movemap.md'],
      'three successful appends should leave exactly one file; got ' +
      JSON.stringify(files));
  });
});

test('appendTextAtomic: handles UTF-8 multi-byte content without truncation', () => {
  withTmpDir((dir) => {
    const path = join(dir, 'movemap.md');
    // Spider biology + a few non-ASCII bytes for safety. If the tmp+rename
    // pattern accidentally re-encodes, the assertion catches it.
    const block = '- **shell** - `synganglion · cephalothorax · dragline`\n';
    appendTextAtomic(path, block);
    appendTextAtomic(path, block);
    const got = readFileSync(path, 'utf8');
    assert.equal(got, block + block,
      'UTF-8 content should round-trip byte-for-byte');
  });
});
