#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — NFC Page Generator
// Reads MV objects from Qdrant and generates one HTML visitor page
// per object/NFC tag. Output goes to ./v/ directory.
//
// Usage:
//   node generate-nfc-pages.js
//   node generate-nfc-pages.js --host http://100.109.26.39:11434
//   node generate-nfc-pages.js --proxy https://archai.yourdomain.com
//   node generate-nfc-pages.js --host http://100.109.26.39:11434 --limit 50
//
// Requirements:
//   - Qdrant running at localhost:6333
//   - Collection 'archai_pilot' populated (run mv-harvester.js first)
//   - Template file: nfc-visitor-template.html (same directory)
// ══════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ── CONFIG ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const QDRANT_URL = getArg('qdrant', 'http://localhost:6333');
const ALL_COLLECTIONS = ['archai_pilot', 'archai_met', 'archai_va'];
const COLLECTION_LABELS = {
  archai_pilot: 'Museums Victoria',
  archai_met: 'The Metropolitan Museum of Art',
  archai_va: 'Victoria and Albert Museum, London'
};
const OLLAMA_LAN_HOST = getArg('host', 'http://localhost:11434');
const BACKEND_PROXY = getArg('proxy', '');
const LIMIT = parseInt(getArg('limit', '200'), 10);
const OUTPUT_DIR = path.join(__dirname, 'v');
const TEMPLATE_PATH = path.join(__dirname, 'nfc-visitor-template.html');
const PORTAL_PATH = path.join(__dirname, 'captive-portal.html');

