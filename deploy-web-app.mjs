#!/usr/bin/env node
/*
 * Copyright (c) 2026 Rob Graham / FAMTEC. All rights reserved.
 * Proprietary during the doctoral research period — see LICENSE.
 *
 * deploy-web-app.mjs — regenerate the public website's full-app page from the
 * canonical source and (optionally) publish it.
 *
 * The live page at fineartmedia.tech/app is a COPY of the ARCHAI app shell that
 * lives in a separate website project. Left to hand-copying it drifts out of
 * date (that is how it fell behind to v11.6.5 while the source moved to v11.6.7).
 * This script makes the copy deterministic and verifiable:
 *
 *   1. Read the canonical source  (ARCHAI_v10_8.html in this repo).
 *   2. Inject  window.ARCHAI_API_BASE  so the public page reaches the backend
 *      through the Cloudflare tunnel (the app needs this when it is NOT served
 *      from localhost / a LAN address — see the API config block in the source).
 *   3. Write it to the website project's  app.html.
 *   4. Verify the written file actually carries the new build marker + API base.
 *   5. If the website folder is a git repo, commit + push (Cloudflare Pages
 *      redeploys on push). Otherwise print the manual publish steps.
 *
 * Usage (run on the Mac Studio, from inside the ARCHAI APP repo):
 *
 *   node deploy-web-app.mjs              # sync + commit + push the website
 *   node deploy-web-app.mjs --dry-run    # show what would change, write nothing
 *   node deploy-web-app.mjs --no-push    # write app.html, do not git push
 *
 * Overridable via environment:
 *   ARCHAI_WEB_DIR   website project folder (default: ../fineartmedia-tech-web)
 *   ARCHAI_API_BASE  backend URL           (default: https://archai-api.fineartmedia.tech)
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_PUSH = args.includes('--no-push') || DRY_RUN;

const SRC = join(__dirname, 'ARCHAI_v10_8.html');
const WEB_DIR = process.env.ARCHAI_WEB_DIR || resolve(__dirname, '..', 'fineartmedia-tech-web');
const DEST = join(WEB_DIR, 'app.html');
const API_BASE = process.env.ARCHAI_API_BASE || 'https://archai-api.fineartmedia.tech';

const die = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };
const ok = (msg) => console.log(`✓ ${msg}`);

// ── 1. Read + validate the source ────────────────────────────────────────────
if (!existsSync(SRC)) die(`Source not found: ${SRC}`);
let html = readFileSync(SRC, 'utf8');

const buildMatch = html.match(/Build v(\d+\.\d+\.\d+)/);
if (!buildMatch) die('Could not find a "Build vX.Y.Z" marker in the source — refusing to deploy an unrecognised file.');
const buildVersion = buildMatch[1];

// Guard: every "Build vX.Y.Z" in the file must be identical. Today's stale-header
// bug was two different version strings (a static one and a JS one that overwrote
// it on load). If they disagree again, refuse to publish rather than ship a page
// whose header lies about which build it is.
const allVersions = [...html.matchAll(/Build v(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
const distinct = [...new Set(allVersions)];
if (distinct.length > 1) {
  die(`Inconsistent build versions in the source: ${distinct.join(', ')}.\n  The static header and the JS that rewrites it must match. Fix them, then deploy.`);
}
ok(`Source is Build v${buildVersion} — ${allVersions.length} version marker(s), all consistent (${SRC})`);

if (!html.includes('window.ARCHAI_API_BASE')) {
  die('Source no longer reads window.ARCHAI_API_BASE — the API-base contract changed. Fix this script before deploying.');
}

// ── 2. Inject the API base so the public page can reach the backend ──────────
// Placed immediately after <head> so it runs before the app's config block.
const inject = `\n<script>window.ARCHAI_API_BASE = ${JSON.stringify(API_BASE)};</script>`;
if (html.includes('window.ARCHAI_API_BASE =') && html.indexOf('<script>window.ARCHAI_API_BASE') !== -1) {
  // already injected (e.g. re-running on an already-deployed copy) — normalise it
  html = html.replace(/\n?<script>window\.ARCHAI_API_BASE\s*=[^<]*<\/script>/, '');
}
if (!/<head>/.test(html)) die('Source has no <head> tag to inject into — aborting.');
html = html.replace('<head>', `<head>${inject}`);
ok(`Injected window.ARCHAI_API_BASE = "${API_BASE}"`);

// ── 3. Guard the destination ─────────────────────────────────────────────────
if (!existsSync(WEB_DIR) || !statSync(WEB_DIR).isDirectory()) {
  die(`Website folder not found: ${WEB_DIR}\n  Set the correct path with:  ARCHAI_WEB_DIR=/path/to/website node deploy-web-app.mjs`);
}

if (DRY_RUN) {
  ok(`DRY RUN — would write ${DEST} (${html.length} bytes) at Build v${buildVersion}`);
  process.exit(0);
}

// ── 4. Write + verify ────────────────────────────────────────────────────────
writeFileSync(DEST, html, 'utf8');
const written = readFileSync(DEST, 'utf8');
if (!written.includes(`Build v${buildVersion}`)) die('Post-write check failed: build marker missing from app.html.');
if (!written.includes(`window.ARCHAI_API_BASE = ${JSON.stringify(API_BASE)}`)) die('Post-write check failed: API base missing from app.html.');
ok(`Wrote ${DEST} — verified Build v${buildVersion} + API base present`);

// ── 5. Publish ───────────────────────────────────────────────────────────────
const git = (cmdArgs) => execFileSync('git', ['-C', WEB_DIR, ...cmdArgs], { encoding: 'utf8' }).trim();

let isRepo = false;
try { isRepo = git(['rev-parse', '--is-inside-work-tree']) === 'true'; } catch { isRepo = false; }

if (!isRepo) {
  console.log(`\nℹ ${WEB_DIR} is not a git repo — file is updated but not published.`);
  console.log('  Publish it however this site normally deploys (upload app.html / run your Pages deploy).');
  process.exit(0);
}

if (NO_PUSH) {
  ok('--no-push set: app.html written, not committed. Review, then commit + push the website repo yourself.');
  process.exit(0);
}

const status = git(['status', '--porcelain', 'app.html']);
if (!status) {
  ok('app.html already up to date in the website repo — nothing to publish.');
  process.exit(0);
}

git(['add', 'app.html']);
git(['commit', '-m', `Sync live app page to Build v${buildVersion}`]);
try {
  git(['push']);
  ok(`Pushed website repo — Cloudflare will redeploy /app at Build v${buildVersion}.`);
  console.log('\n  Verify in ~1 min: hard-refresh fineartmedia.tech/app (Cmd-Shift-R) and check the header reads');
  console.log(`  "Build v${buildVersion} · … · AUXIO".`);
} catch (e) {
  die(`Commit succeeded but push failed:\n${e.message}\n  Fix the remote/auth and run:  git -C "${WEB_DIR}" push`);
}
