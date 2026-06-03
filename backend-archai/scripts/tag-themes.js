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

const QDRANT_URL = 'http://localhost:6333';
const DRY_RUN = process.argv.includes('--dry-run');

// Theme taxonomy — ordered, keyword-driven. Terms are matched on WORD
// BOUNDARIES (\bterm\b) to avoid substring false positives, e.g. 'cinema'
// matching the Portuguese classification 'cinematográfica'. Stems are written
// out as explicit variants. Tuned for heritage/museum object vocabulary.
const THEMES = {
  'Technology & Computing': ['computer', 'computing', 'computational', 'electronic', 'electronics', 'circuit', 'microchip', 'transistor', 'robot', 'robotic', 'synthesizer', 'synthesiser', 'calculator', 'processor', 'video game', 'mp3 player', 'cassette', 'semiconductor', 'integrated circuit', 'microprocessor'],
  'Communication & Media': ['telephone', 'telegraph', 'radio', 'broadcast', 'television', 'gramophone', 'phonograph', 'microphone', 'loudspeaker', 'typewriter', 'printing press', 'morse', 'antenna', 'transmitter', 'film projector', 'tape recorder', 'record player'],
  'Photography & Film': ['camera', 'photograph', 'photography', 'photographic', 'daguerreotype', 'cinema', 'cinematograph', 'film reel', 'slide projector'],
  'Transport': ['vehicle', 'automobile', 'motor car', 'aircraft', 'aeroplane', 'airplane', 'locomotive', 'railway', 'bicycle', 'ship model', 'carriage', 'aviation', 'spacecraft', 'rocket', 'steam engine'],
  'Science & Instruments': ['scientific instrument', 'microscope', 'telescope', 'astrolabe', 'compass', 'sundial', 'barometer', 'thermometer', 'sextant', 'apparatus', 'laboratory', 'medical instrument', 'surgical', 'orrery', 'mathematical instrument', 'clock', 'watch', 'horology', 'horological', 'chronometer'],
  'Arms & Armour': ['armour', 'armor', 'sword', 'firearm', 'pistol', 'rifle', 'helmet', 'shield', 'dagger', 'cannon', 'weapon', 'musket'],
  'Painting & Drawing': ['painting', 'drawing', 'watercolour', 'watercolor', 'oil on canvas', 'sketch', 'portrait', 'landscape'],
  'Print & Graphic': ['print', 'engraving', 'etching', 'lithograph', 'woodcut', 'poster'],
  'Sculpture': ['sculpture', 'statue', 'bust', 'carving', 'figurine', 'relief'],
  'Ceramics & Glass': ['ceramic', 'porcelain', 'pottery', 'vase', 'stoneware', 'earthenware', 'glass', 'tile'],
  'Textiles & Fashion': ['textile', 'costume', 'dress', 'fashion', 'garment', 'weaving', 'embroidery', 'embroidered', 'tapestry', 'lace', 'shawl', 'bodice', 'petticoat'],
  'Furniture & Design': ['furniture', 'chair', 'table', 'cabinet', 'desk', 'decorative arts', 'metalwork', 'silverware', 'jewellery', 'jewelry'],
  'Numismatics': ['coin', 'medal', 'banknote', 'currency', 'token', 'numismatic'],
  'Natural History': ['specimen', 'mineral', 'fossil', 'taxidermy', 'botanical', 'zoology', 'geology', 'palaeontology', 'paleontology', 'insect', 'seashell', 'skeleton'],
  'Cultural & Ethnographic': ['mask', 'ritual', 'ceremonial', 'indigenous', 'ethnographic', 'ethnography', 'sacred', 'totem', 'taonga', 'first nations'],
  'Books & Documents': ['book', 'manuscript', 'document', 'map', 'letter', 'archive', 'diary'],
};

// Pre-compile word-boundary regexes per term.
const THEME_REGEX = {};
for (const [theme, terms] of Object.entries(THEMES)) {
  THEME_REGEX[theme] = terms.map(t =>
    new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
  );
}

// Themes that count as "technology" for the is_technology flag / facet.
// Definition: devices, machines & instruments — NOT fine-art photography/film
// (Photography & Film remains its own theme). Set by Rob, 2026-06-03.
const TECH_THEMES = new Set([
  'Technology & Computing', 'Communication & Media',
  'Transport', 'Science & Instruments',
]);

function deriveThemes(pl) {
  const blob = [
    pl.title, pl.object_type, pl.category, pl.classification,
    pl.medium, pl.discipline, pl.description, pl.embedding_text,
  ].filter(Boolean).join(' ').toLowerCase();
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
