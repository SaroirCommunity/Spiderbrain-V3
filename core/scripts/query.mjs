#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// query.mjs - ask the brain.
//
//   node query.mjs --brain "<dir>" "<terms>"
//   node query.mjs --brain "<dir>"            (no terms: what matters / what is hot)
//
// A spider locates prey by which thread rings loudest. This ranks nodes the
// same way: webscore (thread tension) combined with recency (vibration).
// Nodes with no known change-time get recency 0 - they never falsely rank hot.

import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, readJson } from './lib/io.mjs';

const score = (n) => (typeof n === 'number' ? n.toFixed(1) : '  -');

function main() {
  const args = parseArgs(process.argv.slice(2));
  const brainDir = resolve(args.brain || process.cwd());
  const graph = readJson(join(brainDir, 'synganglion.json'), null);
  if (!graph) {
    console.error('No synganglion.json at ' + brainDir + ' - build the brain first.');
    process.exit(1);
  }
  const terms = (args._ || []).join(' ').toLowerCase().trim();
  const ids = Object.keys(graph.nodes);

  // recency rank - only dated nodes get a slot; undated -> 0 (never falsely hot)
  const dated = ids.filter((id) => graph.nodes[id].lastChangedAt);
  dated.sort((a, b) => (graph.nodes[b].lastChangedAt || '')
    .localeCompare(graph.nodes[a].lastChangedAt || ''));
  const recencyN = new Map();
  dated.forEach((id, i) =>
    recencyN.set(id, dated.length > 1 ? 1 - i / (dated.length - 1) : 1));

  console.log('\n  prey: ' + (graph.prey || '-') + '\n');

  if (terms && graph.clusters[terms]) {
    const c = graph.clusters[terms];
    console.log('  cluster "' + terms + '"  ·  webscore ' + score(c.webscore) +
      '  ·  ' + c.nodeCount + ' nodes');
    console.log('  ' + (c.title || '') + '\n');
    console.log('  top legs (by webscore):');
    for (const id of c.topNodes) {
      const n = graph.nodes[id];
      console.log('   ' + score(n.webscore) + '  [' + n.cell + ']  ' + id +
        (n.role ? '  - ' + n.role : ''));
    }
    console.log('');
    return;
  }

  let candidates;
  if (!terms) {
    candidates = ids;
  } else {
    candidates = ids.filter((id) => {
      const n = graph.nodes[id];
      return id.toLowerCase().includes(terms) ||
        (n.role || '').toLowerCase().includes(terms) ||
        (n.cluster || '').toLowerCase().includes(terms);
    });
    if (!candidates.length) {
      const parts = terms.split(/\s+/);
      candidates = ids.filter((id) => {
        const n = graph.nodes[id];
        const hay = (id + ' ' + (n.role || '') + ' ' + n.cluster).toLowerCase();
        return parts.some((p) => hay.includes(p));
      });
    }
  }

  const ranked = candidates
    .map((id) => {
      const n = graph.nodes[id];
      const combined = 0.6 * ((n.webscore || 0) / 10) + 0.4 * (recencyN.get(id) || 0);
      return { id, n, combined };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 14);

  if (!ranked.length) {
    console.log('  no nodes match "' + terms + '".\n');
    return;
  }
  console.log('  ' + (terms ? 'matches for "' + terms + '"'
    : 'what matters and what is hot') + '   (webscore × recency)\n');
  console.log('  combined  webscore  cell           node');
  for (const r of ranked) {
    console.log('   ' + r.combined.toFixed(3) + '     ' + score(r.n.webscore) +
      '   ' + (r.n.cell || '?').padEnd(14) + ' ' + r.id +
      (r.n.role ? '  - ' + r.n.role : ''));
  }
  console.log('');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (e) { console.error('query failed: ' + e.message); process.exit(1); }
}
