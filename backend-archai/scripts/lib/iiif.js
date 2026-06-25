// ARCHAI IIIF helpers
// Normalises common IIIF Image API URL patterns used by GLAM harvesters.

export const DEFAULT_IIIF_SIZES = {
  thumbnail: 300,
  display: 800,
  large: 1600,
};

export function normaliseIiifBase(value = '') {
  const url = String(value || '').trim().replace(/^http:\/\//, 'https://');
  if (!url) return '';

  // Strip common IIIF Image API request suffixes back to the image service base.
  return url
    .replace(/\/info\.json(?:[?#].*)?$/i, '')
    .replace(/\/full\/[^/]+\/[^/]+\/[^/]+(?:\.[a-z0-9]+)?(?:[?#].*)?$/i, '')
    .replace(/\/square\/[^/]+\/[^/]+\/[^/]+(?:\.[a-z0-9]+)?(?:[?#].*)?$/i, '');
}

export function iiifImageUrl(base, size = DEFAULT_IIIF_SIZES.display, options = {}) {
  const normalisedBase = normaliseIiifBase(base);
  if (!normalisedBase) return '';

  const {
    region = 'full',
    rotation = '0',
    quality = 'default',
    format = 'jpg',
    mode = 'width',
  } = options;

  let sizePart;
  if (typeof size === 'string') {
    sizePart = size;
  } else if (mode === 'fit') {
    sizePart = `!${size},${size}`;
  } else {
    sizePart = `${size},`;
  }

  return `${normalisedBase}/${region}/${sizePart}/${rotation}/${quality}.${format}`;
}

export function iiifInfoUrl(base) {
  const normalisedBase = normaliseIiifBase(base);
  return normalisedBase ? `${normalisedBase}/info.json` : '';
}

export function buildIiifImageSet(base, options = {}) {
  const {
    thumbnail = DEFAULT_IIIF_SIZES.thumbnail,
    display = DEFAULT_IIIF_SIZES.display,
    large = DEFAULT_IIIF_SIZES.large,
    mode = 'width',
    includeInfo = true,
  } = options;
  const normalisedBase = normaliseIiifBase(base);
  if (!normalisedBase) {
    return {
      iiif_base: '',
      media_thumbnail: '',
      media_medium: '',
      media_large: '',
      iiif_info_url: '',
    };
  }

  return {
    iiif_base: normalisedBase,
    media_thumbnail: iiifImageUrl(normalisedBase, thumbnail, { mode }),
    media_medium: iiifImageUrl(normalisedBase, display, { mode }),
    media_large: iiifImageUrl(normalisedBase, large, { mode }),
    iiif_info_url: includeInfo ? iiifInfoUrl(normalisedBase) : '',
  };
}

export function looksLikeIiifImageService(value = '') {
  const url = String(value || '');
  return /\/iiif\/|iiif\.|\/full\/[^/]+\/[^/]+\/[^/]+(?:\.[a-z0-9]+)?|\/info\.json/i.test(url);
}
