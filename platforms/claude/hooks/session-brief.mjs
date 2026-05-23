#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// session-brief.mjs - the spiderbrain SessionStart hook.
//
// Prints a short brief so the brain announces itself at the start of every
// session: the prey, the hottest files still in the cephalothorax, and the top
// of spideyorder. This is the literal mechanism by which the brain "stays
// active" - it speaks first, every session.
//
// Registered in .claude/settings.local.json as:
//   SessionStart -> node "<skill>/hooks/session-brief.mjs" --brain "<brain>"

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : '';
}

function emit(text) {
  // The documented way for a SessionStart hook to inject context.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: text,
    },
  }));
}

try {
  const brain = arg('brain');
  if (!brain) process.exit(0);

  let graph = null;
  try {
    graph = JSON.parse(readFileSync(join(brain, 'synganglion.json'), 'utf8'));
  } catch {
    process.exit(0); // no brain built yet - say nothing
  }

  const lines = [];
  lines.push('spiderbrain active - ' + brain);
  lines.push('Prey: ' + (graph.prey || '-'));
  lines.push('Brain: ' + graph.stats.nodeCount + ' nodes, ' +
    graph.stats.edgeCount + ' synapses, ' + graph.stats.clusterCount +
    ' clusters.');

  // hot files still sitting in the cephalothorax (not yet consolidated)
  const hot = new Set();
  try {
    const cephDir = join(brain, 'cephalothorax');
    for (const f of readdirSync(cephDir)) {
      if (!f.startsWith('SESSION-') || !f.endsWith('.jsonl')) continue;
      for (const ln of readFileSync(join(cephDir, f), 'utf8').split('\n')) {
        const t = ln.trim();
        if (!t) continue;
        try { const e = JSON.parse(t); if (e.file) hot.add(e.file); } catch {}
      }
    }
  } catch { /* no cephalothorax */ }
  if (hot.size) {
    lines.push('Hot files still in cephalothorax (' + hot.size + '): ' +
      [...hot].slice(0, 8).join(', ') +
      '  - consolidate at the next deploy.');
  }

  const top = Object.entries(graph.nodes)
    .sort((a, b) => (b[1].webscore || 0) - (a[1].webscore || 0))
    .slice(0, 6)
    .map(([id, n]) => id + ' ' + (n.webscore || 0).toFixed(1));
  lines.push('Highest webscore: ' + top.join('  ·  '));
  lines.push('Before editing a file, read its cluster webmap and scan its ' +
    'dependents (Portia\'s rule). Upkeep protocol: SPIDERBRAIN.md.');

  emit(lines.join('\n'));
} catch {
  // never break a session start
}
process.exit(0);
