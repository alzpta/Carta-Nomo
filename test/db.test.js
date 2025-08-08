import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

async function loadGuardarNumero({ setDoc, getDoc }) {
  const path = new URL('../src/db.js', import.meta.url);
  let code = await readFile(path, 'utf8');
  code = code.replace(/import[^\n]*firebase-firestore.js";\n/, '');
  code = code.replace(/import[^\n]*firebase-storage.js";\n/, '');
  code = code.replace(/import[^\n]*\.\/config.js';\n/, '');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  globalThis.collection = () => ({});
  globalThis.doc = () => ({});
  globalThis.setDoc = setDoc;
  globalThis.getDoc = getDoc;
  globalThis.deleteDoc = () => {};
  globalThis.onSnapshot = () => {};
  globalThis.storageRef = () => ({});
  globalThis.uploadBytes = async () => {};
  globalThis.getDownloadURL = async () => {};
  globalThis.deleteObject = async () => {};
  const module = await import(dataUrl);
  return module.guardarNumero;
}

test('editar sin nueva imagen mantiene imagenUrl y descripcion existentes', async () => {
  const existente = { descripcion: 'vieja', imagenUrl: 'old.png' };

  const getDocMock = async () => ({ exists: () => true, data: () => existente });
  const calls = [];
  const setDocMock = async (...args) => calls.push(args);

  const guardarNumero = await loadGuardarNumero({ setDoc: setDocMock, getDoc: getDocMock });

  await guardarNumero({}, {}, 5, 'cinco', undefined, null);

  assert.strictEqual(calls.length, 1);
  const dataArg = calls[0][1];
  assert.strictEqual(dataArg.descripcion, 'vieja');
  assert.strictEqual(dataArg.imagenUrl, 'old.png');
  const opts = calls[0][2];
  assert.deepStrictEqual(opts, { merge: true });
});