// ── HELPERS ─────────────────────────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/`/g, '\\`')
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$');
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(s, len = 300) {
  s = String(s || '');
  return s.length > len ? s.substring(0, len) + '…' : s;
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — NFC Page Generator            ║');
  console.log('  ╚══════════════════════════════════════════╝\n');

  // Check template exists
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('  ✗ Template not found:', TEMPLATE_PATH);
    console.error('    Place nfc-visitor-template.html in the same directory.');
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  console.log('  ✓ Template loaded');
  console.log(`  → Qdrant: ${QDRANT_URL}`);
  console.log(`  → Collections: ${ALL_COLLECTIONS.join(', ')}`);
  console.log(`  → Ollama LAN host: ${OLLAMA_LAN_HOST}`);
  console.log(`  → Backend proxy: ${BACKEND_PROXY || '(none — direct mode)'}`);
  console.log(`  → Limit: ${LIMIT}`);
  console.log(`  → Output: ${OUTPUT_DIR}/\n`);

  // Fetch objects from ALL Qdrant collections
  let allPoints = [];
  const seenTitles = new Set();
  const seenCanonical = new Set();
  const collectionCounts = {};

  for (const col of ALL_COLLECTIONS) {
    try {
      const res = await fetch(`${QDRANT_URL}/collections/${col}/points/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: LIMIT, with_payload: true })
      });
      if (!res.ok) {
        console.log(`  ⚠ ${col}: HTTP ${res.status} — skipping`);
        continue;
      }
      const data = await res.json();
      const points = (data.result && data.result.points) || [];

      let added = 0;
      for (const pt of points) {
        const p = pt.payload;
        if (!p || !p.canonical_id) continue;

        // Deduplicate by canonical_id and title
        const normTitle = (p.title || '').toLowerCase().trim();
        if (seenCanonical.has(p.canonical_id)) continue;
        if (normTitle && seenTitles.has(normTitle)) continue;

        // Skip objects without images
        const hasImage = p.media_thumbnail || p.media_medium || p.media_large || p.primaryImageSmall || p.primaryImage;
        if (!hasImage) continue;

        // Skip untitled objects
        if (!p.title || p.title.toLowerCase() === 'untitled') continue;

        seenCanonical.add(p.canonical_id);
        if (normTitle) seenTitles.add(normTitle);

        // Tag with source collection
        pt._sourceCollection = col;
        pt._sourceLabel = COLLECTION_LABELS[col] || col;
        allPoints.push(pt);
        added++;
      }
      collectionCounts[col] = added;
      console.log(`  ✓ ${col}: ${points.length} fetched, ${added} unique added`);
    } catch (e) {
      console.log(`  ⚠ ${col}: ${e.message} — skipping`);
      collectionCounts[col] = 0;
    }
  }

  // Shuffle so we get a mix of sources, not all MV first
  for (let i = allPoints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPoints[i], allPoints[j]] = [allPoints[j], allPoints[i]];
  }

  // Cap to limit
  allPoints = allPoints.slice(0, LIMIT);

  if (!allPoints.length) {
    console.error('\n  ✗ No objects found in any Qdrant collection.');
    process.exit(1);
  }

  const sourceSummary = Object.entries(collectionCounts)
    .filter(([,c]) => c > 0)
    .map(([col, c]) => `${col.replace('archai_','')}: ${c}`)
    .join(', ');
  console.log(`\n  ✓ ${allPoints.length} unique objects from ${Object.values(collectionCounts).filter(c=>c>0).length} collections (${sourceSummary})\n`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Copy captive portal
  if (fs.existsSync(PORTAL_PATH)) {
    const portalOut = path.join(path.dirname(OUTPUT_DIR), 'captive-portal.html');
    fs.copyFileSync(PORTAL_PATH, portalOut);
    console.log('  ✓ Captive portal copied');
  }

  // Generate pages
  const generated = [];
  const allObjects = allPoints.map((pt, i) => ({
    index: i,
    payload: pt.payload,
    nfcCode: 'NFC' + String(i + 1).padStart(3, '0'),
    sourceLabel: pt._sourceLabel || 'Collection',
    sourceCollection: pt._sourceCollection || 'archai_pilot'
  }));

  for (const obj of allObjects) {
    const p = obj.payload;
    if (!p || !p.canonical_id) continue;

    const nfcCode = obj.nfcCode;
    const title = p.title || 'Unknown Object';
    const type = p.object_type || p.discipline || 'Heritage Object';
    const date = p.date_range || 'Date unknown';
    const reg = p.registration_number || '';
    const location = p.museum_location || obj.sourceLabel;
    const discipline = p.discipline || '';
    const category = p.category || '';
    const description = p.description || 'No description recorded.';
    const licence = p.licence || 'Open Access';
    const sourceUrl = p.source_url || '#';
    const imgMedium = p.media_medium || p.media_thumbnail || '';
    const imgThumb = p.media_thumbnail || '';
    const sourceInstitution = obj.sourceLabel;

    // Build hero image
    const heroHtml = imgMedium
      ? `<img src="${escHtml(imgMedium)}" alt="${escHtml(title)}" loading="eager">`
      : `<div class="v-hero-empty">No image available<br>${escHtml(reg)}</div>`;

    // Build sub line
    const subParts = [type, date, reg].filter(Boolean);
    const subLine = subParts.join(' · ');

    // Discipline tag
    const discTag = discipline
      ? `<span class="v-meta-tag">${escHtml(discipline)}</span>`
      : '';

    // Story
    const story = `<strong>${escHtml(title)}</strong> — ${escHtml(truncate(description, 300))}`;

    // Chips
    const chips = ['What are you?', 'Tell me your history', 'How were you used?', 'What are you made of?'];
    const chipsHtml = chips.map(c =>
      `<div class="v-chip" onclick="askObject('${c.replace(/'/g, "\\'")}')">${escHtml(c)}</div>`
    ).join('\n      ');

    // Metadata rows
    const metaFields = [
      ['Registration', reg],
      ['Discipline', discipline],
      ['Category', category],
      ['Date / Period', date],
      ['Location', location],
      ['Object Type', type],
      ['Licence', licence],
    ].filter(([, v]) => v);

    const metaRowsHtml = metaFields.map(([k, v]) =>
      `<div class="v-meta-row"><span class="v-meta-key">${escHtml(k)}</span><span class="v-meta-value">${escHtml(v)}</span></div>`
    ).join('\n    ');

    // Related objects (pick 4 nearby in the collection, skip self)
    const relatedIndices = [];
    for (let r = obj.index - 2; r <= obj.index + 2 && relatedIndices.length < 4; r++) {
      if (r >= 0 && r < allObjects.length && r !== obj.index) {
        relatedIndices.push(r);
      }
    }
    // Pad if needed
    for (let r = 0; relatedIndices.length < 4 && r < allObjects.length; r++) {
      if (r !== obj.index && !relatedIndices.includes(r)) {
        relatedIndices.push(r);
      }
    }

    const relatedHtml = relatedIndices.slice(0, 4).map(ri => {
      const rp = allObjects[ri].payload;
      const rThumb = rp.media_medium || rp.media_thumbnail || '';
      const rTitle = rp.title || 'Object';
      const rReg = rp.registration_number || '';
      const rNfc = allObjects[ri].nfcCode;
      const rSrc = allObjects[ri].sourceLabel || '';
      return `<a class="v-rel-card" href="${rNfc}.html">
        <div class="v-rel-thumb">${rThumb ? `<img src="${escHtml(rThumb)}" loading="lazy">` : '<span class="v-rel-thumb-empty">▣</span>'}</div>
        <div class="v-rel-title">${escHtml(rTitle)}</div>
        <div class="v-rel-meta">${escHtml(rSrc)}${rReg ? ' · ' + escHtml(rReg) : ''}</div>
      </a>`;
    }).join('\n      ');

    // Apply template
    let html = template
      .replace(/\{\{OLLAMA_HOST\}\}/g, OLLAMA_LAN_HOST)
      .replace(/\{\{BACKEND_PROXY\}\}/g, BACKEND_PROXY)
      .replace(/\{\{NFC_CODE\}\}/g, escHtml(nfcCode))
      .replace(/\{\{OBJECT_TITLE\}\}/g, escHtml(title))
      .replace(/\{\{OBJECT_SUB\}\}/g, escHtml(subLine))
      .replace(/\{\{OBJECT_TYPE\}\}/g, esc(type))
      .replace(/\{\{OBJECT_DATE\}\}/g, esc(date))
      .replace(/\{\{OBJECT_REG\}\}/g, esc(reg))
      .replace(/\{\{OBJECT_LOCATION\}\}/g, esc(location))
      .replace(/\{\{OBJECT_DISCIPLINE\}\}/g, esc(discipline))
      .replace(/\{\{OBJECT_CATEGORY\}\}/g, esc(category))
      .replace(/\{\{OBJECT_DESCRIPTION\}\}/g, esc(truncate(description, 600)))
      .replace(/\{\{OBJECT_LICENCE\}\}/g, esc(licence))
      .replace(/\{\{OBJECT_STORY\}\}/g, story)
      .replace(/\{\{SOURCE_URL\}\}/g, escHtml(sourceUrl))
      .replace(/\{\{SOURCE_INSTITUTION\}\}/g, escHtml(sourceInstitution))
      .replace(/\{\{HERO_IMAGE\}\}/g, heroHtml)
      .replace(/\{\{DISCIPLINE_TAG\}\}/g, discTag)
      .replace(/\{\{CHIPS_HTML\}\}/g, chipsHtml)
      .replace(/\{\{META_ROWS\}\}/g, metaRowsHtml)
      .replace(/\{\{RELATED_HTML\}\}/g, relatedHtml);

    const filename = `${nfcCode}.html`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), html, 'utf-8');
    generated.push({ nfcCode, title, reg, filename, source: sourceInstitution });

    // Progress
    process.stdout.write(`  → ${nfcCode} · [${sourceInstitution.substring(0,3).toUpperCase()}] ${title.substring(0, 40)}${title.length > 40 ? '…' : ''}\n`);
  }

  // Generate index page for /v/
  const indexHtml = generateIndex(generated);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8');

  // NFC programming reference
  const nfcRef = generated.map(g =>
    `${g.nfcCode}  →  ${g.filename}  →  [${(g.source || '').substring(0,3).toUpperCase()}]  ${g.title}  (${g.reg})`
  ).join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nfc-reference.txt'), nfcRef, 'utf-8');

  // Source breakdown
  const sourceBreakdown = {};
  generated.forEach(g => { sourceBreakdown[g.source] = (sourceBreakdown[g.source] || 0) + 1; });

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Generated ${generated.length} visitor pages in ${OUTPUT_DIR}/`);
  Object.entries(sourceBreakdown).forEach(([src, count]) => {
    console.log(`    → ${src}: ${count} pages`);
  });
  console.log(`  ✓ Index page: ${OUTPUT_DIR}/index.html`);
  console.log(`  ✓ NFC reference: ${OUTPUT_DIR}/nfc-reference.txt`);
  console.log(`\n  NFC tags should open URLs like:`);
  console.log(`    http://<your-lan-ip>:8000/v/NFC001.html`);
  console.log(`\n  Or with captive portal:`);
  console.log(`    http://<your-lan-ip>:8000/captive-portal.html?next=NFC001`);
  console.log(`\n  Serve with: python3 -m http.server 8000\n`);
}

