function toText(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    const parts = value.map(toText).filter(Boolean);
    return [...new Set(parts)].join('. ').trim();
  }
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function normalizeLangCode(code) {
  if (!code) return 'und';
  return String(code).trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'und';
}

function normalizeMultilingualField(field) {
  if (!field) return {};

  if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
    const text = toText(field);
    return text ? { und: text } : {};
  }

  if (Array.isArray(field)) {
    const text = toText(field);
    return text ? { und: text } : {};
  }

  if (typeof field === 'object') {
    const out = {};
    for (const [rawCode, rawValue] of Object.entries(field)) {
      const text = toText(rawValue);
      if (!text) continue;
      out[normalizeLangCode(rawCode)] = text;
    }
    return out;
  }

  return {};
}

function mergeLanguageMaps(...maps) {
  const merged = {};
  for (const map of maps) {
    if (!map || typeof map !== 'object') continue;
    for (const [lang, text] of Object.entries(map)) {
      if (!text || merged[lang]) continue;
      merged[lang] = text;
    }
  }
  return merged;
}

function pickBestLanguage(map, preferred = ['en', 'eng', 'def', 'und']) {
  if (!map || typeof map !== 'object') return '';
  for (const key of preferred) {
    if (map[key]) return map[key];
  }
  const firstKey = Object.keys(map)[0];
  return firstKey ? map[firstKey] : '';
}

function pickPrimaryLanguage(maps, fallback = 'und') {
  const counts = new Map();
  for (const map of maps) {
    if (!map || typeof map !== 'object') continue;
    for (const lang of Object.keys(map)) {
      counts.set(lang, (counts.get(lang) || 0) + 1);
    }
  }

  const priorities = ['en', 'eng', fallback, 'def', 'und'];
  for (const lang of priorities) {
    if (lang && counts.has(lang)) return lang;
  }

  let best = null;
  for (const [lang, count] of counts.entries()) {
    if (!best || count > best.count) best = { lang, count };
  }
  return best ? best.lang : (fallback || 'und');
}

function collectLanguages(...maps) {
  return [...new Set(maps.flatMap(map => map && typeof map === 'object' ? Object.keys(map) : []))].sort();
}

function buildDisplayTexts({ titleMap = {}, descriptionMap = {}, primaryLanguage = 'und' }) {
  const languages = collectLanguages(titleMap, descriptionMap);
  const displayTexts = {};

  for (const lang of languages) {
    displayTexts[lang] = {
      title: titleMap[lang] || pickBestLanguage(titleMap),
      description: descriptionMap[lang] || pickBestLanguage(descriptionMap)
    };
  }

  if (!displayTexts[primaryLanguage] && (pickBestLanguage(titleMap) || pickBestLanguage(descriptionMap))) {
    displayTexts[primaryLanguage] = {
      title: pickBestLanguage(titleMap),
      description: pickBestLanguage(descriptionMap)
    };
  }

  return displayTexts;
}

export {
  normalizeMultilingualField,
  mergeLanguageMaps,
  pickBestLanguage,
  pickPrimaryLanguage,
  collectLanguages,
  buildDisplayTexts
};
