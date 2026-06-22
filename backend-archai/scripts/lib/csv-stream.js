// Streaming RFC 4180-style CSV reader for large museum exports.
// Handles escaped quotes and newlines inside quoted fields without loading
// the complete source file into memory.

export async function* parseCsvRows(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let headers = null;
  let fields = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;

  function finishField() {
    fields.push(field);
    field = '';
  }

  function finishRow() {
    finishField();
    const row = fields;
    fields = [];
    return row;
  }

  function toObject(row) {
    const record = {};
    for (let i = 0; i < headers.length; i++) record[headers[i]] = row[i] ?? '';
    return record;
  }

  let done = false;
  while (!done) {
    const next = await reader.read();
    done = next.done;
    const chunk = decoder.decode(next.value || new Uint8Array(), { stream: !done });

    for (const char of chunk) {
      if (inQuotes) {
        if (afterQuote) {
          if (char === '"') {
            field += '"';
            afterQuote = false;
            continue;
          }
          inQuotes = false;
          afterQuote = false;
          // The current character is the delimiter following the closing quote.
        } else if (char === '"') {
          afterQuote = true;
          continue;
        } else {
          field += char;
          continue;
        }
      }

      if (char === '"' && field.length === 0) {
        inQuotes = true;
      } else if (char === ',') {
        finishField();
      } else if (char === '\n') {
        const row = finishRow();
        if (!headers) headers = row.map((value) => value.replace(/^\uFEFF/, '').trim().toLowerCase());
        else if (row.some(Boolean)) yield toObject(row);
      } else if (char !== '\r') {
        field += char;
      }
    }
  }

  if (afterQuote) inQuotes = false;
  if (inQuotes) throw new Error('CSV ended inside a quoted field');
  if (field.length || fields.length) {
    const row = finishRow();
    if (!headers) headers = row.map((value) => value.replace(/^\uFEFF/, '').trim().toLowerCase());
    else if (row.some(Boolean)) yield toObject(row);
  }
}

export async function fetchCsvRows(url, userAgent = 'ARCHAI legal harvester') {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!response.ok || !response.body) throw new Error(`CSV fetch failed (${response.status}): ${url}`);
  return parseCsvRows(response.body);
}
