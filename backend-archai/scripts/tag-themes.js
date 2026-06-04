#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — Normalised Theme Tagger
// Adds a cross-collection `themes` array + `is_technology` flag to every
// object payload, derived from existing metadata (title, object_type,
// category, description, medium). No re-embedding — payload-only update.
//
// Why: each source museum uses its own vocabulary, so "technology" as a
// concept is not a queryable facet. This normalises every object onto a
// shared thematic taxonomy so the search engine can surface (and filter)
// technology, communication, transport, science, etc. precisely.
//
// Usage:
//   node tag-themes.js              # tag all collections + curator
//   node tag-themes.js --dry-run    # report only, no writes
// ══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QDRANT_URL = 'http://localhost:6333';
const DRY_RUN = process.argv.includes('--dry-run');

// Load the user-editable tagging configuration. Institutions edit
// src/config/tagging.json to define their own themes / technology definition /
// facets — no code changes. Terms are matched on WORD BOUNDARIES (\bterm\b).
const CONFIG_PATH = path.join(__dirname, '..', 'src', 'config', 'tagging.json');
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const THEMES = CONFIG.themes;
const FACET_FIELDS = CONFIG.facet_fields || ['title', 'object_type', 'category', 'classification', 'medium', 'discipline', 'description', 'embedding_text'];
console.log(`  Tagging config: ${Object.keys(THEMES).length} themes, ${CONFIG.technology_themes.length} count as technology (config v${CONFIG.version})`);


// Pre-compile word-boundary regexes per term.
const THEME_REGEX = {};
for (const [theme, terms] of Object.entries(THEMES)) {
  THEME_REGEX[theme] = terms.map(t =>
    new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
  );
}

// Which themes count as "technology" — read from the config so institutions can
// redefine it without touching code.
const TECH_THEMES = new Set(CONFIG.technology_themes);

function deriveThemes(pl) {
  const blob = FACET_FIELDS.map(f => pl[f]).filter(Boolean).join(' ').toLowerCase();
  const themes = [];
  for (const [theme, regexes] of Object.entries(THEME_REGEX)) {
    if (regexes.some(re => re.test(blob))) themes.push(theme);
  }
  return themes;
}

async function post(path, body) {
  const res = await fetch(QDRANT_URL + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  const list = await (await fetch(QDRANT_URL + '/collections')).json();
  const cols = list.result.collections
    .map(c => c.name)
    .filter(n => n.startsWith('archai_') || n === 'archai_curator');

  const themeTotals = {};
  let grand = 0, techCount = 0;

  for (const col of cols) {
    let off = null, n = 0, tech = 0;
    while (true) {
      const body = { limit: 400, with_payload: true };
      if (off) body.offset = off;
      const r = await post(`/collections/${col}/points/scroll`, body);
      const pts = r.result?.points || [];
      for (const p of pts) {
        const themes = deriveThemes(p.payload);
        const isTech = themes.some(t => TECH_THEMES.has(t));
        if (isTech) tech++;
        themes.forEach(t => { themeTotals[t] = (themeTotals[t] || 0) + 1; });
        if (!DRY_RUN) {
          await post(`/collections/${col}/points/payload`, {
            payload: { themes, is_technology: isTech },
            points: [p.id],
          });
        }
        n++;
      }
      off = r.result?.next_page_offset;
      if (!off) break;
    }
    grand += n; techCount += tech;
    console.log(`  ${col.replace('archai_', '').padEnd(16)} ${String(n).padStart(4)} tagged · ${tech} technology`);
  }

  console.log(`\n  TOTAL: ${grand} objects · ${techCount} technology (${Math.round(100 * techCount / grand)}%)`);
  console.log('\n  Theme distribution:');
  for (const [t, c] of Object.entries(themeTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(26)} ${c}`);
  }
  if (DRY_RUN) console.log('\n  (dry-run — no payloads written)');
}

main().catch(e => { console.error(e); process.exit(1); });
