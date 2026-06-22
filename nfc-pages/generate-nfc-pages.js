#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — AUX.IO Page Generator
// Reads live ARCHAI collection objects from Qdrant and generates one HTML visitor page
// per object/AUX.IO tag. Output goes to ./v/ directory.
//
// Usage:
//   node generate-nfc-pages.js
//   node generate-nfc-pages.js --host http://100.109.26.39:11434
//   node generate-nfc-pages.js --proxy https://archai.yourdomain.com
//   node generate-nfc-pages.js --host http://100.109.26.39:11434 --limit 50
//
// Requirements:
//   - Qdrant running at localhost:6333
//   - One or more ARCHAI source collections populated in Qdrant
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
const ALL_COLLECTIONS = [
  'archai_pilot', 'archai_met', 'archai_va',
  'archai_aic', 'archai_cma', 'archai_rijks', 'archai_europeana', 'archai_auckland', 'archai_tepapa', 'archai_mplus', 'archai_brasiliana',
  'archai_smithsonian', 'archai_tate', 'archai_streetart',
  'archai_getty', 'archai_wellcome', 'archai_qagoma', 'archai_rawg',
];
const COLLECTION_LABELS = {
  archai_pilot:        'Museums Victoria',
  archai_met:          'The Metropolitan Museum of Art',
  archai_va:           'Victoria and Albert Museum, London',
  archai_aic:          'Art Institute of Chicago',
  archai_cma:          'Cleveland Museum of Art',
  archai_rijks:        'Rijksmuseum, Amsterdam',
  archai_europeana:    'Europeana',
  archai_auckland:     'Auckland Museum',
  archai_tepapa:       'Museum of New Zealand Te Papa Tongarewa',
  archai_mplus:        'M+, Hong Kong',
  archai_brasiliana:   'Brasiliana Museus',
  archai_smithsonian:  'Smithsonian Institution',
  archai_tate:         'Tate',
  archai_streetart:    'Public Street Art',
  archai_getty:        'J. Paul Getty Museum',
  archai_wellcome:     'Wellcome Collection',
  archai_qagoma:       'QAGOMA — Queensland Art Gallery | Gallery of Modern Art',
  archai_rawg:         'RAWG Video Games Database',
};
const OLLAMA_LAN_HOST = getArg('host', 'http://localhost:11434');
// Default to backend-proxy mode so public AUX.IO pages can use the live chat API
// instead of trying to call a visitor's local Ollama instance from the browser.
const BACKEND_PROXY = getArg('proxy', '__SELF__');
const LIMIT = parseInt(getArg('limit', '5000'), 10);
const OUTPUT_DIR = path.join(__dirname, 'v');
const TEMPLATE_PATH = path.join(__dirname, 'nfc-visitor-template.html');
const PORTAL_PATH = path.join(__dirname, 'captive-portal.html');

