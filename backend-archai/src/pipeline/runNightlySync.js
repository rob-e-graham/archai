import { runNightlySync } from '../services/vectorPipelineService.js';

const batch = await runNightlySync({ initiatedBy: 'cli' });
console.log(JSON.stringify(batch, null, 2));
