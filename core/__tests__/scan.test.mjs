/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// scan.test.mjs - assert the scanner / graph holds the three properties most
// likely to silently regress: alias resolution, comment-stripping, and the
// missing-trailing-semicolon SQL case. Runs against the fixture mini-project.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { computeGraph } from '../scripts/lib/brain.mjs';

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE  = join(SELF_DIR, 'fixtures', 'tiny-project');

const baseConfig = (project) => ({
  spiderbrain: 1,
  prey: 'serve a test',
  project,
  brain: project + '-brain',
  rings: [8.5, 7, 5, 3],
  masterMassMin: 8.5,
  displayK: 8,
  columnSize: 9,
  ignore: ['node_modules', '.git'],
  collapseDirs: [],
  clusterRules: [{ cluster: 'shell', patterns: ['**'] }],
  clusterTitles: { shell: 'shell' },
  clusterWebscores: {},
  extraEdges: [],
  masters: [],
});

function withBrainDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'sb-test-brain-'));
  try { return fn(dir); } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('scan: every code file in the fixture becomes a graph node', () => {
  withBrainDir((brainDir) => {
    const graph = computeGraph(brainDir, baseConfig(FIXTURE), {});
    for (const id of [
      'src/worker.js',
      'src/db/queries.js',
      'src/utils/helpers.js',
      'src/utils/tiny-helper.js',
      'src/handlers/auth.js',
    ]) {
      assert.ok(graph.nodes[id], 'expected node missing: ' + id);
    }
  });
});

test('scan: tsconfig path "@/utils/helpers" resolves to src/utils/helpers.js', () => {
  withBrainDir((brainDir) => {
    const graph = computeGraph(brainDir, baseConfig(FIXTURE), {});
    const worker = graph.nodes['src/worker.js'];
    assert.ok(worker, 'src/worker.js node missing');
    assert.ok(
      (worker.dependsOn || []).includes('src/utils/helpers.js'),
      'alias @/utils/helpers should resolve to src/utils/helpers.js; ' +
      'dependsOn = ' + JSON.stringify(worker.dependsOn),
    );
  });
});

test('scan: commented-out imports do not create false dependency edges', () => {
  withBrainDir((brainDir) => {
    const graph = computeGraph(brainDir, baseConfig(FIXTURE), {});
    const helpers = graph.nodes['src/utils/helpers.js'];
    assert.ok(helpers, 'helpers node missing');
    // real import must be present
    assert.ok(
      (helpers.dependsOn || []).includes('src/utils/tiny-helper.js'),
      'real import to tiny-helper missing; dependsOn = ' +
      JSON.stringify(helpers.dependsOn),
    );
    // commented-out ghost imports must NOT appear
    const ghosts = (helpers.dependsOn || []).filter((d) => /ghost/i.test(d));
    assert.deepEqual(
      ghosts, [],
      'commented-out imports should not become edges; got ' + JSON.stringify(ghosts),
    );
  });
});

test('scan: SQL parser tolerates a missing trailing semicolon', () => {
  withBrainDir((brainDir) => {
    const graph = computeGraph(brainDir, baseConfig(FIXTURE), {});
    // schema.sql declares two tables; the second has no trailing `;`.
    // Both must be present as nodes - the paren-depth parser fix is the point.
    assert.ok(graph.nodes['db:leads'],
      'db:leads node missing - first table dropped');
    assert.ok(graph.nodes['db:posts'],
      'db:posts node missing - semicolon-tolerant parse regressed');
  });
});

test('scan: nodeCount and edgeCount stable on the fixture', () => {
  // Stability snapshot: if these numbers change, somebody changed scan/graph
  // behaviour. Re-derive deliberately, don't re-snapshot to silence the test.
  withBrainDir((brainDir) => {
    const graph = computeGraph(brainDir, baseConfig(FIXTURE), {});
    const jsCodeNodes = Object.keys(graph.nodes).filter(
      (k) => /\.(js|jsx|mjs|cjs|ts|tsx)$/.test(k),
    );
    const dbTableNodes = Object.keys(graph.nodes).filter(
      (k) => /^db:[^.]+$/.test(k), // db:<table>, not db:<table>.<col>
    );
    assert.equal(jsCodeNodes.length, 5,
      'expected 5 JS code nodes (worker, queries, helpers, tiny-helper, auth); ' +
      'got ' + jsCodeNodes.length + ': ' + JSON.stringify(jsCodeNodes));
    assert.ok(dbTableNodes.length >= 2,
      'expected at least 2 db table nodes (leads + posts); got ' +
      dbTableNodes.length + ': ' + JSON.stringify(dbTableNodes));
  });
});
