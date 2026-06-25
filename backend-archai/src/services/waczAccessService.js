import { execFileSync } from 'node:child_process';
import zlib from 'node:zlib';

export function listWaczEntries(localPath) {
  return execFileSync('unzip', ['-Z1', localPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  }).split(/\r?\n/).filter(Boolean);
}

export function readWaczEntry(localPath, entryName) {
  return execFileSync('unzip', ['-p', localPath, entryName], {
    maxBuffer: 20 * 1024 * 1024,
  });
}

export function extractFirstWarcPayload(warcGzBuffer, contentTypePrefix) {
  const raw = zlib.gunzipSync(warcGzBuffer);
  const marker = Buffer.from(`Content-Type: ${contentTypePrefix}`);
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) return null;

  const headerStart = raw.lastIndexOf(Buffer.from('WARC/1.1'), markerIndex);
  const headerEnd = raw.indexOf(Buffer.from('\r\n\r\n'), markerIndex);
  if (headerStart < 0 || headerEnd < 0) return null;

  const header = raw.subarray(headerStart, headerEnd).toString('utf8');
  const lengthMatch = /Content-Length:\s*(\d+)/i.exec(header);
  if (!lengthMatch) return null;

  const payloadStart = headerEnd + 4;
  const payloadLength = Number(lengthMatch[1]);
  if (!Number.isFinite(payloadLength) || payloadLength <= 0) return null;

  return raw.subarray(payloadStart, payloadStart + payloadLength);
}

export function getWaczPageInfo(localPath) {
  const pagesBuffer = readWaczEntry(localPath, 'pages/pages.jsonl');
  const pageLine = pagesBuffer
    .toString('utf8')
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith('{') && line.includes('"url"'));
  if (!pageLine) return null;

  try {
    return JSON.parse(pageLine);
  } catch {
    return null;
  }
}

export function extractWaczScreenshot(localPath) {
  const screenshotEntry = listWaczEntries(localPath)
    .find((entry) => /^archive\/screenshots-.+\.warc\.gz$/.test(entry));
  if (!screenshotEntry) return null;

  return extractFirstWarcPayload(readWaczEntry(localPath, screenshotEntry), 'image/png');
}
