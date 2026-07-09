#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// ARCHAI — RAWG Video Games Database Harvester
// Treats video games as cultural objects alongside museum collections.
// Targets landmark games by decade, genre, and cultural significance.
//
// REQUIRES: Free API key from https://rawg.io/apidocs
//   Set: RAWG_API_KEY=your-key-here
//   Or store: famtec add rawg
//
// Usage:
//   RAWG_API_KEY=xxx node rawg-harvester.js
//   RAWG_API_KEY=xxx node rawg-harvester.js --limit 200
//   RAWG_API_KEY=xxx node rawg-harvester.js --genre "strategy" --limit 100
//   RAWG_API_KEY=xxx node rawg-harvester.js --dry-run
//
// IMPORTANT — ATTRIBUTION REQUIREMENT:
//   RAWG terms require an active hyperlink to rawg.io on every page
//   where their data is displayed. The payload includes rawg_attribution_url
//   which MUST be rendered as a clickable link on every AUXIO visitor page.
//
// API docs:  https://rawg.io/apidocs  |  https://api.rawg.io/docs/
// Licence:   Free with attribution for non-commercial / <100K MAU.
//            Active link to rawg.io required on every display page.
// ══════════════════════════════════════════════════════════════════

import { execSync } from 'child_process';

const RAWG_API   = 'https://api.rawg.io/api';
const QDRANT_URL = 'http://localhost:6333';
const OLLAMA_URL = 'http://localhost:11434';
const COLLECTION = 'archai_rawg';
const EMBED_MODEL = 'nomic-embed-text';
const ID_OFFSET  = 17_000_000;

// Resolve API key: env var → macOS Keychain (KeyTec)
function resolveApiKey() {
  if (process.env.RAWG_API_KEY) return process.env.RAWG_API_KEY;
  try {
    const k = execSync('security find-generic-password -s famtec -a RAWG_API_KEY -w', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (k) { console.log('  ✓ RAWG key loaded from Keychain (KeyTec)'); return k; }
  } catch (_) {}
  return '';
}

const API_KEY = resolveApiKey();
if (!API_KEY) {
  console.error('\n  ✗ RAWG_API_KEY not set');
  console.error('  → Register free at https://rawg.io/apidocs');
  console.error('  → Store it: famtec add rawg   (or)');
  console.error('  → Pass inline: RAWG_API_KEY=xxx node rawg-harvester.js\n');
  process.exit(1);
}

// Curated search terms targeting culturally significant, landmark games.
// We prioritise critical/historical importance over popularity — games that
// shaped culture, genre, or technology, spread across decades and platforms.
const SEARCH_QUERIES = [
  // 1970s–80s arcade and early home
  'Space Invaders',
  'Pac-Man',
  'Donkey Kong',
  'Asteroids',
  'Tetris',
  // Late 80s / early 90s — defining genres
  'Super Mario Bros',
  'The Legend of Zelda',
  'Mega Man',
  'Final Fantasy',
  'Sonic the Hedgehog',
  // 90s — 3D revolution + adventure golden age
  'Doom',
  'Quake',
  'Myst',
  'StarCraft',
  'Diablo',
  'Tomb Raider',
  'Metal Gear Solid',
  'Half-Life',
  'Pokémon Red Blue',
  'Street Fighter II',
  // 2000s — cinematic and open world
  'Grand Theft Auto III',
  'Halo Combat Evolved',
  'World of Warcraft',
  'Shadow of the Colossus',
  'Ico',
  'Katamari Damacy',
  'The Sims',
  'God of War',
  'Bioshock',
  // 2010s — indie and artistic games
  'Journey',
  'Minecraft',
  'The Last of Us',
  'Papers Please',
  'Undertale',
  'Celeste',
  'Inside',
  'What Remains of Edith Finch',
  'Night in the Woods',
  'Disco Elysium',
  // Cultural diversity and non-Western games
  'Okami',
  'Persona 4',
  'Flower',
  'Gris',
  'Spiritfarer',
  // Strategy and simulation as cultural form
  'Civilization',
  'SimCity',
  'Dwarf Fortress',
  // Recent landmark games
  'Return of the Obra Dinn',
  'Hades',
  'Pentiment',
  'Elden Ring',
];

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const LIMIT        = parseInt(getArg('limit', '200'), 10);
const GENRE_FILTER = getArg('genre', '');
const DRY_RUN      = args.includes('--dry-run');

// ── HELPERS ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ARCHAI/1.0 (research; rob@fineartmedia.tech)',
          'Accept': 'application/json',
        },
      });
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

