/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// graph.mjs - assemble the synganglion: nodes, clusters, the polar cell grid,
// the theta-gamma column layer, webscores, amplitudes, and the adjacency.
//
// Three directions now. The web (afferent `dependsOn`, efferent `dependedOnBy`)
// is the gamma plane - fast, peer, data flow. The column (`modulatedBy` up to a
// master, `modulates` down to a cluster) is the theta axis - slow, vertical,
// governance. A master is a node of high mass and low rhythm; it sets the
// rhythm a cluster of fast nodes executes on. webscore is `mass` (static);
// `amplitude` is the live value - mass scaled by how recently the master fired.

import { globToRe } from './scan.mjs';
import { reach } from './nervenet.mjs';
import { createHash } from 'node:crypto';

const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const isoOf = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);

// kinds that can be a master (theta). A field is always gamma.
const MASTER_KINDS = new Set(['code', 'config', 'style', 'sql', 'table', 'content']);

function matchPattern(rel, pat) {
  if (pat === rel) return true;
  if (!pat.includes('*')) {
    return rel === pat || rel.startsWith(pat.endsWith('/') ? pat : pat + '/');
  }
  return globToRe(pat).test(rel);
}

/** First matching cluster rule wins; rules are ordered specific -> general. */
export function clusterOf(rel, clusterRules) {
  for (const rule of clusterRules || []) {
    for (const pat of rule.patterns || []) {
      if (matchPattern(rel, pat)) return rule.cluster;
    }
  }
  return 'unsorted';
}

function fieldAuto(decl) {
  const up = (decl || '').toUpperCase();
  let s = 3.0;
  if (up.includes('PRIMARY KEY')) s += 3.0;
  if (/\bUNIQUE\b/.test(up)) s += 1.5;
  if (up.includes('NOT NULL')) s += 1.3;
  if (up.includes('REFERENCES')) s += 1.0;
  return clamp(round1(s), 0.5, 9.5);
}

function ringOf(webscore, cuts) {
  for (let i = 0; i < cuts.length; i += 1) if (webscore >= cuts[i]) return i;
  return cuts.length;
}

function readOverride(ov) {
  if (ov == null) return {};
  if (typeof ov === 'number') return { webscore: ov };
  return { webscore: ov.webscore, role: ov.role, note: ov.note };
}

/**
 * Build the full synganglion graph object.
 *
 * @param meta {{prey,project,sourceHash,generatedBy,changeTimes:Map,commitCounts:Map}}
 */
