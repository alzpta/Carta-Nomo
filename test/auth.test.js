import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

async function loadInitAuth({ onAuthStateChanged, getDoc }) {
  const path = new URL('../src/auth.js', import.meta.url);
  let code = await readFile(path, 'utf8');
  code = code.replace(/\nimport { signInWithEmailAndPassword[\s\S]*$/, '');
  code = code.replace(/import[\s\S]*?firebase-auth.js";\n/g, '');
  code = code.replace(/import[\s\S]*?firebase-firestore.js";\n/g, '');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  globalThis.signInWithEmailAndPassword = async () => {};
  globalThis.signOut = async () => {};
  globalThis.onAuthStateChanged = onAuthStateChanged;
  globalThis.doc = () => ({});
  globalThis.getDoc = getDoc;
  const module = await import(dataUrl);
  return module.initAuth;
}

function stubEl() {
  return { style: {}, addEventListener: () => {}, setAttribute: () => {} };
}

test('admin-only buttons visibility', async () => {
  const handlers = [];
  let admin = false;
  const initAuth = await loadInitAuth({
    onAuthStateChanged: (auth, cb) => handlers.push(cb),
    getDoc: async () => ({ exists: () => true, data: () => ({ isAdmin: admin }) }),
  });

  const elements = {
    loginBtn: stubEl(),
    logoutBtn: stubEl(),
    editarBtn: stubEl(),
    borrarBtn: stubEl(),
    exportBtn: stubEl(),
    importBtn: stubEl(),
    userInfo: { style: {}, textContent: '' },
    loginBackdrop: stubEl(),
    loginEmail: { value: '', focus: () => {} },
    loginPass: { value: '' },
    loginSubmit: stubEl(),
    loginCancel: stubEl(),
    db: {},
  };

  initAuth({}, elements);

  // Non-admin user
  admin = false;
  await handlers[0]({ uid: 'u1' });
  assert.strictEqual(elements.editarBtn.style.display, 'none');
  assert.strictEqual(elements.borrarBtn.style.display, 'none');
  assert.strictEqual(elements.exportBtn.style.display, 'none');
  assert.strictEqual(elements.importBtn.style.display, 'none');

  // Admin user
  admin = true;
  await handlers[0]({ uid: 'u1' });
  assert.strictEqual(elements.editarBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.borrarBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.exportBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.importBtn.style.display, 'inline-flex');
});

