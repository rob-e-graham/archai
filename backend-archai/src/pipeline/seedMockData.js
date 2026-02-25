import { runNightlySync } from '../services/vectorPipelineService.js';

const batch = await runNightlySync({ initiatedBy: 'seed:mock' });
console.log(`Seeded vector index with ${batch.counts.embedded} objects (skipped ${batch.counts.skipped})`);