export function buildGraph(scanResult, db, config, overrides, meta) {
  const displayK = config.displayK || 8;
  const ringCuts = Array.isArray(config.rings) && config.rings.length
    ? config.rings : [8.5, 7, 5, 3];
  const changeTimes = meta.changeTimes || new Map();
  const commitCounts = meta.commitCounts || new Map();
  const warnings = [...(scanResult.warnings || [])];
  const nowSec = Math.floor(Date.now() / 1000);
  overrides = overrides || {};
  const nodes = {};

  const fileSec = (path, mtimeMs) => changeTimes.get(path)
    || (mtimeMs ? Math.round(mtimeMs / 1000) : 0);

  // ---- 1. file nodes ----
  for (const [id, f] of scanResult.files) {
    const ov = readOverride(overrides[id]);
    const sec = fileSec(id, f.mtimeMs);
    nodes[id] = {
      cluster: clusterOf(id, config.clusterRules),
      kind: f.kind,
      role: ov.role || '',
      webscore: 0, webscoreAuto: 0, amplitude: 0,
      ring: 0, cell: '', blastRadius: 0,
      rhythm: commitCounts.get(id) || 0,
      isMaster: false, layer: 'gamma', master: null, column: null,
      modulatedBy: [], modulates: [],
      dependsOn: [], dependedOnBy: [],
      fileCount: f.fileCount || 1,
      contentHash: f.contentHash || '',
      lastChangedAt: isoOf(sec),
      dependencyChangedAt: [],
      _sec: sec,
    };
    if (ov.note) nodes[id].note = ov.note;
  }

  // ---- 2. DB table + field nodes ----
  if (db && db.tables) {
    for (const [table, def] of db.tables) {
      const tid = 'db:' + table;
      const tov = readOverride(overrides[tid]);
      const tSec = changeTimes.get(def.sourceFile) || 0;
      nodes[tid] = {
        cluster: 'database', kind: 'table',
        role: tov.role || `D1 table - ${def.columns.length} fields`,
        webscore: 0, webscoreAuto: 0, amplitude: 0,
        ring: 0, cell: '', blastRadius: 0,
        rhythm: commitCounts.get(def.sourceFile) || 0,
        isMaster: false, layer: 'gamma', master: null, column: null,
        modulatedBy: [], modulates: [],
        dependsOn: [], dependedOnBy: [], fileCount: 1,
        contentHash: sha12(def.columns.map((c) => c.name + ' ' + c.decl).sort().join('\n')),
        lastChangedAt: isoOf(tSec), dependencyChangedAt: [], _sec: tSec,
      };
      if (tov.note) nodes[tid].note = tov.note;
      for (const col of def.columns) {
        const fid = `db:${table}.${col.name}`;
        const fov = readOverride(overrides[fid]);
        const cSec = changeTimes.get(col.sourceFile) || tSec;
        nodes[fid] = {
          cluster: 'database', kind: 'field',
          role: fov.role || col.decl,
          webscore: 0, webscoreAuto: fieldAuto(col.decl), amplitude: 0,
          ring: 0, cell: '', blastRadius: 0,
          rhythm: commitCounts.get(col.sourceFile) || 0,
          isMaster: false, layer: 'gamma', master: null, column: null,
          modulatedBy: [], modulates: [],
          dependsOn: [], dependedOnBy: [], fileCount: 1,
          contentHash: sha12(col.name + ' ' + col.decl),
          lastChangedAt: isoOf(cSec), dependencyChangedAt: [], _sec: cSec,
          decl: col.decl,
        };
        if (fov.note) nodes[fid].note = fov.note;
      }
    }
  }

  // ---- 3. edges ----
  const rawEdges = [...scanResult.edges];
  if (db && db.tables) {
    for (const [table, def] of db.tables) {
      for (const col of def.columns) {
        rawEdges.push([`db:${table}.${col.name}`, 'db:' + table]);
      }
    }
    for (const [from, to] of db.fks || []) {
      rawEdges.push(['db:' + from, 'db:' + to]);
      const ft = from.split('.')[0];
      const tt = to.split('.')[0];
      if (ft !== tt) rawEdges.push(['db:' + ft, 'db:' + tt]);
    }
  }
  let badExtra = 0;
  for (const e of config.extraEdges || []) {
    if (!Array.isArray(e) || e.length < 2
      || typeof e[0] !== 'string' || typeof e[1] !== 'string') {
      badExtra += 1;
      continue;
    }
    rawEdges.push([e[0], e[1]]);
  }
  if (badExtra) {
    warnings.push(`${badExtra} malformed config.extraEdges entr` +
      `${badExtra === 1 ? 'y was' : 'ies were'} skipped.`);
  }
  const seen = new Set();
  const edges = [];
  let droppedEdges = 0;
  for (const [from, to] of rawEdges) {
    if (!from || !to || from === to) continue;
    if (!nodes[from] || !nodes[to]) { droppedEdges += 1; continue; }
    const key = from + ' ' + to;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([from, to]);
    nodes[from].dependsOn.push(to);
    nodes[to].dependedOnBy.push(from);
  }
  if (droppedEdges) {
    warnings.push(`${droppedEdges} edge(s) pointed at a missing node - ` +
      `check config.extraEdges for typos.`);
  }

  // ---- 4. webscoreAuto (transitive dependents) + webscore ----
  const depMap = new Map();
  const depsMap = new Map();
  for (const [id, n] of Object.entries(nodes)) {
    depMap.set(id, n.dependedOnBy);
    depsMap.set(id, n.dependsOn);
  }
  for (const [id, n] of Object.entries(nodes)) {
    const tdc = reach(depMap, [id]).size - 1;
    n.blastRadius = tdc;
    if (n.kind === 'field') {
      n.webscoreAuto = clamp(round1(n.webscoreAuto + 0.5 * Math.log2(1 + tdc)), 0.5, 9.6);
    } else {
      const bonus = { config: 2.0, sql: 2.0, style: 1.4, html: 0.5, table: 1.6, content: -0.6 }[n.kind] || 0;
      n.webscoreAuto = clamp(round1(2.0 + 1.45 * Math.log2(1 + tdc) + bonus), 0.5, 9.6);
    }
    const ov = readOverride(overrides[id]).webscore;
    n.webscore = typeof ov === 'number' ? clamp(round1(ov), 0, 10) : n.webscoreAuto;
  }

  // ---- 5. polar coordinate ----
  for (const n of Object.values(nodes)) {
    n.ring = ringOf(n.webscore, ringCuts);
    n.cell = 'r' + n.ring + ':' + n.cluster;
  }

  // ---- 6. master detection (theta) - high mass × low rhythm ----
  // Every sector keeps at least one master: its heaviest non-field node. On top
  // of that, any heavy + slow node is a master. Masters are few; gamma is many.
  const masterMassMin = typeof config.masterMassMin === 'number' ? config.masterMassMin : 8.5;
  const forced = new Set(config.masters || []);
  const rhythms = Object.values(nodes)
    .filter((n) => MASTER_KINDS.has(n.kind)).map((n) => n.rhythm).sort((a, b) => a - b);
  const rhythmCutoff = typeof config.masterRhythmMax === 'number'
    ? config.masterRhythmMax
    : (rhythms.length ? rhythms[Math.floor(rhythms.length * 0.6)] : 0);
  const sectorTop = {};
  for (const [id, n] of Object.entries(nodes)) {
    if (!MASTER_KINDS.has(n.kind)) continue;
    if (!sectorTop[n.cluster] || n.webscore > nodes[sectorTop[n.cluster]].webscore) {
      sectorTop[n.cluster] = id;
    }
  }
  const sectorTopIds = new Set(Object.values(sectorTop));
  for (const [id, n] of Object.entries(nodes)) {
    if (forced.has(id)) n.isMaster = MASTER_KINDS.has(n.kind);
    else if (!MASTER_KINDS.has(n.kind)) n.isMaster = false;
    else if (sectorTopIds.has(id)) n.isMaster = true;
    else n.isMaster = n.webscore >= masterMassMin && n.rhythm <= rhythmCutoff;
    n.layer = n.isMaster ? 'theta' : 'gamma';
  }

  // ---- 7. columns + the third direction (modulation) ----
  // A node's master is its NEAREST theta upstream - minimum dependency
  // distance, not maximum mass. Nearest-master assignment forms the column
  // around the theta that most directly governs each node, balancing columns
  // toward the ideal 1 + 8 instead of pooling everything into the heaviest.
  for (const [id, n] of Object.entries(nodes)) {
    const up = reach(depsMap, [id]); // Map<themeId, depth>
    const thetas = [...up.keys()]
      .filter((t) => t !== id && nodes[t] && nodes[t].isMaster);
    n.modulatedBy = [...thetas].sort((a, b) => nodes[b].webscore - nodes[a].webscore);
    if (n.isMaster) {
      n.master = id;
      n.column = id;
    } else {
      let best = null;
      let bestDepth = Infinity;
      for (const t of thetas) {
        const d = up.get(t);
        if (d < bestDepth
          || (d === bestDepth && nodes[t].webscore > (best ? nodes[best].webscore : -1))) {
          best = t;
          bestDepth = d;
        }
      }
      n.master = best || sectorTop[n.cluster] || null;
      n.column = n.master || 'column:none';
    }
  }
  for (const n of Object.values(nodes)) n.modulates = [];
  for (const [id, n] of Object.entries(nodes)) {
    if (!n.isMaster && n.master && nodes[n.master]) nodes[n.master].modulates.push(id);
  }

  // ---- 8. amplitude - mass scaled by how recently the master fired ----
  const thetaGain = (masterId) => {
    const m = masterId && nodes[masterId];
    if (!m || !m._sec) return 1;
    const ageDays = Math.max(0, (nowSec - m._sec) / 86400);
    return 1 + 2 * Math.exp(-ageDays / 14); // fired today ≈ 3, long quiet → 1
  };
  for (const [id, n] of Object.entries(nodes)) {
    const gain = n.isMaster ? thetaGain(id) : thetaGain(n.master);
    n.amplitude = round1(n.webscore * gain);
  }

  // ---- 9. dependencyChangedAt ----
  for (const n of Object.values(nodes)) {
    if (!n._sec) continue;
    for (const depId of n.dependsOn) {
      const dep = nodes[depId];
      if (dep && dep._sec && dep._sec > n._sec) {
        n.dependencyChangedAt.push({ dep: depId, at: dep.lastChangedAt });
      }
    }
  }

  // ---- 10. order adjacency by webscore ----
  const byScore = (a, b) =>
    (nodes[b]?.webscore || 0) - (nodes[a]?.webscore || 0) || a.localeCompare(b);
  for (const n of Object.values(nodes)) {
    n.dependsOn.sort(byScore);
    n.dependedOnBy.sort(byScore);
    n.modulatedBy.sort(byScore);
    n.modulates.sort(byScore);
  }

  // ---- 11. clusters, cells, columns ----
  const clusterTitles = config.clusterTitles || {};
  const clusterWebscores = config.clusterWebscores || {};
  const grouped = {};
  for (const [id, n] of Object.entries(nodes)) (grouped[n.cluster] ||= []).push(id);
  const clusters = {};
  for (const [name, ids] of Object.entries(grouped)) {
    ids.sort(byScore);
    const scores = ids.map((i) => nodes[i].webscore);
    const computed = scores.length
      ? round1(0.6 * Math.max(...scores)
        + 0.4 * (scores.reduce((a, b) => a + b, 0) / scores.length))
      : 0;
    clusters[name] = {
      title: clusterTitles[name] || name,
      webscore: typeof clusterWebscores[name] === 'number'
        ? round1(clusterWebscores[name]) : computed,
      nodeCount: ids.length,
      master: sectorTop[name] || null,
      // displayK legs PLUS the master = the column of 9
      topNodes: ids.slice(0, displayK + 1),
    };
  }

  const cells = {};
  for (const n of Object.values(nodes)) {
    const c = (cells[n.cell] ||= {
      ring: n.ring, sector: n.cluster, nodeCount: 0, maxWebscore: 0,
    });
    c.nodeCount += 1;
    c.maxWebscore = Math.max(c.maxWebscore, n.webscore);
  }

  const columns = {};
  for (const [id, n] of Object.entries(nodes)) {
    if (n.isMaster) {
      columns[id] = {
        master: id, sector: n.cluster, webscore: n.webscore,
        rhythm: n.rhythm, members: [...n.modulates], size: n.modulates.length + 1,
      };
    }
  }

  const masters = Object.keys(nodes).filter((id) => nodes[id].isMaster).sort(byScore);

  // ---- 12. integrity warnings ----
  for (const k of Object.keys(overrides)) {
    if (k.startsWith('_')) continue;
    if (!nodes[k]) {
      warnings.push(`webscore-overrides.json key "${k}" matches no node - typo?`);
    }
  }
  for (const c of new Set((config.clusterRules || []).map((r) => r.cluster))) {
    if (!clusters[c]) warnings.push(`cluster "${c}" matched 0 nodes.`);
  }

  for (const n of Object.values(nodes)) delete n._sec;

  return {
    spiderbrain: 2,
    generatedAt: new Date().toISOString(),
    generatedBy: meta.generatedBy || 'graph.mjs',
    sourceHash: meta.sourceHash || '',
    prey: meta.prey || config.prey || '',
    project: meta.project || config.project || '',
    displayK,
    columnSize: (config.columnSize || displayK + 1),
    rings: ringCuts,
    warnings,
    stats: {
      nodeCount: Object.keys(nodes).length,
      edgeCount: edges.length,
      clusterCount: Object.keys(clusters).length,
      cellCount: Object.keys(cells).length,
      masterCount: masters.length,
      columnCount: Object.keys(columns).length,
    },
    masters,
    clusters,
    cells,
    columns,
    nodes,
    edges,
  };
}
