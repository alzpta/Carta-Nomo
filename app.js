import { BASE_PATH, MAX_NUMEROS } from "./src/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initAuth } from "./src/auth.js";
import { renderView, openView } from "./src/viewPopup.js";
import { subscribeNumeros } from "./src/db.js";

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

// ── Búsqueda y filtro ────────────────────────────────────────────────
let allDatos = {};
let searchQuery = '';
const hiddenAllergens = new Set();

const ALLERGEN_KEYS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuete',
  'Soja', 'Leche', 'F. cáscara', 'Apio', 'Mostaza',
  'Sésamo', 'Altramuces', 'Sulfitos', 'Moluscos'
];

function updateGridVisibility() {
  if (!grid) return;
  const q = searchQuery.trim().toLowerCase();
  for (let i = 1; i <= MAX_NUMEROS; i++) {
    const btn = grid.children[i - 1];
    if (!btn) continue;
    const d = allDatos[i];
    btn.classList.toggle('empty', !d);
    if (!d) { btn.classList.remove('is-hidden'); continue; }

    const passSearch = !q ||
      d.palabra.toLowerCase().includes(q) ||
      d.descripcion.toLowerCase().includes(q) ||
      String(i) === q;

    const passAllergen = [...hiddenAllergens].every(alg => !d.alergenos[alg]);

    btn.classList.toggle('is-hidden', !passSearch || !passAllergen);
  }
}

// Barra de búsqueda
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
searchInput?.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  searchClear?.classList.toggle('hidden', !searchQuery);
  updateGridVisibility();
});
searchClear?.addEventListener('click', () => {
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  searchClear.classList.add('hidden');
  updateGridVisibility();
});

// Filter sheet
const filterBtn = document.getElementById('filterBtn');
const filterBackdrop = document.getElementById('filterBackdrop');
const filterClear = document.getElementById('filterClear');
const filterDone = document.getElementById('filterDone');
const filterList = document.getElementById('filterList');

function updateFilterBadge() {
  const count = hiddenAllergens.size;
  filterBtn?.classList.toggle('is-on', count > 0);
  let badge = filterBtn?.querySelector('.carta-filter-badge');
  if (!badge && filterBtn) {
    badge = document.createElement('span');
    badge.className = 'carta-filter-badge hidden';
    filterBtn.appendChild(badge);
  }
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('hidden', count === 0);
  }
}

function buildFilterList() {
  if (!filterList) return;
  filterList.innerHTML = '';
  ALLERGEN_KEYS.forEach(name => {
    const row = document.createElement('button');
    const on = hiddenAllergens.has(name);
    row.className = `filter-row${on ? ' is-on' : ''}`;
    row.innerHTML = `<span>${name}</span><span class="filter-toggle"><span class="filter-toggle-knob"></span></span>`;
    row.addEventListener('click', () => {
      if (hiddenAllergens.has(name)) hiddenAllergens.delete(name);
      else hiddenAllergens.add(name);
      row.classList.toggle('is-on', hiddenAllergens.has(name));
      updateFilterBadge();
      updateGridVisibility();
    });
    filterList.appendChild(row);
  });
}

filterBtn?.addEventListener('click', () => {
  buildFilterList();
  filterBackdrop?.classList.add('is-open');
});
filterBackdrop?.addEventListener('click', (e) => {
  if (e.target === filterBackdrop) filterBackdrop.classList.remove('is-open');
});
filterDone?.addEventListener('click', () => filterBackdrop?.classList.remove('is-open'));
filterClear?.addEventListener('click', () => {
  hiddenAllergens.clear();
  buildFilterList();
  updateFilterBadge();
  updateGridVisibility();
});

// ── Grid ─────────────────────────────────────────────────────────────
if (grid) {
  for (let i = 1; i <= MAX_NUMEROS; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.dataset.n = String(i);
    btn.textContent = String(i);
    grid.appendChild(btn);
  }

  subscribeNumeros(db, (datos) => {
    allDatos = datos;
    updateGridVisibility();
  });
}

export async function fetchNumberDoc(n) {
  const ref = doc(db, 'numeros', String(n));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: ref.id, ...snap.data() };
}

export function speak(text) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1;
  utterance.pitch = 1;
  synth.speak(utterance);
}

// Click en celdas -> abrir popup
grid?.addEventListener('click', async (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  if (cell.classList.contains('empty') || cell.classList.contains('is-hidden')) return;
  const n = Number(cell.dataset.n || cell.textContent?.trim());
  if (!n) return;

  const docData = await fetchNumberDoc(n);
  renderView({
    n,
    palabra: docData?.palabra || '',
    descripcion: docData?.descripcion || '',
    imageURL: docData?.imageURL || '',
    alergenos: docData?.alergenos || {}
  });
  openView();
  if (docData?.palabra) speak(docData.palabra);
});