// Build canonical RAWG game URL
function rawgUrl(slug) {
  return `https://rawg.io/games/${slug}`;
}

// Extract platform names (first 5, avoid overwhelming the description)
function platformList(platforms) {
  if (!Array.isArray(platforms)) return '';
  return platforms
    .slice(0, 5)
    .map(p => p.platform?.name || '')
    .filter(Boolean)
    .join(', ');
}

// Extract genre names
function genreList(genres) {
  if (!Array.isArray(genres)) return '';
  return genres.map(g => g.name).filter(Boolean).join(', ');
}

// ── EMBEDDING ────────────────────────────────────────────────────
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text.substring(0, 2000) }),
  });
  return (await res.json()).embedding;
}

// ── QDRANT ───────────────────────────────────────────────────────
async function ensureCollection() {
  try {
    const r = await fetch(`${QDRANT_URL}/collections/${COLLECTION}`);
    if (r.ok) { console.log(`  ✓ Collection '${COLLECTION}' exists`); return; }
  } catch (_) {}
  const testVec = await embed('test');
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: testVec.length, distance: 'Cosine' } }),
  });
  console.log(`  ✓ Created collection '${COLLECTION}' (dim: ${testVec.length})`);
}

async function upsertPoint(id, vector, payload) {
  await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [{ id, vector, payload }] }),
  });
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║   ARCHAI — RAWG Video Games Database     ║');
  console.log('  ║   Games as Cultural Objects              ║');
  console.log('  ╚══════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('  [DRY RUN — no Qdrant writes]\n');

  try { await fetch(`${OLLAMA_URL}/api/tags`); console.log('  ✓ Ollama online'); }
  catch (_) { console.error('  ✗ Ollama not reachable at', OLLAMA_URL); process.exit(1); }

  try { await fetch(`${QDRANT_URL}/collections`); console.log('  ✓ Qdrant online'); }
  catch (_) { console.error('  ✗ Qdrant not reachable at', QDRANT_URL); process.exit(1); }

  if (!DRY_RUN) await ensureCollection();

  const seen = new Set();
  const candidates = [];

  console.log('  → Searching RAWG for culturally significant games…\n');

  for (const q of SEARCH_QUERIES) {
    if (candidates.length >= LIMIT * 3) break;
    try {
      let url = `${RAWG_API}/games?key=${API_KEY}&search=${encodeURIComponent(q)}&page_size=5&ordering=-rating`;
      if (GENRE_FILTER) url += `&genres=${encodeURIComponent(GENRE_FILTER)}`;

      const data = await fetchJSON(url);
      if (!data?.results) { console.warn(`  ⚠ No results for "${q}"`); continue; }

      let added = 0;
      for (const game of data.results) {
        if (!game.id || seen.has(game.id)) continue;
        // Must have a background image to be useful on AUXIO
        if (!game.background_image) continue;
        seen.add(game.id);
        candidates.push(game);
        added++;
      }
      console.log(`  → "${q}" — ${data.results.length} results, ${added} new (total: ${candidates.length})`);
      await sleep(350);
    } catch (e) {
      console.warn(`  ⚠ "${q}" — ${e.message}`);
      await sleep(500);
    }
  }

  console.log(`\n  ✓ ${candidates.length} candidate games`);
  console.log(`  → Fetching details and embedding up to ${LIMIT} games…\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (success >= LIMIT) break;
    const stub = candidates[i];

    try {
      // Fetch full game detail for description and additional fields
      const detail = await fetchJSON(`${RAWG_API}/games/${stub.slug}?key=${API_KEY}`);
      const game = detail || stub;
      await sleep(200);

      const title      = game.name || 'Untitled';
      const slug       = game.slug || String(game.id);
      const released   = game.released || '';
      const year       = released ? released.substring(0, 4) : '';
      const genres     = genreList(game.genres);
      const platforms  = platformList(game.platforms);
      const devs       = (game.developers || []).map(d => d.name).join(', ');
      const pubs       = (game.publishers || []).map(p => p.name).join(', ');
      const rating     = game.rating ? `Rating: ${game.rating}/5` : '';
      const metacritic = game.metacritic ? `Metacritic: ${game.metacritic}` : '';
      const esrb       = game.esrb_rating?.name || '';
      const tags       = (game.tags || []).slice(0, 8).map(t => t.name).join(', ');

      // Wellcome-style clean description from the RAWG description_raw field
      const rawDesc = (game.description_raw || game.description || '')
        .replace(/<[^>]+>/g, '')   // strip any HTML tags
        .substring(0, 800);

      const description = [
        title,
        year         ? `(${year})` : '',
        devs         ? `Developed by ${devs}` : '',
        pubs         ? `Published by ${pubs}` : '',
        genres       ? `Genres: ${genres}` : '',
        platforms    ? `Platforms: ${platforms}` : '',
        rating,
        metacritic,
        esrb         ? `ESRB: ${esrb}` : '',
        tags         ? `Tags: ${tags}` : '',
        rawDesc,
      ].filter(Boolean).join('. ');

      const payload = {
        canonical_id:           `rawg:${game.id}`,
        source:                 'rawg',
        source_institution:     'RAWG Video Games Database',
        title,
        artist:                 devs,
        publisher:              pubs,
        date_range:             year,
        released,
        genres,
        platforms,
        esrb_rating:            esrb,
        metacritic:             game.metacritic || null,
        rating:                 game.rating || null,
        tags,
        description,
        // ATTRIBUTION — required by RAWG terms; must be rendered as clickable link
        licence:                'Free with attribution — active link to rawg.io required on every display page',
        media_public_display_allowed: true,
        poster_download_allowed: false,
        media_rights_basis:     'RAWG API display terms; redistribution and derivative downloads not granted',
        rawg_attribution_url:   'https://rawg.io',
        source_url:             rawgUrl(slug),
        media_thumbnail:        game.background_image || '',
        media_medium:           game.background_image || '',
        media_large:            game.background_image || '',
        embedding_text:         description,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${title} (${year}) — ${genres}`);
        success++;
        continue;
      }

      const vector = await embed(description);
      if (!vector?.length) { errors++; continue; }

      await upsertPoint(ID_OFFSET + success, vector, payload);
      success++;

      const pct = Math.round((i + 1) / candidates.length * 100);
      process.stdout.write(`  [${pct}%] ${success}/${candidates.length} · ${title.substring(0, 50)}\r`);
      await sleep(200);
    } catch (e) {
      errors++;
      await sleep(400);
    }
  }

  console.log(`\n\n  ════════════════════════════════════════════`);
  console.log(`  ✓ RAWG harvest complete`);
  console.log(`  → ${success} games embedded into '${COLLECTION}' (offset: ${ID_OFFSET})`);
  console.log(`  → ${errors} errors`);
  console.log(`  → Licence: Free with attribution`);
  console.log(`  ⚠ ATTRIBUTION REQUIRED: every AUXIO page displaying RAWG data`);
  console.log(`    must include an active hyperlink to https://rawg.io\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
