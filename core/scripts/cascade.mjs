#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// cascade.mjs - fire the nerve net at one or more nodes and read the pain.
//
//   node cascade.mjs --brain "<dir>" --inject "<nodeId>"
//   node cascade.mjs --brain "<dir>" --inject "<id1>,<id2>,<id3>"   (multi-fault)
//   node cascade.mjs --brain "<dir>" --self-test
//
// INJECT simulates one or more simultaneous faults and prints the cascade -
// the blast radius, the wavefront, and the TOPOLOGICAL origins (a corrupt node
// depending on no other corrupt node). With several faults it also breaks the
// blast down per origin front. This is the fault-injection test harness; the
// same cascade() runs on a real corruption during build and molt.
//
// SELF-TEST sweeps every node and flags where webscore and topology disagree.

import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cascade } from './lib/nervenet.mjs';
import { renderCascade } from './lib/render.mjs';
import { parseArgs, readJson, writeText } from './lib/io.mjs';

const score = (n) => (typeof n === 'number' ? n.toFixed(1) : '-');

function printReport(graph, report) {
  const s = report.signature;
  console.log('\n  ⚡ cascade - injected ' + report.badIds.length +
    ' node(s): ' + report.badIds.join(', '));
  console.log('  topological origin(s): ' + report.origins.length +
    ' of ' + report.badIds.length);
  for (const oc of s.originCells) {
    console.log('    • ' + oc.id + '  →  cell ' + oc.cell +
      '  (ring ' + oc.ring + ', sector ' + oc.sector + ')');
  }
  if (report.origins.length < report.badIds.length) {
    console.log('    (' + (report.badIds.length - report.origins.length) +
      ' injected node(s) were already downstream of an origin - ' +
      'eat the origin cell(s) and the rest heal with it)');
  }

  if (report.hardStop && report.hardStop.tripped) {
    console.log('\n  ⛔ HARD STOP - a cluster fault climbed into a theta master:');
    for (const mh of report.hardStop.masters) {
      console.log('     • ' + mh.id + '  (cell ' + mh.cell +
        ', depth +' + mh.depth + ')');
    }
    console.log('     gamma may never fell theta - the cascade halted AT the ' +
      'master, did not pass through. Fix the master, not the legs.');
  }

  console.log('\n  signature (merged blast of all faults)');
  console.log('    breadth (nodes hit)   : ' + s.breadth);
  console.log('    depth (shells)        : ' + s.depth);
  console.log('    speed (nodes / shell) : ' + s.speed);
  console.log('    immediate fan-out     : ' + s.immediateFanout);
  console.log('    cells tripped         : ' + s.cellsTripped);
  console.log('    rings crossed         : ' + s.ringsCrossed);
  console.log('    sectors crossed       : ' + s.sectorsCrossed);
  console.log('    weighted severity     : ' + s.weightedSeverity);

  console.log('\n  wavefront (the shockwave, shell by shell)');
  report.wavefront.forEach((n, d) => {
    console.log('    depth ' + d + ': ' + String(n).padStart(4) + '  ' +
      '#'.repeat(Math.min(50, n)));
  });

  console.log('\n  cells tripped (first = an origin)');
  for (const c of report.cells.slice(0, 14)) {
    console.log('    +' + c.tripDepth + '  ' + c.cell.padEnd(16) +
      ' ' + c.nodeCount + ' node(s)');
  }
  if (report.cells.length > 14) {
    console.log('    … and ' + (report.cells.length - 14) + ' more cells');
  }

  // Per-front breakdown - what each origin would do on its own.
  if (report.origins.length > 1) {
    console.log('\n  per-front breakdown (each origin\'s own cascade)');
    for (const id of report.origins) {
      const solo = cascade(graph, [id]).signature;
      console.log('    ' + id.padEnd(34) + ' breadth ' +
        String(solo.breadth).padStart(3) + '  depth ' + solo.depth +
        '  weighted ' + solo.weightedSeverity);
    }
  }
  console.log('');
}

function selfTest(graph) {
  const review = [];
  for (const [id, n] of Object.entries(graph.nodes)) {
    const blast = n.blastRadius || 0;
    if (n.ring <= 1 && blast <= 1) {
      review.push('  high webscore, near-zero reach  ' + id +
        '  (ring ' + n.ring + ', webscore ' + score(n.webscore) +
        ', blast ' + blast + ') - a genuine entrypoint, or edges missing?');
    } else if (n.ring >= 4 && blast >= 12) {
      review.push('  low webscore, wide reach        ' + id +
        '  (ring ' + n.ring + ', webscore ' + score(n.webscore) +
        ', blast ' + blast + ') - under-scored?');
    }
  }
  console.log('\n  cascade self-test - webscore (ring) vs topology (blast radius)\n');
  if (!review.length) {
    console.log('  ✅ webscore and topology agree across all ' +
      Object.keys(graph.nodes).length + ' nodes.\n');
    return;
  }
  for (const r of review) console.log(r);
  console.log('\n  ' + review.length + ' node(s) to review - not errors, ' +
    'questions. Confirm each entrypoint, or add the missing edges / re-judge ' +
    'the webscore.\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const brainDir = resolve(args.brain || process.cwd());
  const graph = readJson(join(brainDir, 'synganglion.json'), null);
  if (!graph) {
    console.error('No synganglion.json at ' + brainDir + ' - build the brain first.');
    process.exit(1);
  }

  if (args['self-test']) { selfTest(graph); return; }

  // Multiple targets: comma-separated --inject, plus any positional args.
  const targets = [];
  if (typeof args.inject === 'string') {
    for (const t of args.inject.split(',')) {
      const s = t.trim();
      if (s) targets.push(s);
    }
  }
  for (const p of args._ || []) targets.push(p);

  if (!targets.length) {
    console.error('Usage: cascade.mjs --brain <dir> --inject "<id>[,<id>,<id>]" [--report]');
    console.error('       cascade.mjs --brain <dir> --self-test');
    process.exit(1);
  }
  const missing = targets.filter((t) => !graph.nodes[t]);
  if (missing.length) {
    console.error('No such node(s): ' + missing.join(', '));
    for (const m of missing) {
      const near = Object.keys(graph.nodes)
        .filter((id) => id.toLowerCase().includes(m.toLowerCase()))
        .slice(0, 4);
      if (near.length) console.error('  for "' + m + '" did you mean: ' + near.join(', '));
    }
    process.exit(1);
  }

  const report = cascade(graph, targets);
  printReport(graph, report);
  if (args.report) {
    writeText(join(brainDir, 'cascade-report.md'), renderCascade(graph, report));
    console.log('  report → ' + join(brainDir, 'cascade-report.md') + '\n');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (e) { console.error('cascade failed: ' + e.message); process.exit(1); }
}
