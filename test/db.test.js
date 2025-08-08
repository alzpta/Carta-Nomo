import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

async function loadGuardarNumero({ setDoc, getDoc }) {
  const path = new URL('../src/db.js', import.meta.url);
  let code = await readFile(path, 'utf8');

  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  globalThis.collection = () => ({});
  globalThis.doc = () => ({});
  globalThis.setDoc = setDoc;
  globalThis.getDoc = getDoc;
  globalThis.serverTimestamp = () => ({}) ;
  globalThis.deleteDoc = () => {};
  globalThis.onSnapshot = () => {};
  globalThis.serverTimestamp = () => ({});
  globalThis.storageRef = () => ({});
  globalThis.uploadBytes = async () => {};
  globalThis.getDownloadURL = async () => {};
  globalThis.deleteObject = async () => {};
  globalThis.serverTimestamp = () => {};
  const module = await import(dataUrl);
  return module.guardarNumero;
}


  const calls = [];
  const setDocMock = async (...args) => calls.push(args);

  const guardarNumero = await loadGuardarNumero({ setDoc: setDocMock, getDoc: async () => ({}) });

  await guardarNumero({}, {}, 5, 'cinco', undefined, null);

  assert.strictEqual(getDocCalls.length, 1);
  assert.strictEqual(calls.length, 1);
  const dataArg = calls[0][1];

  const opts = calls[0][2];
  assert.deepStrictEqual(opts, { merge: true });
});