// ── HELPERS ─────────────────────────────────────────────────────
function cleanText(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

function esc(s) {
  return cleanText(s)
    .replace(/`/g, '\\`')
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$');
}

function escHtml(s) {
  return cleanText(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(s, len = 300) {
  s = cleanText(s);
  return s.length > len ? s.substring(0, len) + '…' : s;
}

function trimGeneratedLines(s) {
  return String(s || '').replace(/[ \t]+$/gm, '');
}

function getObjectRightsInfo(payload = {}) {
  const licence = String(payload?.licence || '').trim();
  const mediaRightsTitle = String(payload?.media_rights_title || '').trim();
  const rightsMode = String(payload?.media_rights_mode || '').trim();
  const rightsNotes = Array.isArray(payload?.rights_notes)
    ? payload.rights_notes.filter(Boolean).join(' · ')
    : String(payload?.rights_notes || '').trim();
  const combined = [licence, mediaRightsTitle, rightsMode, rightsNotes].filter(Boolean).join(' · ');
  const normalized = combined.toLowerCase();
  const detailParts = [];

  if (licence) detailParts.push(licence);
  if (mediaRightsTitle && mediaRightsTitle !== licence) detailParts.push(mediaRightsTitle);
  if (rightsMode === 'api_preview_only') detailParts.push('API preview only');

  const detail = detailParts.join(' · ') || rightsNotes || 'Source rights not yet specified';

  let status = 'Check source';
  let guidance = 'Review the source record and item-level rights before reuse.';
  let color = '#a09890';
  let border = 'rgba(160,152,144,0.28)';

  if (/all rights reserved|rights reserved|in copyright|rightsstatements\.org\/vocab\/inc|api_preview_only/.test(normalized)) {
    status = 'Restricted';
    guidance = 'Do not reuse the media without permission from the rights holder or source institution.';
    color = '#d18d78';
    border = 'rgba(209,141,120,0.28)';
  } else if (/cc by-nc|by-nc|non-commercial|metadata cc by|cc0 metadata|m\+ api service non-commercial|public_object_page_preview|preview media/.test(normalized)) {
    status = 'Restricted / mixed';
    guidance = 'Metadata may be open, but media reuse is limited, non-commercial, or preview-only.';
    color = '#c8a96e';
    border = 'rgba(200,169,110,0.28)';
  } else if (/cc by-sa|creativecommons\.org\/licenses\/by-sa\//.test(normalized)) {
    status = 'Share alike';
    guidance = 'Reusable with attribution, and derivative use should keep the same licence terms.';
    color = '#9b8fbf';
    border = 'rgba(155,143,191,0.28)';
  } else if (/cc by|creativecommons\.org\/licenses\/by\/|creative commons attribution|© auckland museum cc by/.test(normalized)) {
    status = 'Attribution required';
    guidance = 'Reusable with attribution to the source institution and creator where required.';
    color = '#8fbcb0';
    border = 'rgba(143,188,176,0.28)';
  } else if (/cc0|creativecommons\.org\/publicdomain\/zero|creativecommons\.org\/publicdomain\/mark|public domain|public domain mark|rightsstatements\.org\/vocab\/noc|dom[ií]nio p[úu]blico|no known copyright restrictions|open access/.test(normalized)) {
    status = 'Open access';
    guidance = 'Appears reusable under open-access or public-domain terms.';
    color = '#8fbcb0';
    border = 'rgba(143,188,176,0.28)';
  }

  return { status, guidance, detail, color, border };
}

function buildInteractiveEmbed(p) {
  const interactiveUrl = String(p.interactive_url || '').trim();
  const archiveSource  = String(p.archive_source  || '').trim();
  const archiveSeed    = String(p.archive_seed_url || '').trim();
  if (!interactiveUrl && !archiveSource) return '';

  const isWARC = !!archiveSource;
  const label  = isWARC ? 'Archived interactive work' : 'Interactive work';

  let frameHtml;
  if (isWARC) {
    const seedAttr = archiveSeed ? ` url="${escHtml(archiveSeed)}"` : '';
    frameHtml = `<replay-web-page source="${escHtml(archiveSource)}"${seedAttr} embed="replayonly" sandbox></replay-web-page>`;
  } else {
    frameHtml = `<iframe data-src="${escHtml(interactiveUrl)}" title="${escHtml(p.title || 'Interactive work')}" sandbox="allow-scripts allow-same-origin allow-forms" allowfullscreen loading="lazy"></iframe>`;
  }

  return `<div class="v-interactive" id="v-interactive-block">
  <div class="v-interactive-header">
    <span class="v-interactive-label">${label}</span>
    <span class="v-interactive-pill">${isWARC ? 'WARC Archive' : 'Live Embed'}</span>
  </div>
  <p class="v-interactive-note">Experience this work directly — opens within the page in a sandboxed frame.</p>
  <button class="v-interactive-launch" onclick="launchInteractive()">Launch interactive work</button>
  <div class="v-interactive-frame-wrap" id="v-interactive-frame">
    <div class="v-interactive-frame-loading" id="v-interactive-loading">Loading…</div>
    ${frameHtml}
    <button class="v-interactive-close" onclick="closeInteractive()">✕ Close</button>
  </div>
  <p class="v-interactive-disclaimer">Runs in a sandboxed iframe. ${isWARC ? 'Replay powered by ReplayWeb.page.' : 'Content provided by the source institution.'}</p>
</div>`;
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — AUX.IO Page Generator             ║');
  console.log('  ║   (AUX.IO / QR / Beacon / Hyperlink delivery)║');
  console.log('  ╚══════════════════════════════════════════════╝\n');

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

        // Deduplicate by canonical_id across collections
        if (seenCanonical.has(p.canonical_id)) continue;

        seenCanonical.add(p.canonical_id);

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

  // Only generate pages for objects with images or interactive content
  const beforeFilter = allPoints.length;
  allPoints = allPoints.filter(pt => {
    const p = pt.payload;
    return p && (
      p.media_medium || p.media_thumbnail || p.image_url || p.primaryImageSmall ||
      p.interactive_url || p.archive_source
    );
  });
  const skippedNoImage = beforeFilter - allPoints.length;
  if (skippedNoImage > 0) {
    console.log(`  ⊘ Skipped ${skippedNoImage} objects without images or interactive content`);
  }

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

  // LEGAL SAFETY: delete ALL existing NFC pages before regenerating so removed
  // or rights-restricted objects can never linger as orphaned, publicly-reachable
  // pages (a smaller regen used to leave stale high-numbered pages behind).
  let purged = 0;
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (/^NFC\d+\.html$/.test(f)) { fs.unlinkSync(path.join(OUTPUT_DIR, f)); purged++; }
  }
  if (purged) console.log(`  ⊘ Purged ${purged} existing AUX.IO pages before regeneration`);

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
    nfcCode: 'NFC' + String(i + 1).padStart(3, '0'), // filename stays NFC for URL compat
    auxLabel: 'AUX.IO ' + String(i + 1).padStart(3, '0'), // display label
    sourceLabel: pt._sourceLabel || 'Collection',
    sourceCollection: pt._sourceCollection || 'archai_pilot'
  }));

  for (const obj of allObjects) {
    const p = obj.payload;
    if (!p || !p.canonical_id) continue;

    const nfcCode = obj.nfcCode;
    const fallbackTitle = p.registration_number || p.accession_number || p.canonical_id || 'Unknown Object';
    const title = (p.title && p.title.trim()) ? p.title.trim() : `Untitled — ${fallbackTitle}`;
    const type = p.object_type || p.discipline || 'Heritage Object';
    const date = p.date_range || 'Date unknown';
    const reg = p.registration_number || '';
    const location = p.museum_location || obj.sourceLabel;
    const discipline = p.discipline || '';
    const category = p.category || '';
    const description = p.description || 'No description recorded.';
    const medium = p.medium || '';
    const artist = p.artist || '';
    const culture = p.culture || '';
    const dimensions = p.dimensions || '';
    const wallDesc = p.wall_description || '';
    const funFact = p.fun_fact || '';
    const didYouKnow = p.did_you_know || '';
    const provenance = p.provenance || '';
    const tombstone = p.tombstone || '';
    const licence = p.licence || 'Open Access';
    const rights = getObjectRightsInfo(p);
    const sourceUrl = p.source_url || '#';
    const imgMedium = p.media_medium || p.media_thumbnail || '';
    const imgThumb = p.media_thumbnail || '';
    const sourceInstitution = obj.sourceLabel;
    const interactiveEmbedHtml = buildInteractiveEmbed(p);
    const interactiveBadgeHtml = interactiveEmbedHtml
      ? '<span class="v-meta-tag interactive">Interactive</span>'
      : '';

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
    const legalStatusTag = `<span class="v-meta-tag legal" style="border-color:${rights.border};color:${rights.color};">${escHtml(rights.status)}</span>`;

    // Story
    const story = `<strong>${escHtml(title)}</strong> — ${escHtml(truncate(description, 300))}`;
    const rightsNote = `<div class="v-rights-note" style="border-color:${rights.border};">
      <div class="v-rights-label" style="color:${rights.color};">Legal status</div>
      <div class="v-rights-text"><strong style="color:${rights.color};font-weight:400;">${escHtml(rights.status)}</strong> — ${escHtml(rights.guidance)}</div>
      <div class="v-rights-detail">Licence / rights: ${escHtml(rights.detail)}</div>
    </div>`;

    // Chips
    const chips = ['What are you?', 'Tell me your history', 'How were you used?', 'What are you made of?'];
    const chipsHtml = chips.map(c =>
      `<div class="v-chip" onclick="askObject('${c.replace(/'/g, "\\'")}')">${escHtml(c)}</div>`
    ).join('\n      ');

    // Metadata rows
    const metaFields = [
      ['Registration', reg],
      ['Artist / Maker', artist],
      ['Material', medium],
      ['Culture', culture],
      ['Discipline', discipline],
      ['Category', category],
      ['Date / Period', date],
      ['Dimensions', dimensions],
      ['Location', location],
      ['Object Type', type],
      ['Legal Status', rights.status],
      ['Reuse Guidance', rights.guidance],
      ['Licence / Rights', rights.detail],
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
      .replace(/\{\{CHAT_MODEL\}\}/g, getArg('model', 'qwen2.5:32b'))
      .replace(/\{\{NFC_CODE\}\}/g, escHtml(obj.auxLabel || nfcCode))
      .replace(/\{\{OBJECT_TITLE\}\}/g, escHtml(title))
      .replace(/\{\{OBJECT_SUB\}\}/g, escHtml(subLine))
      .replace(/\{\{OBJECT_TYPE\}\}/g, esc(type))
      .replace(/\{\{OBJECT_DATE\}\}/g, esc(date))
      .replace(/\{\{OBJECT_REG\}\}/g, esc(reg))
      .replace(/\{\{OBJECT_LOCATION\}\}/g, esc(location))
      .replace(/\{\{OBJECT_DISCIPLINE\}\}/g, esc(discipline))
      .replace(/\{\{OBJECT_CATEGORY\}\}/g, esc(category))
      .replace(/\{\{OBJECT_DESCRIPTION\}\}/g, esc(truncate(description, 600)))
      .replace(/\{\{OBJECT_MEDIUM\}\}/g, esc(medium))
      .replace(/\{\{OBJECT_ARTIST\}\}/g, esc(artist))
      .replace(/\{\{OBJECT_CULTURE\}\}/g, esc(culture))
      .replace(/\{\{OBJECT_DIMENSIONS\}\}/g, esc(dimensions))
      .replace(/\{\{OBJECT_WALL_DESC\}\}/g, esc(truncate(wallDesc, 500)))
      .replace(/\{\{OBJECT_FUN_FACT\}\}/g, esc(funFact))
      .replace(/\{\{OBJECT_DID_YOU_KNOW\}\}/g, esc(didYouKnow))
      .replace(/\{\{OBJECT_PROVENANCE\}\}/g, esc(truncate(provenance, 300)))
      .replace(/\{\{OBJECT_TOMBSTONE\}\}/g, esc(tombstone))
      .replace(/\{\{OBJECT_LICENCE\}\}/g, esc(licence))
      .replace(/\{\{OBJECT_COLLECTION\}\}/g, esc(obj.sourceCollection || 'archai_pilot'))
      .replace(/\{\{OBJECT_STORY\}\}/g, story)
      .replace(/\{\{SOURCE_URL\}\}/g, escHtml(sourceUrl))
      .replace(/\{\{SOURCE_INSTITUTION\}\}/g, escHtml(sourceInstitution))
      .replace(/\{\{HERO_IMAGE\}\}/g, heroHtml)
      .replace(/\{\{DISCIPLINE_TAG\}\}/g, discTag)
      .replace(/\{\{LEGAL_STATUS_TAG\}\}/g, legalStatusTag)
      .replace(/\{\{RIGHTS_NOTE\}\}/g, rightsNote)
      .replace(/\{\{CHIPS_HTML\}\}/g, chipsHtml)
      .replace(/\{\{META_ROWS\}\}/g, metaRowsHtml)
      .replace(/\{\{RELATED_HTML\}\}/g, relatedHtml)
      .replace(/\{\{INTERACTIVE_EMBED\}\}/g, interactiveEmbedHtml)
      .replace(/\{\{INTERACTIVE_BADGE\}\}/g, interactiveBadgeHtml);

    const filename = `${nfcCode}.html`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), trimGeneratedLines(html), 'utf-8');
    generated.push({ nfcCode, title, reg, filename, source: sourceInstitution });

    // Progress
    process.stdout.write(`  → ${obj.auxLabel} · [${sourceInstitution.substring(0,3).toUpperCase()}] ${title.substring(0, 40)}${title.length > 40 ? '…' : ''}\n`);
  }

  // Generate index page for /v/
  const indexHtml = generateIndex(generated);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), trimGeneratedLines(indexHtml), 'utf-8');

  // AUX.IO programming reference
  const nfcRef = generated.map(g =>
    `${g.nfcCode.replace(/^NFC/, 'AUX.IO ')}  →  ${g.filename}  →  [${(g.source || '').substring(0,3).toUpperCase()}]  ${cleanText(g.title)}  (${cleanText(g.reg)})`
  ).join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nfc-reference.txt'), trimGeneratedLines(nfcRef), 'utf-8');

  // Source breakdown
  const sourceBreakdown = {};
  generated.forEach(g => { sourceBreakdown[g.source] = (sourceBreakdown[g.source] || 0) + 1; });

  console.log(`\n  ════════════════════════════════════════════`);
  console.log(`  ✓ Generated ${generated.length} visitor pages in ${OUTPUT_DIR}/`);
  Object.entries(sourceBreakdown).forEach(([src, count]) => {
    console.log(`    → ${src}: ${count} pages`);
  });
  console.log(`  ✓ Index page: ${OUTPUT_DIR}/index.html`);
  console.log(`  ✓ AUX.IO reference: ${OUTPUT_DIR}/nfc-reference.txt`);
  console.log(`\n  AUX.IO tags should open URLs like:`);
  console.log(`    http://<your-lan-ip>:8000/v/NFC001.html`);
  console.log(`\n  Or with captive portal:`);
  console.log(`    http://<your-lan-ip>:8000/captive-portal.html?next=NFC001`);
  console.log(`\n  Serve with: python3 -m http.server 8000\n`);
}

// ── INDEX PAGE ──────────────────────────────────────────────────
function generateIndex(items) {
  const rows = items.map(g =>
    `<a href="${g.filename}" class="idx-item">
      <span class="idx-nfc">${g.nfcCode.replace(/^NFC/, 'AUX.IO ')}</span>
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
<div class="sub">AUX.IO Visitor Pages · ${items.length} Objects</div>
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
