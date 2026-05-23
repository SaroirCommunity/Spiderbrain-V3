/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// nervenet.mjs - the cascade engine. Pure, deterministic, zero I/O.
//
// Given the graph and a set of corrupt nodes, it propagates the failure along
// DEPENDENT edges and reports the blast radius, the wavefront, the cells
// tripped, and - by topology, not a clock - the origin.
//
// THE HARD STOP. A fault may ripple down a column (theta → gamma) freely. A
// fault that climbs UP - a gamma cluster node felling its own theta master -
// must halt. So the cascade treats every master as a firebreak: it is recorded
// when the wave reaches it, but the wave never propagates THROUGH it. If a
// gamma-origin cascade reaches a master, `hardStop` trips. Gamma may never set
// theta's rhythm; if the cluster can break the master, the column loses its
// frame.

/**
 * Breadth-first reach over an adjacency map. Map<id,depth>; starts at depth 0.
 * A node in `stopSet` is recorded but never expanded - a firebreak.
 */
export function reach(adjacency, startIds, stopSet) {
  const stop = stopSet || new Set();
  const depth = new Map();
  let frontier = [];
  for (const id of startIds) {
    if (!depth.has(id)) { depth.set(id, 0); frontier.push(id); }
  }
  let d = 0;
  while (frontier.length) {
    d += 1;
    const next = [];
    for (const id of frontier) {
      for (const nb of adjacency.get(id) || []) {
        if (depth.has(nb)) continue;
        depth.set(nb, d);
        if (!stop.has(nb)) next.push(nb); // a firebreak is recorded, not expanded
      }
    }
    frontier = next;
  }
  return depth;
}

const dependentsMap = (graph) => {
  const m = new Map();
  for (const [id, n] of Object.entries(graph.nodes)) m.set(id, n.dependedOnBy || []);
  return m;
};
const dependenciesMap = (graph) => {
  const m = new Map();
  for (const [id, n] of Object.entries(graph.nodes)) m.set(id, n.dependsOn || []);
  return m;
};

/** Count of transitive dependents - the true blast-radius size of a node. */
export function transitiveDependentCount(id, depMap) {
  return reach(depMap, [id]).size - 1;
}

/**
 * The topological origins among a set of corrupt nodes: a corrupt node that
 * does not (transitively) depend on any other corrupt node. The first domino.
 */
export function origins(graph, badIds) {
  const deps = dependenciesMap(graph);
  const bad = new Set(badIds);
  const roots = [];
  for (const id of badIds) {
    const myDeps = reach(deps, [id]);
    let hasBadDep = false;
    for (const dep of myDeps.keys()) {
      if (dep !== id && bad.has(dep)) { hasBadDep = true; break; }
    }
    if (!hasBadDep) roots.push(id);
  }
  return roots.length ? roots : [...badIds];
}

/** The full cascade report for a set of corrupt nodes. */
export function cascade(graph, badIds) {
  const depMap = dependentsMap(graph);
  const badSet = new Set(badIds);
  const masterSet = new Set(
    Object.keys(graph.nodes).filter((id) => graph.nodes[id].isMaster),
  );
  // every master that is NOT itself an injected fault is a firebreak
  const stopSet = new Set([...masterSet].filter((id) => !badSet.has(id)));

  const hit = reach(depMap, badIds, stopSet);
  const roots = origins(graph, badIds);

  const blast = [];
  const wavefront = [];
  const cellDepth = new Map();
  let maxDepth = 0;
  let weighted = 0;
  for (const [id, d] of hit) {
    const n = graph.nodes[id] || {};
    blast.push({
      id, depth: d, webscore: n.webscore || 0, cell: n.cell || '?',
      isMaster: !!n.isMaster,
    });
    maxDepth = Math.max(maxDepth, d);
    wavefront[d] = (wavefront[d] || 0) + 1;
    weighted += n.webscore || 0;
    const cur = cellDepth.get(n.cell || '?');
    if (cur === undefined || d < cur) cellDepth.set(n.cell || '?', d);
  }
  for (let i = 0; i <= maxDepth; i += 1) if (wavefront[i] === undefined) wavefront[i] = 0;

  const cells = [...cellDepth.entries()]
    .map(([cell, tripDepth]) => {
      const [r, sector] = String(cell).split(':');
      return {
        cell,
        ring: Number(String(r).replace('r', '')) || 0,
        sector: sector || '?',
        tripDepth,
        nodeCount: blast.filter((b) => b.cell === cell).length,
      };
    })
    .sort((a, b) => a.tripDepth - b.tripDepth || b.nodeCount - a.nodeCount);

  // THE HARD STOP - a gamma-origin cascade that reached a theta master.
  const gammaOrigin = badIds.some((id) => !(graph.nodes[id] || {}).isMaster);
  const mastersHit = [...hit.keys()]
    .filter((id) => masterSet.has(id) && !badSet.has(id))
    .sort((a, b) => (hit.get(a) || 0) - (hit.get(b) || 0));
  const hardStop = {
    tripped: gammaOrigin && mastersHit.length > 0,
    masters: mastersHit.map((id) => ({
      id, depth: hit.get(id), cell: (graph.nodes[id] || {}).cell || '?',
    })),
  };

  const o = graph.nodes[roots[0]] || {};
  const breadth = blast.length;
  return {
    badIds: [...badIds],
    origins: roots,
    hardStop,
    blast: blast.sort((a, b) => a.depth - b.depth || b.webscore - a.webscore),
    wavefront,
    cells,
    signature: {
      originCell: o.cell || '?',
      originRing: o.ring == null ? null : o.ring,
      originSector: o.cluster || '?',
      originCells: roots.map((id) => {
        const rn = graph.nodes[id] || {};
        return {
          id,
          cell: rn.cell || '?',
          ring: rn.ring == null ? null : rn.ring,
          sector: rn.cluster || '?',
        };
      }),
      breadth,
      depth: maxDepth,
      speed: Math.round((breadth / Math.max(1, maxDepth)) * 100) / 100,
      immediateFanout: wavefront[1] || 0,
      cellsTripped: cells.length,
      ringsCrossed: new Set(cells.map((c) => c.ring)).size,
      sectorsCrossed: new Set(cells.map((c) => c.sector)).size,
      weightedSeverity: Math.round(weighted * 10) / 10,
      hardStop: hardStop.tripped,
    },
  };
}
