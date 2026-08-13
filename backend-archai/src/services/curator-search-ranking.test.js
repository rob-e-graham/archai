import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCuratorQuery,
  buildMetadataCandidate,
  buildCuratorQueryVariants,
  exhibitionImageUrl,
  mergeCuratorResultSets,
  rankCuratorResults,
} from './curator-search-ranking.js';

function result(id, source, title, description, image = '') {
  return {
    id,
    score: 0.7,
    payload: {
      canonical_id: id,
      _source_collection: source,
      title,
      description,
      media_large: image,
      media_available: Boolean(image),
      media_public_display_allowed: true,
    },
  };
}

test('detects AI, image and cross-collection intent without matching words containing ai', () => {
  assert.deepEqual(analyzeCuratorQuery('Find AI artworks with great pictures across all collections'), {
    ai: true,
    imageIntent: true,
    broad: true,
  });
  assert.equal(analyzeCuratorQuery('paintings from Melbourne').ai, false);
  assert.equal(analyzeCuratorQuery('works by Ai Weiwei').ai, false);
  assert.equal(analyzeCuratorQuery('ai artworks with pictures').ai, true);
});

test('expands an AI query into direct and contextual curatorial variants', () => {
  assert.equal(buildCuratorQueryVariants('AI artworks').length, 4);
  assert.equal(buildCuratorQueryVariants('ceramic bowls').length, 1);
});

test('normalises metadata-only candidates for exhaustive AI review', () => {
  const candidate = buildMetadataCandidate(result('m1', 'archai_mplus', 'Robot Building', 'Architectural model shaped as a robot', 'https://example.test/m1.jpg'));
  assert.equal(candidate._semantic_score, 0.7);
  assert.equal(candidate._query_hits, 1);
});

test('enforces public image gates', () => {
  assert.equal(exhibitionImageUrl({ media_large: 'https://example.test/work.jpg', media_public_display_allowed: true }), 'https://example.test/work.jpg');
  assert.equal(exhibitionImageUrl({ media_large: 'https://example.test/work.jpg', media_public_display_allowed: false }), '');
  assert.equal(exhibitionImageUrl({ media_large: 'https://example.test/placeholder.jpg', media_public_display_allowed: true }), '');
});

test('prefers explicit AI evidence and removes unsupported semantic matches', () => {
  const candidates = mergeCuratorResultSets([[
    result('street', 'archai_streetart', 'A wall of perception', 'A reflective community mural', 'https://example.test/street.jpg'),
    result('ai', 'archai_va', 'Visual Theogonies', 'Images of the computational god and artificial intelligence', 'https://example.test/ai.jpg'),
  ]]);
  const ranked = rankCuratorResults(candidates, 'AI artworks with pictures', { limit: 10, imageReady: true });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 'ai');
  assert.equal(ranked[0].match.relationship, 'direct');
});

test('does not read the name Ai as the AI acronym', () => {
  const candidates = mergeCuratorResultSets([[
    result('artist', 'archai_mplus', 'Portrait of Ai Weiwei', 'Photograph of the artist', 'https://example.test/artist.jpg'),
  ]]);
  const ranked = rankCuratorResults(candidates, 'AI artworks with pictures', { limit: 10, imageReady: true });
  assert.equal(ranked.length, 0);
});

test('treats a body-only AI acronym as contextual rather than explicit evidence', () => {
  const candidate = result('game', 'archai_rawg', 'Example Game', 'Includes AI-controlled opponents', 'https://example.test/game.jpg');
  const ranked = rankCuratorResults(mergeCuratorResultSets([[candidate]]), 'AI artworks with pictures', { limit: 10, imageReady: true });
  assert.equal(ranked[0].match.relationship, 'contextual');
  assert.deepEqual(ranked[0].match.evidence, ['AI reference']);
});

