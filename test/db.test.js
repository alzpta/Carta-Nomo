import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

async function loadGuardarNumero({ setDoc, getDoc }) {
  const path = new URL('../src/db.js', import.meta.url);
  let code = await readFile(path, 'utf8');
  code = code.replace(/\nimport { collection, doc, setDoc, deleteDoc, onSnapshot }[\s\S]*$/, '');
  code = code.replace(/import[\s\S]*?firebase-firestore.js";\n/g, '');
  code = code.replace(/import[\s\S]*?firebase-storage.js";\n/g, '');
  code = code.replace(/import[\s\S]*?\.\/config.js';\n/g, '');
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
  globalThis.serverTimestamp = () => {};
  const module = await import(dataUrl);
  return module.guardarNumero;
}

test('editar sin nueva imagen mantiene imagenUrl y descripcion existentes', async () => {
  const calls = [];
  const setDocMock = async (...args) => calls.push(args);

  const guardarNumero = await loadGuardarNumero({ setDoc: setDocMock, getDoc: async () => ({}) });

  await guardarNumero({}, {}, 5, 'cinco', undefined, null);

  assert.strictEqual(calls.length, 1);
  const dataArg = calls[0][1];
  assert.strictEqual(dataArg.descripcion, undefined);
  assert.strictEqual(dataArg.imagenUrl, undefined);
  const opts = calls[0][2];
  assert.deepStrictEqual(opts, { merge: true });
});
