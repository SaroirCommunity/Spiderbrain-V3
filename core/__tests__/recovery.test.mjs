/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// recovery.test.mjs - assert that corrupt curated state is quarantined (not
// overwritten with defaults), and that the dragline restores it when one
// exists. This is the single most important invariant of the curated-vs-
// generated discipline - a regression here looks like data loss.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadCurated } from '../scripts/lib/brain.mjs';
import { anchorDragline } from '../scripts/lib/dragline.mjs';

const validConfig = {
  spiderbrain: 1,
  prey: 'serve a test',
  project: '/tmp/dummy-project',
  brain: '/tmp/dummy-brain',
  rings: [8.5, 7, 5, 3],
  masterMassMin: 8.5,
  displayK: 8,
  columnSize: 9,
  ignore: ['node_modules'],
  collapseDirs: [],
  clusterRules: [{ cluster: 'shell', patterns: ['**'] }],
  clusterTitles: { shell: 'shell' },
  clusterWebscores: {},
  extraEdges: [],
  masters: [],
};

function withBrainDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'sb-test-recovery-'));
  try { return fn(dir); } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('recovery: corrupt config WITHOUT a dragline throws (refuses to overwrite)', () => {
  withBrainDir((brainDir) => {
    const configPath = join(brainDir, 'spiderbrain.config.json');
    writeFileSync(configPath, '{ "this is": not valid JSON, hold on');

    assert.throws(
      () => loadCurated(brainDir),
      /corrupt|refus|hand|dragline/i,
      'loadCurated should throw when config is corrupt and no dragline exists',
    );

    // The corrupt file should have been quarantined.
    const files = readdirSync(brainDir);
    const fouled = files.filter((f) => f.includes('.fouled-'));
    assert.ok(
      fouled.length >= 1,
      'expected a .fouled-* quarantine file; saw ' + JSON.stringify(files),
    );
  });
});

test('recovery: corrupt config WITH a dragline is restored from the snapshot', () => {
  withBrainDir((brainDir) => {
    const configPath = join(brainDir, 'spiderbrain.config.json');
    writeFileSync(configPath, JSON.stringify(validConfig, null, 2));
    const snap = anchorDragline(brainDir);
    assert.ok(snap, 'anchorDragline should return a snapshot path');

    // Now corrupt the config.
    writeFileSync(configPath, '{ corrupt: not json,');

    const result = loadCurated(brainDir);
    assert.ok(result.config, 'expected config to be restored, got null');
    assert.equal(result.config.prey, validConfig.prey,
      'restored config.prey should match the original');
    assert.ok(
      result.notes.some((n) => /corrupt|dragline/i.test(n)),
      'expected a recovery note; got ' + JSON.stringify(result.notes),
    );

    // Confirm the corrupt file was quarantined alongside the restored one.
    const files = readdirSync(brainDir);
    assert.ok(
      files.some((f) => f.includes('.fouled-')),
      'expected a .fouled-* quarantine file; got ' + JSON.stringify(files),
    );
  });
});

test('recovery: missing config returns null config (genuine first run, not a corruption)', () => {
  withBrainDir((brainDir) => {
    const result = loadCurated(brainDir);
    assert.equal(result.config, null,
      'a missing config should yield null (first-run path), not throw');
    assert.deepEqual(result.overrides, {},
      'overrides should be {} when there is no config');
  });
});

test('recovery: corrupt overrides without dragline does NOT throw (only warns)', () => {
  // webscore-overrides.json is treated as soft-curated - a corrupt one
  // surfaces a warning and the build proceeds with no overrides, rather
  // than refusing to build. This is by design.
  withBrainDir((brainDir) => {
    writeFileSync(join(brainDir, 'spiderbrain.config.json'),
      JSON.stringify(validConfig, null, 2));
    writeFileSync(join(brainDir, 'webscore-overrides.json'),
      '{ not: valid json');

    const result = loadCurated(brainDir);
    assert.ok(result.config, 'config should still load');
    assert.deepEqual(result.overrides, {},
      'overrides should be empty when the file is corrupt and not repairable');
    assert.ok(
      result.notes.some((n) => /webscore|corrupt/i.test(n)),
      'expected a note about the corrupt overrides; got ' +
      JSON.stringify(result.notes),
    );
  });
});
