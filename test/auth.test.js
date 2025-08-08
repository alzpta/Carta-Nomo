import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

async function loadInitAuth({ signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, getDoc }) {
  const path = new URL('../src/auth.js', import.meta.url);
  let code = await readFile(path, 'utf8');
  code = code.replace(/import[\s\S]*?firebase-auth.js";\n/, '');
  code = code.replace(/import[\s\S]*?firebase-firestore.js";\n/, '');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  globalThis.signInWithEmailAndPassword = signInWithEmailAndPassword;
  globalThis.signOut = signOut;
  globalThis.onAuthStateChanged = onAuthStateChanged;
  globalThis.doc = doc;
  globalThis.getDoc = getDoc;
  return (await import(dataUrl)).initAuth;
}

function createElements() {
  const mkBtn = () => {
    const el = {
      style: { display: '' },
      listeners: {},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      click() { return this.listeners['click']?.(); },
      textContent: '',
    };
    return el;
  };
  const loginBackdrop = {
    style: { display: 'none' },
    listeners: {},
    addEventListener(event, fn) { this.listeners[event] = fn; },
    setAttribute() {},
  };
  const loginEmail = { value: '', focus() {} };
  const loginPass = { value: '' };
  return {
    loginBtn: mkBtn(),
    logoutBtn: mkBtn(),
    editarBtn: mkBtn(),
    borrarBtn: mkBtn(),
    exportBtn: mkBtn(),
    importBtn: mkBtn(),
    userInfo: { textContent: '' },
    loginBackdrop,
    loginEmail,
    loginPass,
    loginSubmit: mkBtn(),
    loginCancel: mkBtn(),
  };
}

test('login/logout flow and admin visibility', async () => {
  let authCallback;
  const onAuthStateChanged = (auth, cb) => { authCallback = cb; cb(null); };
  let admin = true;
  const doc = () => ({ });
  const getDoc = async () => ({ exists: () => true, data: () => ({ isAdmin: admin }) });
  const signInWithEmailAndPassword = async (auth, email, pass) => {
    await authCallback({ uid: 'u1', email });
  };
  const signOut = async () => { await authCallback(null); };

  const initAuth = await loadInitAuth({ signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, getDoc });
  globalThis.document = { body: { style: {} } };
  const elements = createElements();
  initAuth({}, { ...elements, db: {} });

  // Initially logged out
  assert.strictEqual(elements.loginBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.logoutBtn.style.display, 'none');
  assert.strictEqual(elements.editarBtn.style.display, 'none');

  // Login as admin
  elements.loginEmail.value = 'admin@test.com';
  elements.loginPass.value = 'secret';
  await elements.loginSubmit.click();
  assert.strictEqual(elements.loginBtn.style.display, 'none');
  assert.strictEqual(elements.logoutBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.editarBtn.style.display, 'inline-flex');
  assert.ok(elements.userInfo.textContent.includes('(admin)'));

  // Logout
  await elements.logoutBtn.click();
  assert.strictEqual(elements.loginBtn.style.display, 'inline-flex');
  assert.strictEqual(elements.editarBtn.style.display, 'none');

  // Login as non-admin
  admin = false;
  await elements.loginSubmit.click();
  assert.strictEqual(elements.editarBtn.style.display, 'none');
});
