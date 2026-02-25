import { repo } from './objectRepository.js';

const CHIN_SOURCE_CATALOG = [
  {
    id: 'aat',
    label: 'Getty AAT',
    sourceKind: 'external',
    status: 'ready-for-adapter',
    notes: 'CHIN recommends AAT broadly; CHIN contributed French equivalents visible in AAT.',
  },
  {
    id: 'nomenclature',
    label: 'Nomenclature for Museum Cataloging',
    sourceKind: 'external',
    status: 'ready-for-adapter',
    notes: 'Strong CHIN/Parks Canada alignment for object naming/classification; bilingual and LOD-friendly.',
  },
  {
    id: 'docam_glossaurus',
    label: 'DOCAM Glossaurus',
    sourceKind: 'external',
    status: 'manual-import-or-adapter',
    notes: 'Useful for media art documentation/preservation terminology (EN/FR).',
  },
  {
    id: 'local_archai',
    label: 'ARCHAI Local Terms',
    sourceKind: 'local',
    status: 'active',
    notes: 'Institution/FAMTEC-specific terms and mappings.',
  },
];

function normalizeLocalTerm(term) {
  return {
    id: term.id,
    path: term.path,
    type: term.type,
    category: term.category,
    provider: 'local_archai',
    sourceLabel: 'ARCHAI Local Terms',
    language: 'en',
    broader: term.path.split('>').map((s) => s.trim()).filter(Boolean).slice(0, -1),
    narrower: [],
    scopeNote: '',
  };
}

function mockChinOverlayRows(q) {
  const query = q.toLowerCase();
  const rows = [];
  if (/install|media|generative|video|sound|interactive/.test(query)) {
    rows.push({
      id: 'chin_aat_300047896',
      path: 'visual works > installations (visual works)',
      type: 'Classification',
      category: 'CHIN/AAT profile',
      provider: 'aat',
      sourceLabel: 'Getty AAT (CHIN profile)',
      language: 'en',
      broader: ['visual works'],
      narrower: ['interactive installations', 'video installations', 'sound installations', 'generative installations'],
      scopeNote: 'AAT concept frequently used in museum cataloguing; suitable for CHIN-aligned humanities records.',
      externalIds: { aat: '300047896' },
    });
  }
  if (/object|catalog|artifact|classification|name/.test(query)) {
    rows.push({
      id: 'chin_nom_objname',
      path: 'Nomenclature > Object naming and classification',
      type: 'Classification',
      category: 'CHIN/Nomenclature profile',
      provider: 'nomenclature',
      sourceLabel: 'Nomenclature for Museum Cataloging (CHIN/Parks Canada aligned)',
      language: 'en/fr',
      broader: ['Nomenclature'],
      narrower: ['Object Name', 'Category', 'Class'],
      scopeNote: 'Recommended for object naming/classification in many Canadian museum workflows.',
      externalIds: {},
    });
  }
  if (/media art|preservation|emulation|migration|documentation|component/.test(query)) {
    rows.push({
      id: 'chin_docam_components',
      path: 'DOCAM Glossaurus > Components > media components',
      type: 'Classification',
      category: 'CHIN/DOCAM profile',
      provider: 'docam_glossaurus',
      sourceLabel: 'DOCAM Glossaurus (CHIN-linked reference)',
      language: 'en/fr',
      broader: ['Components'],
      narrower: ['display device', 'storage medium', 'software component'],
      scopeNote: 'Useful for media art documentation and conservation terminology.',
      externalIds: {},
    });
  }
  if (/discipline/.test(query)) {
    rows.push({
      id: 'chin_discipline_2006',
      path: 'CHIN Discipline Authority List (2006) > discipline',
      type: 'Classification',
      category: 'CHIN authority list',
      provider: 'chin_discipline',
      sourceLabel: 'CHIN Discipline Authority List proposed for the Humanities (2006)',
      language: 'en/fr',
      broader: ['discipline'],
      narrower: [],
      scopeNote: 'Short CHIN-derived list appropriate for discipline field in humanities records.',
      externalIds: {},
    });
  }
  return rows;
}

export function listVocabProviders(profile = 'default') {
  if (profile === 'chin') {
    return CHIN_SOURCE_CATALOG;
  }
  return [
    { id: 'local_archai', label: 'ARCHAI Local Terms', sourceKind: 'local', status: 'active', notes: 'Local thesaurus and mappings' },
  ];
}

export async function searchVocabFederated({ q = '', type, category, profile = 'default' }) {
  const local = repo.searchThesaurus({ q, type, category }).map(normalizeLocalTerm);
  if (profile !== 'chin') return local;

  const chinRows = mockChinOverlayRows(q || '');
  const merged = [...chinRows, ...local];

  // Deduplicate by id/path while preserving CHIN-profile rows first.
  const seen = new Set();
  return merged.filter((row) => {
    const key = `${row.id}|${row.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
