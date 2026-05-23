/*
 * SpiderBrain v3 © 2026 Perform Digital Pvt Ltd
 *
 * Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.
 *
 * Contact: contact@perform.digital
 */

// io.mjs - shared filesystem + argument helpers. Zero dependencies.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, renameSync,
  openSync, closeSync, fsyncSync, unlinkSync,
} from 'node:fs';
import { dirname } from 'node:path';

// Flags that always take a value - so a value beginning with "-" or "--"
// (a label like "--hotfix", a prey starting with a dash) is not misread as
// the next flag. Fixes the parseArgs swallow bug.
const VALUE_FLAGS = new Set([
  'brain', 'project', 'prey', 'deploy', 'inject', 'restore', 'config', 'rings',
]);

/** Parse `--key value`, `--key=value`, and bare `--flag`. */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq !== -1) { args[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (VALUE_FLAGS.has(key)) {
      args[key] = next === undefined ? true : next;
      if (next !== undefined) i += 1;
    } else if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function ensureDir(dir) {
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Legacy reader - returns `fallback` for BOTH a missing and a corrupt file.
 * Safe ONLY for generated files (a corrupt synganglion.json is fixed by a
 * rebuild). NEVER use it for curated files - see readJsonSafe.
 */
export function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return fallback; }
}

/**
 * Curated-safe reader. Distinguishes missing from corrupt - the root fix for
 * findings #1/#2: a parse error must never look like "no file, regenerate it".
 * @returns {{status:'ok',data}|{status:'missing'}|{status:'corrupt',error}|{status:'unreadable',error}}
 */
export function readJsonSafe(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    if (e && e.code === 'ENOENT') return { status: 'missing' };
    return { status: 'unreadable', error: String((e && e.message) || e) };
  }
  try {
    return { status: 'ok', data: JSON.parse(text) };
  } catch (e) {
    return { status: 'corrupt', error: String((e && e.message) || e) };
  }
}

export function writeJson(path, obj) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

/**
 * Atomic JSON write. Writes to `path + '.tmp'` first, fsyncs (best-effort),
 * then renames over the destination. A crash mid-write leaves either the old
 * file untouched or a `.tmp` file, never a truncated target.
 *
 * Use this for CURATED files (config, overrides, movemap). Generated files
 * (synganglion.json, views) can use writeJson - a corrupt generated file is
 * fixed by a rebuild; a corrupt curated file is data loss.
 *
 * Tolerates Windows rename-over-existing quirks by falling back to
 * unlink-then-rename. The window is tiny; the alternative (a stranded .tmp
 * blocking subsequent writes) is worse.
 */
export function writeJsonAtomic(path, obj) {
  ensureDir(dirname(path));
  const tmp = path + '.tmp';
  const payload = JSON.stringify(obj, null, 2) + '\n';
  writeFileSync(tmp, payload, 'utf8');
  // Best-effort fsync so the data hits disk before the rename. Not all
  // platforms / filesystems support fsync of a file just written via
  // writeFileSync; swallowing the failure is safe - the OS will flush.
  try {
    const fd = openSync(tmp, 'r+');
    try { fsyncSync(fd); } finally { closeSync(fd); }
  } catch { /* fsync not supported here - proceed */ }
  try {
    renameSync(tmp, path);
  } catch {
    // Windows + some FS combos can refuse rename-over. Fall back to
    // unlink-then-rename. Atomicity gap is sub-millisecond; better than
    // leaving the destination in a half-written state.
    try { if (existsSync(path)) unlinkSync(path); } catch { /* ignore */ }
    renameSync(tmp, path);
  }
}

export function writeText(path, text) {
  ensureDir(dirname(path));
  writeFileSync(path, text, 'utf8');
}

/** Write only if the file is absent. Returns true if it wrote. */
export function writeIfAbsent(path, text) {
  if (existsSync(path)) return false;
  writeText(path, text);
  return true;
}

export { existsSync, readFileSync, renameSync };
