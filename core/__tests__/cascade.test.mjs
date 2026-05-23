/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// cascade.test.mjs - assert that nervenet.cascade is deterministic. The
// cascade engine is the load-bearing piece of every blast-radius claim;
// it must be a pure function of (graph, badIds).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cascade } from '../scripts/lib/nervenet.mjs';

// Tiny in-memory graph: a fans out to b, c; both into d; d into e.
// All nodes share one cell so we exercise cell/wavefront aggregation without
// needing a real polar layout.
function tinyGraph() {
  const mk = (depsOnBy, deps, isMaster = false, webscore = 0) => ({
    dependedOnBy: depsOnBy,
    dependsOn: deps,
    isMaster,
    webscore,
    cell: 'r3:s1',
    ring: 3,
    cluster: 's1',
  });
  return {
    nodes: {
      a: mk(['b', 'c'], [],          false, 5),
      b: mk(['d'],      ['a'],       false, 4),
      c: mk(['d'],      ['a'],       false, 4),
      d: mk(['e'],      ['b', 'c'],  false, 3),
      e: mk([],         ['d'],       false, 2),
    },
  };
}

test('cascade: repeated calls return identical results', () => {
  const graph = tinyGraph();
  const r1 = cascade(graph, ['a']);
  const r2 = cascade(graph, ['a']);
  assert.deepEqual(r1.signature, r2.signature);
  assert.deepEqual(r1.wavefront, r2.wavefront);
  assert.deepEqual(r1.cells, r2.cells);
  assert.deepEqual(r1.blast, r2.blast);
  assert.deepEqual(r1.hardStop, r2.hardStop);
});

test('cascade: reordering badIds produces the same aggregate signature', () => {
  const graph = tinyGraph();
  const r1 = cascade(graph, ['b', 'c']);
  const r2 = cascade(graph, ['c', 'b']);

  // Non-array aggregate fields of the signature must be identical regardless
  // of input order. `originCells` is an array whose ORDER preserves the
  // input badIds order - that's a documented design choice, not a bug - so
  // we compare it as a sorted-by-id set instead of deep-equal.
  const aggregates = (s) => ({
    originCell:       s.originCell,
    originRing:       s.originRing,
    originSector:     s.originSector,
    breadth:          s.breadth,
    depth:            s.depth,
    speed:            s.speed,
    immediateFanout:  s.immediateFanout,
    cellsTripped:     s.cellsTripped,
    ringsCrossed:     s.ringsCrossed,
    sectorsCrossed:   s.sectorsCrossed,
    weightedSeverity: s.weightedSeverity,
    hardStop:         s.hardStop,
  });
  assert.deepEqual(aggregates(r1.signature), aggregates(r2.signature),
    'aggregate signature fields differ across reordered badIds');

  assert.deepEqual(r1.wavefront, r2.wavefront,
    'wavefront differs across reordered badIds');

  // originCells: same set of ids, order may differ.
  const cellIds = (sig) => sig.originCells.map((c) => c.id).sort();
  assert.deepEqual(cellIds(r1.signature), cellIds(r2.signature),
    'originCells set differs across reordered badIds');

  // The blast set should be identical (compare sorted ids).
  assert.deepEqual(
    r1.blast.map((b) => b.id).sort(),
    r2.blast.map((b) => b.id).sort(),
    'blast set differs across reordered badIds',
  );
  // Origins as a set should match (insertion order may vary; that is OK).
  assert.deepEqual(
    [...r1.origins].sort(),
    [...r2.origins].sort(),
    'origin set differs across reordered badIds',
  );
});

test('cascade: hard stop trips when a gamma fault reaches a master', () => {
  const graph = tinyGraph();
  graph.nodes.d.isMaster = true; // promote d to master; cascade halts there
  const r = cascade(graph, ['a']);
  assert.equal(r.hardStop.tripped, true,
    'hardStop should trip on gamma->master');
  assert.ok(r.hardStop.masters.length > 0,
    'hardStop.masters list should be non-empty');
  // The wavefront should NOT propagate past the master (e is downstream of d,
  // and d is the firebreak - e should never be reached).
  const reachedIds = r.blast.map((b) => b.id);
  assert.ok(!reachedIds.includes('e'),
    'cascade should not propagate past a master firebreak; got blast = ' +
    JSON.stringify(reachedIds));
});

test('cascade: no master means no hard stop', () => {
  const graph = tinyGraph(); // no master
  const r = cascade(graph, ['a']);
  assert.equal(r.hardStop.tripped, false);
  // Without a firebreak, every dependent should be reached.
  const reachedIds = r.blast.map((b) => b.id).sort();
  assert.deepEqual(reachedIds, ['a', 'b', 'c', 'd', 'e']);
});
