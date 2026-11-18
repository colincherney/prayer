const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { createClient } = require('@supabase/supabase-js');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const source = fs.readFileSync(require.resolve(`../src/lib/${file}`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function('exports', 'require', outputText)(exports, name => dependencies[name]);
  return exports;
}

const references = load('bibleReferences.ts');

function passageReader(rows) {
  const requests = [];
  const supabase = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false },
    global: {
      async fetch(url) {
        const request = new URL(url);
        requests.push(request);
        const offset = Number(request.searchParams.get('offset'));
        const limit = Number(request.searchParams.get('limit'));
        return Response.json(rows.slice(offset, offset + limit));
      },
    },
  });
  const { fetchBiblePassages } = load('biblePassages.ts', {
    './bibleReferences': references,
    './supabase': { supabase },
  });
  return { requests, fetchBiblePassages };
}

test('numbered books load the exact verses in numeric order and collapse duplicate rows', async () => {
  const rows = ['1', '10', '11', '9', '9', '12'].map(verse => ({ chapter: '13', verse, text: `Verse ${verse}` }));
  const { requests, fetchBiblePassages } = passageReader(rows);
  const sections = await fetchBiblePassages(['1 Corinthians 13:9–11'], new AbortController().signal);

  assert.equal(requests[0].pathname, '/rest/v1/KJV');
  assert.equal(requests[0].searchParams.get('book'), 'eq.I Corinthians');
  assert.equal(requests[0].searchParams.get('chapter'), 'in.(13)');
  assert.equal(sections[0].title, '1 Corinthians 13');
  assert.deepEqual(sections[0].data.map(verse => verse.number), [9, 10, 11]);
});

test('a chapter range includes verses beyond the first page and keeps chapter order', async () => {
  const rows = Array.from({ length: 1000 }, () => ({ chapter: '9', verse: '1', text: 'First chapter' }));
  rows.push({ chapter: '10', verse: '1', text: 'Second chapter' });
  const { requests, fetchBiblePassages } = passageReader(rows);
  const sections = await fetchBiblePassages(['Acts 9–10'], new AbortController().signal);

  assert.deepEqual(requests.map(request => request.searchParams.get('offset')), ['0', '1000']);
  assert.ok(requests.every(request => request.searchParams.get('order') === 'id.asc'));
  assert.deepEqual(sections.map(section => section.title), ['Acts 9', 'Acts 10']);
  assert.deepEqual(sections.map(section => section.data.length), [1, 1]);
});