// ── INDEX PAGE ──────────────────────────────────────────────────
function generateIndex(items) {
  const rows = items.map(g =>
    `<a href="${g.filename}" class="idx-item">
      <span class="idx-nfc">${g.nfcCode}</span>
      <span class="idx-title">${escHtml(g.title)}</span>
      <span class="idx-reg">${escHtml(g.reg)}</span>
    </a>`
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARCHAI — Visitor Pages</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
:root { --bg:#080808; --surface:#0f0f0f; --border:#1e1e1e; --text:#e8e4dc; --text2:#a09890; --text3:#5a5450; --accent:#c8a96e; --accent2:#8fbcb0; --mono:'DM Mono',monospace; --serif:'Cormorant Garamond',serif; }
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:var(--serif);padding:32px 20px;min-height:100vh;}
.logo{font-size:1.8rem;letter-spacing:10px;text-transform:uppercase;font-weight:300;text-align:center;margin-bottom:4px;}
.logo span{font-style:italic;color:var(--accent);}
.sub{font-family:var(--mono);font-size:0.5rem;color:var(--text3);letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:32px;}
.count{font-family:var(--mono);font-size:0.56rem;color:var(--text3);margin-bottom:12px;letter-spacing:1px;}
.idx-item{display:grid;grid-template-columns:70px 1fr auto;gap:10px;padding:12px 0;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;transition:background 0.1s;}
.idx-item:active{background:var(--surface);}
.idx-nfc{font-family:var(--mono);font-size:0.62rem;color:var(--accent2);letter-spacing:2px;}
.idx-title{font-family:var(--serif);font-size:0.95rem;color:var(--text);}
.idx-reg{font-family:var(--mono);font-size:0.5rem;color:var(--text3);text-align:right;letter-spacing:1px;}
</style>
</head>
<body>
<div class="logo">ARC<span>H</span>AI</div>
<div class="sub">NFC Visitor Pages · ${items.length} Objects</div>
<div class="count">${items.length} pages generated</div>
${rows}
</body>
</html>`;
}

// ── RUN ─────────────────────────────────────────────────────────
main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
