import { syncCuratorSources } from '../src/services/curator-vectors.js';

const collections = process.argv.slice(2);
const result = await syncCuratorSources({
  collections: collections.length ? collections : null,
  onProgress: console.log,
});

console.log(JSON.stringify(result, null, 2));
