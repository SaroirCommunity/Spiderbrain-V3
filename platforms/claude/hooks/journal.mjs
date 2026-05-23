#!/usr/bin/env node
/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// journal.mjs - the spiderbrain PostToolUse hook.
//
// Append-only and DUMB by design: one line to one file, no graph read, no
// JSON-of-the-brain parse, no lock. It must never slow down or block an edit,
// so EVERY path exits 0 and every error is swallowed. A broken brain must
// never stop a human (or an agent) from saving a file.
//
// Registered in .claude/settings.local.json as:
//   PostToolUse  matcher Edit|Write|MultiEdit  ->
//     node "<skill>/hooks/journal.mjs" --brain "<brain>" --project "<project>"

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : '';
}

function readStdin() {
  return new Promise((res) => {
    let data = '';
    let done = false;
    const finish = () => { if (!done) { done = true; res(data); } };
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', finish);
      process.stdin.on('error', finish);
    } catch { finish(); }
    setTimeout(finish, 800); // never hang the edit
  });
}

(async () => {
  try {
    const brain = arg('brain');
    if (!brain) process.exit(0);
    const project = arg('project');

    let payload = {};
    try { payload = JSON.parse(await readStdin()); } catch { process.exit(0); }

    const ti = payload.tool_input || {};
    const file = ti.file_path || ti.notebook_path || ti.path || '';
    if (!file || typeof file !== 'string') process.exit(0);

    const norm = file.replace(/\\/g, '/').replace(/\/+$/, '');
    const brainNorm = brain.replace(/\\/g, '/').replace(/\/+$/, '');

    // Platform-aware path comparison. Windows and default-APFS macOS are
    // case-insensitive at the filesystem layer, so a brain registered as
    // "/foo/Project-Brain" must still containment-match an incoming
    // "/foo/project-brain/synganglion.json" written by an editor that
    // canonicalised the case differently. Without the fold, mixed-case
    // paths would either (a) journal an edit to the brain itself, or
    // (b) drop a legitimate project edit as "outside the tree." Linux
    // (case-sensitive ext4/btrfs/xfs) keeps strict comparison.
    const ciFs = process.platform === 'win32' || process.platform === 'darwin';
    const fold = (p) => (ciFs ? p.toLowerCase() : p);

    // Segment-aware containment - startsWith(root) alone would also match a
    // sibling like "/foo/project-brain-backup" when root is "/foo/project-brain",
    // either suppressing legitimate edits (false positive) or, on the project
    // check, accepting edits that fall outside the project tree (security).
    const inOrUnder = (path, root) => {
      const p = fold(path);
      const r = fold(root);
      return p === r || p.startsWith(r + '/');
    };

    if (inOrUnder(norm, brainNorm)) process.exit(0); // never journal the brain itself
    if (project) {
      const projectNorm = project.replace(/\\/g, '/').replace(/\/+$/, '');
      if (!inOrUnder(norm, projectNorm)) process.exit(0); // outside the project tree
    }

    const cephDir = join(brain, 'cephalothorax');
    try { mkdirSync(cephDir, { recursive: true }); } catch { /* exists */ }
    const date = new Date().toISOString().slice(0, 10);
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      file,
      tool: payload.tool_name || '',
    }) + '\n';
    appendFileSync(join(cephDir, 'SESSION-' + date + '.jsonl'), line, 'utf8');
  } catch {
    // swallow everything - the hook is invisible when it fails
  }
  process.exit(0);
})();
