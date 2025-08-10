import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '../src/db.js'), 'utf8');
const startToken = 'export async function guardarNumero';
const start = source.indexOf(startToken);
const open = source.indexOf('{', start);
let i = open + 1, depth = 1;
while (depth > 0 && i < source.length) {
  const ch = source[i];
  if (ch === '{') depth++;
  else if (ch === '}') depth--;
  i++;
}
const fnCode = 'async function guardarNumero' + source.slice(startToken.length + start, i);

const store = new Map();
const context = {
  Uint8Array,
  collection: (db, name) => ({ db, name }),
  doc: (colRef, id) => ({ colRef, id }),
  setDoc: async (docRef, data) => { store.set(docRef.id, data); },
  getDoc: async (docRef) => ({ exists: () => store.has(docRef.id), data: () => store.get(docRef.id) }),
  storageRef: () => ({}),
  uploadBytes: async () => {},
  getDownloadURL: async () => 'nueva.png',
};
vm.createContext(context);
vm.runInContext(fnCode, context);
const { guardarNumero } = context;

test('mantiene imagen existente si no se proporciona archivo', async () => {
  const db = {};
  const storage = {};
  store.set('1', { palabra: 'vieja', imageURL: 'existente.png', updatedAt: 0 });

  await guardarNumero(db, storage, 1, 'nueva', null);

  const saved = store.get('1');
  assert.equal(saved.imageURL, 'existente.png');
  assert.equal(saved.palabra, 'nueva');
});