test('treats a late AI mention as contextual evidence', () => {
  const longDescription = `${'unrelated catalogue text '.repeat(180)} A.I. provided translation for the work.`;
  const candidate = result('late', 'archai_internetarchive', 'Field recording', longDescription, 'https://example.test/late.jpg');
  const ranked = rankCuratorResults(mergeCuratorResultSets([[candidate]]), 'AI artworks with pictures', { limit: 10, imageReady: true });
  assert.equal(ranked[0].match.relationship, 'contextual');
  assert.deepEqual(ranked[0].match.evidence, ['AI mentioned in extended description']);
});

test('ignores an incidental AI mention beyond the reviewed description window', () => {
  const longDescription = `${'unrelated catalogue text '.repeat(1000)} artificial intelligence appears in a remote appendix.`;
  const candidate = result('remote', 'archai_internetarchive', 'Natural Selection', longDescription, 'https://example.test/remote.jpg');
  const ranked = rankCuratorResults(mergeCuratorResultSets([[candidate]]), 'AI artworks with pictures', { limit: 10, imageReady: true });
  assert.equal(ranked.length, 0);
});

test('balances sources when relevant records have comparable scores', () => {
  const candidates = mergeCuratorResultSets([[
    result('a1', 'archai_va', 'Algorithm 1', 'Algorithmic art', 'https://example.test/a1.jpg'),
    result('a2', 'archai_va', 'Algorithm 2', 'Algorithmic art', 'https://example.test/a2.jpg'),
    result('a3', 'archai_va', 'Algorithm 3', 'Algorithmic art', 'https://example.test/a3.jpg'),
    result('b1', 'archai_acmi', 'Computer Vision', 'Computer vision artwork', 'https://example.test/b1.jpg'),
  ]]);
  const ranked = rankCuratorResults(candidates, 'AI across all collections', { limit: 3, imageReady: true });
  assert.deepEqual(new Set(ranked.slice(0, 2).map((item) => item.payload._source_collection)), new Set(['archai_va', 'archai_acmi']));
});

test('limits repetition from one maker and object family', () => {
  const candidates = mergeCuratorResultSets([[
    { ...result('a1', 'archai_va', 'Drawing 1', 'Computer-generated drawing', 'https://example.test/a1.jpg'), payload: { ...result('a1', 'archai_va', 'Drawing 1', 'Computer-generated drawing', 'https://example.test/a1.jpg').payload, maker: 'One Artist', object_type: 'Computer-generated drawing' } },
    { ...result('a2', 'archai_va', 'Drawing 2', 'Computer-generated drawing', 'https://example.test/a2.jpg'), payload: { ...result('a2', 'archai_va', 'Drawing 2', 'Computer-generated drawing', 'https://example.test/a2.jpg').payload, maker: 'One Artist', object_type: 'Computer-generated drawing' } },
    { ...result('b1', 'archai_mplus', 'Robot Building', 'A building designed to resemble a robot', 'https://example.test/b1.jpg'), payload: { ...result('b1', 'archai_mplus', 'Robot Building', 'A building designed to resemble a robot', 'https://example.test/b1.jpg').payload, maker: 'Another Artist', object_type: 'Architectural model' } },
  ]]);
  const ranked = rankCuratorResults(candidates, 'AI across all collections', { limit: 3, imageReady: true });
  assert.equal(ranked[1].id, 'b1');
});

test('caps one repeated AI object family in broad results', () => {
  const repeated = Array.from({ length: 6 }, (_, index) => {
    const item = result(`a${index}`, 'archai_va', `Drawing ${index}`, 'Computer-generated drawing', `https://example.test/a${index}.jpg`);
    item.payload.maker = 'One Artist';
    item.payload.object_type = 'Computer-generated drawing';
    return item;
  });
  const distinct = result('b1', 'archai_mplus', 'Robot Building', 'Architectural model shaped as a robot', 'https://example.test/b1.jpg');
  distinct.payload.maker = 'Another Artist';
  distinct.payload.object_type = 'Architectural model';
  const ranked = rankCuratorResults(mergeCuratorResultSets([[...repeated, distinct]]), 'AI across all collections', { limit: 10, imageReady: true });
  assert.equal(ranked.filter((item) => item.payload.maker === 'One Artist').length, 3);
  assert.equal(ranked.some((item) => item.id === 'b1'), true);
});
