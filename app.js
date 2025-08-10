import { BASE_PATH, MAX_NUMEROS } from "./src/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initAuth } from "./src/auth.js";
import { renderView, openView } from "./src/viewPopup.js";

// Helpers para manifest/iconos según BASE_PATH
const addLink = (rel, href) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
};
addLink('apple-touch-icon', `${BASE_PATH}/icons/apple-touch-icon.png`);
addLink('icon', `${BASE_PATH}/icons/favicon-32x32.png`);

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAqqDLPFmtAPHXm5ZzpHyxRZZpW31f4Of0",
  authDomain: "carta-nomo.firebaseapp.com",
  projectId: "carta-nomo",
  storageBucket: "carta-nomo.firebasestorage.app",
  messagingSenderId: "354109744323",
  appId: "1:354109744323:web:d7548e8cfd0a1d4a41ae76",
  measurementId: "G-LWB4H4F6TD"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

initAuth(auth, {
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  editarBtn: null,
  borrarBtn: null,
  exportBtn: null,
  importBtn: null,
  userInfo: document.getElementById('userInfo'),
  loginBackdrop: document.getElementById('loginBackdrop'),
  loginEmail: document.getElementById('loginEmail'),
  loginPass: document.getElementById('loginPass'),
  loginSubmit: document.getElementById('loginSubmit'),
  loginCancel: document.getElementById('loginCancel')
});

const grid = document.getElementById('grid');

if (grid) {
  for (let i = 1; i <= MAX_NUMEROS; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.dataset.n = String(i);
    btn.textContent = String(i);
    grid.appendChild(btn);
  }
}

export async function fetchNumberDoc(n) {
  const ref = doc(db, 'numeros', String(n));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: ref.id, ...snap.data() };
}

// Click en celdas -> abrir popup
grid?.addEventListener('click', async (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  const n = Number(cell.dataset.n || cell.textContent?.trim());
  if (!n) return;

  const docData = await fetchNumberDoc(n);
  renderView({
    n,
    palabra: docData?.palabra || '',
    descripcion: docData?.descripcion || '',
    imageURL: docData?.imageURL || ''
  });
  openView();
});
