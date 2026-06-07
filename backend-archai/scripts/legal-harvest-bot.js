#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Legal Harvest Bot
// Reads the onboarding registry and only runs harvesters that pass
// the current legal / quality gate.
//
// Usage:
//   node legal-harvest-bot.js --report
//   node legal-harvest-bot.js --run-ready --include-live --dry-run
//   node legal-harvest-bot.js --targets=tepapa,mplus,brasiliana --run-ready
// ══════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_PATH = path.join(__dirname, 'collection-targets.json');

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(`--${flag}`);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const found = args.find(arg => arg.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const REPORT_ONLY = !hasFlag('run-ready');
const INCLUDE_LIVE = hasFlag('include-live');
const INCLUDE_REVIEW = hasFlag('include-review');
const ALLOW_NONCOMMERCIAL = hasFlag('allow-noncommercial');
const DRY_RUN = hasFlag('dry-run');
const LIMIT = parseInt(getArg('limit', '120'), 10);
const MAX_TARGETS = parseInt(getArg('max-targets', '999'), 10);
const TARGETS = new Set(
  getArg('targets', '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const AS_JSON = hasFlag('json');

const AUTO_POLICIES = new Set([
  'approved_open',
  'approved_with_item_rights_check',
  'live_with_item_rights_check',
  'live_with_placeholder_filter'
]);

const REVIEW_POLICIES = new Set([
  'approved_metadata_with_partner_rights_check',
  'approved_dataset_with_image_rights_recheck',
  'approved_metadata_with_item_media_check'
]);

const HOLD_POLICIES = new Set([
  'pending_verification',
  'hold_public_demo_pending_media_rights'
]);

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function targetHarvesterPath(target) {
  if (!target.harvester_script) return null;
  return path.join(__dirname, target.harvester_script);
}

function isVerifiedTarget(target) {
  return String(target.verification_status || '').startsWith('verified_')
    || String(target.verification_status || '').startsWith('partially_verified_');
}

function evaluateTarget(target) {
  const policy = target.public_demo_policy || '';
  const status = target.status || '';
  const harvesterPath = targetHarvesterPath(target);

  if (!harvesterPath || !fs.existsSync(harvesterPath)) {
    return {
      queue: 'blocked',
      reason: 'No harvester script wired yet',
      harvesterPath: null
    };
  }

  if (status === 'hold' || HOLD_POLICIES.has(policy)) {
    return {
      queue: 'blocked',
      reason: 'Held by legal / media policy gate',
      harvesterPath
    };
  }

  if (!isVerifiedTarget(target)) {
    return {
      queue: 'blocked',
      reason: 'Verification is still pending',
      harvesterPath
    };
  }

  if (policy === 'noncommercial_only' && !ALLOW_NONCOMMERCIAL) {
    return {
      queue: 'blocked',
      reason: 'Non-commercial source; rerun with --allow-noncommercial if appropriate',
      harvesterPath
    };
  }

  if (REVIEW_POLICIES.has(policy) && !INCLUDE_REVIEW) {
    return {
      queue: 'review',
      reason: 'Needs partner / image rights review before automatic harvesting',
      harvesterPath
    };
  }

  if (status.startsWith('live') || status === 'live') {
    if (!INCLUDE_LIVE) {
      return {
        queue: 'live',
        reason: 'Already live; rerun with --include-live to refresh',
        harvesterPath
      };
    }
    return {
      queue: 'ready',
      reason: 'Live source approved for refresh',
      harvesterPath
    };
  }

  if (AUTO_POLICIES.has(policy) || (REVIEW_POLICIES.has(policy) && INCLUDE_REVIEW)) {
    return {
      queue: 'ready',
      reason: 'Passes current automated legal / quality gate',
      harvesterPath
    };
  }

  return {
    queue: 'blocked',
    reason: 'Policy not recognised as safe for automated harvesting',
    harvesterPath
  };
}

function summariseTarget(target, decision) {
  return {
    id: target.id,
    name: target.name,
    priority: target.priority,
    region: target.region,
    status: target.status,
    policy: target.public_demo_policy,
    verification: target.verification_status,
    harvester: target.harvester_script || null,
    queue: decision.queue,
    reason: decision.reason,
    api_key: target.api_key,
    access_mode: target.access_mode
  };
}

function formatLine(item) {
  const bits = [
    `${String(item.priority).padStart(2, ' ')}.`,
    item.id.padEnd(16, ' '),
    `→ ${item.queue.padEnd(7, ' ')}`,
    `| ${item.name}`,
    `| ${item.reason}`
  ];
  return bits.join(' ');
}

function buildPlan(allTargets) {
  const filtered = allTargets
    .filter(target => TARGETS.size === 0 || TARGETS.has(target.id))
    .sort((a, b) => a.priority - b.priority);

  const buckets = {
    ready: [],
    live: [],
    review: [],
    blocked: []
  };

  for (const target of filtered) {
    const decision = evaluateTarget(target);
    buckets[decision.queue].push(summariseTarget(target, decision));
  }

  return buckets;
}

async function runHarvester(item) {
  const scriptPath = path.join(__dirname, item.harvester);
  const childArgs = [scriptPath, '--limit', String(LIMIT)];
  if (DRY_RUN) childArgs.push('--dry-run');

  console.log(`\n  ▶ ${item.name} (${item.id})`);
  console.log(`    ${DRY_RUN ? 'Dry run' : 'Live run'} · ${path.basename(scriptPath)} · limit ${LIMIT}`);

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, childArgs, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${item.id} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const allTargets = loadRegistry();
  const plan = buildPlan(allTargets);

  if (AS_JSON) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log('\n  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — Legal Harvest Bot                        ║');
  console.log('  ║   Only harvests sources that pass policy gates      ║');
  console.log('  ╚══════════════════════════════════════════════════════╝\n');

  console.log(`  Registry: ${path.basename(REGISTRY_PATH)}`);
  console.log(`  Mode: ${REPORT_ONLY ? 'report only' : (DRY_RUN ? 'dry-run execution' : 'live execution')}`);
  console.log(`  Include live refreshes: ${INCLUDE_LIVE ? 'yes' : 'no'}`);
  console.log(`  Include review-gated sources: ${INCLUDE_REVIEW ? 'yes' : 'no'}`);
  console.log(`  Allow non-commercial sources: ${ALLOW_NONCOMMERCIAL ? 'yes' : 'no'}`);
  console.log(`  Limit per harvester: ${LIMIT}\n`);

  const order = ['ready', 'live', 'review', 'blocked'];
  const titles = {
    ready: 'Ready now',
    live: 'Already live',
    review: 'Manual review needed',
    blocked: 'Blocked / not ready'
  };

  for (const key of order) {
    const items = plan[key];
    console.log(`  ${titles[key]}: ${items.length}`);
    for (const item of items) console.log(`    ${formatLine(item)}`);
    console.log('');
  }

  if (REPORT_ONLY) return;

  const queue = plan.ready.slice(0, MAX_TARGETS);
  if (!queue.length) {
    console.log('  No targets are currently eligible to run with the selected policy flags.\n');
    return;
  }

  console.log(`  Running ${queue.length} target(s)...`);
  for (const item of queue) {
    await runHarvester(item);
  }

  console.log('\n  ✓ Legal harvest bot run complete\n');
}

main().catch(err => {
  console.error('\n  ✗ Legal harvest bot failed');
  console.error(`  → ${err.message}\n`);
  process.exit(1);
});
