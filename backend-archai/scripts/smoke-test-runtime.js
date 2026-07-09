#!/usr/bin/env node

const baseUrl = process.env.ARCHAI_BACKEND_URL || 'http://localhost:8787';

const checks = [
  { label: 'Backend health', path: '/api/health', expect: [200] },
  { label: 'AUXIO manifest', path: '/api/aux-manifest', expect: [200] },
  { label: 'Published media manifest', path: '/api/media/published', expect: [200] },
  { label: 'AUXIO WACZ access page', path: '/api/media/published/auxio_public_2026-06-22/replay', expect: [200] },
  { label: 'AUXIO WACZ screenshot', path: '/api/media/published/auxio_public_2026-06-22/capture-image', expect: [200], contentType: 'image/png' },
  { label: 'ARCHAI WACZ screenshot', path: '/api/media/published/archai_public_2026-06-22/capture-image', expect: [200], contentType: 'image/png' },
  { label: 'CD-ROM interactive player', path: '/api/media/published/cdrom_window_1997_demo/play', expect: [200] },
  { label: 'Epicycloid interactive player', path: '/api/media/published/epicycloid_2017_open_demo/play', expect: [200] },
];

async function main() {
  let failed = 0;

  for (const check of checks) {
    const url = new URL(check.path, baseUrl);
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const contentType = response.headers.get('content-type') || '';
      const okStatus = check.expect.includes(response.status);
      const okContent = !check.contentType || contentType.includes(check.contentType);

      if (!okStatus || !okContent) {
        failed += 1;
        console.log(`FAIL ${check.label}: ${response.status} ${contentType}`);
      } else {
        console.log(`OK   ${check.label}: ${response.status}`);
      }
    } catch (error) {
      failed += 1;
      console.log(`FAIL ${check.label}: ${error.message}`);
    }
  }

  if (failed) {
    console.error(`\n${failed} smoke check(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll ARCHAI runtime smoke checks passed.');
}

main();
