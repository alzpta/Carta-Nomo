import { BASE_PATH } from "./src/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initUI } from "./src/ui.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Tu UI existente
initUI({ auth, db, storage, BASE_PATH });

// ————————————————————————————————————————————————
// Referencias UI
// ————————————————————————————————————————————————
const grid = document.getElementById('grid');

// Popup de Vista (detalle)
const viewBackdrop = document.getElementById('viewBackdrop');
const viewTitle = document.getElementById('viewTitle');
const viewImage = document.getElementById('viewImage');
const viewDesc  = document.getElementById('viewDesc');
const viewCloseBtn = document.getElementById('viewCloseBtn');
const viewAdminActions = document.getElementById('viewAdminActions');
const viewEditBtn = document.getElementById('viewEditBtn');
const viewDeleteBtn = document.getElementById('viewDeleteBtn');

// Modal edición
const guardarBtn = document.getElementById('guardarBtn');
const editBackdrop = document.getElementById('editBackdrop');
const numSelInput = document.getElementById('numSel');
const palabraInput = document.getElementById('palabra');
const descInput = document.getElementById('descripcion');
const imagenInput = document.getElementById('imagen');

// Botones toolbar (export/import)
const exportBtn = document.getElementById('exportBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importBtn = document.getElementById('importBtn');

let currentNumberSelected = null;
let isAdmin = false;

onAuthStateChanged(auth, (user) => {
  isAdmin = !!user;
  // Zona admin en el popup
  if (viewAdminActions) viewAdminActions.style.display = isAdmin ? 'flex' : 'none';
  // Botones admin
  if (exportBtn) exportBtn.style.display = isAdmin ? '' : 'none';
  if (exportCsvBtn) exportCsvBtn.style.display = isAdmin ? '' : 'none';
  if (importBtn) importBtn.style.display = isAdmin ? '' : 'none';
});

// ————————————————————————————————————————————————
// Utilidades Firestore
// ————————————————————————————————————————————————
async function fetchNumberDoc(n) {
  const ref = doc(db, 'numeros', String(n));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: ref.id, ...snap.data() };
}

async function upsertNumberDoc(n, { palabra, descripcion, imageURL }) {
  await setDoc(doc(db, 'numeros', String(n)), { palabra, descripcion, imageURL }, { merge: true });
}

// ————————————————————————————————————————————————
// Popup de vista
// ————————————————————————————————————————————————
function openView() {
  viewBackdrop.classList.add('is-open');
  viewBackdrop.removeAttribute('aria-hidden');
  viewCloseBtn?.focus();
}
function closeView() {
  viewBackdrop.classList.remove('is-open');
  viewBackdrop.setAttribute('aria-hidden', 'true');
  currentNumberSelected = null;
}
viewBackdrop?.addEventListener('click', (e) => { if (e.target === viewBackdrop) closeView(); });
viewCloseBtn?.addEventListener('click', closeView);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeView(); });

function renderView({ n, palabra, descripcion, imageURL }) {
  currentNumberSelected = n;
  viewTitle.textContent = `${n}. ${palabra || '—'}`;
  viewDesc.textContent = descripcion || '—';

  if (imageURL) {
    viewImage.src = imageURL;
    viewImage.alt = palabra ? `Imagen de ${palabra}` : `Imagen del número ${n}`;
    viewImage.style.display = '';
  } else {
    viewImage.removeAttribute('src');
    viewImage.alt = '';
    viewImage.style.display = 'none';
  }
  openView();
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
});

// Editar desde popup -> abre sheet con datos actuales
viewEditBtn?.addEventListener('click', () => {
  if (!isAdmin || !currentNumberSelected) return;
  numSelInput.value = currentNumberSelected;
  // Extrae palabra del título "N. palabra"
  palabraInput.value = viewTitle.textContent.split('. ').slice(1).join('. ') || '';
  descInput.value = viewDesc.textContent || '';
  editBackdrop.classList.add('is-open');
  editBackdrop.removeAttribute('aria-hidden');
});

// Borrar desde popup
viewDeleteBtn?.addEventListener('click', async () => {
  if (!isAdmin || !currentNumberSelected) return;
  const n = currentNumberSelected;
  if (!confirm(`¿Borrar el número ${n}? Esta acción no se puede deshacer.`)) return;
  await deleteDoc(doc(db, 'numeros', String(n)));
  closeView();
  const cell = grid.querySelector(`.cell[data-n="${n}"]`);
  if (cell) cell.classList.add('empty');
});

// ————————————————————————————————————————————————
// Guardar (incluye descripcion y subida de imagen)
// ————————————————————————————————————————————————
guardarBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) return alert('No tienes permisos para guardar');

    const n = numSelInput.value.trim();
    const palabra = palabraInput.value.trim();
    const descripcion = descInput.value.trim();
    const imagenFile = imagenInput.files[0];

    if (!n) return alert('Número requerido');
    if (!palabra) return alert('Palabra requerida');

    let imageURL = '';
    if (imagenFile) {
      const imgRef = ref(storage, `numeros/${n}/${imagenFile.name}`);
      await uploadBytes(imgRef, imagenFile);
      imageURL = await getDownloadURL(imgRef);
    } else {
      // conservar la existente
      const existing = await fetchNumberDoc(n);
      if (existing?.imageURL) imageURL = existing.imageURL;
    }

    await upsertNumberDoc(n, { palabra, descripcion, imageURL });

    alert('Guardado con éxito');
    editBackdrop.classList.remove('is-open');
    editBackdrop.setAttribute('aria-hidden', 'true');

    // Si el popup mostraba este número, refrescar su contenido
    if (currentNumberSelected === Number(n) && viewBackdrop.classList.contains('is-open')) {
      renderView({ n: Number(n), palabra, descripcion, imageURL });
    }
  } catch (err) {
    console.error(err);
    alert('Error al guardar. Revisa la consola.');
  }
});

// ————————————————————————————————————————————————
// EXPORTAR JSON
// ————————————————————————————————————————————————
exportBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) return alert('Solo disponible para administradores.');
    const q = query(collection(db, 'numeros'), orderBy('__name__')); // ids "1".."100"
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(d => {
      const data = d.data() || {};
      items.push({
        id: d.id,
        palabra: data.palabra || '',
        descripcion: data.descripcion || '',
        imageURL: data.imageURL || ''
      });
    });

    const payload = { updatedAt: new Date().toISOString(), items };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

    const pad2 = (x) => String(x).padStart(2,'0');
    const now = new Date();
    const fname = `carta-nomo-export-${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}.json`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    alert('Error al exportar. Revisa la consola.');
  }
});

// ————————————————————————————————————————————————
// EXPORTAR CSV (id;palabra;descripcion;imageURL) con BOM para Excel
// ————————————————————————————————————————————————
exportCsvBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) return alert('Solo disponible para administradores.');

    const q = query(collection(db, 'numeros'), orderBy('__name__'));
    const snap = await getDocs(q);

    const sep = ';';
    const esc = (v) => {
      const s = (v ?? '').toString();
      if (/[;\n\r"]/u.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = [['id','palabra','descripcion','imageURL']];
    snap.forEach(d => {
      const data = d.data() || {};
      rows.push([
        d.id,
        data.palabra || '',
        data.descripcion || '',
        data.imageURL || ''
      ]);
    });

    const csv = rows.map(r => r.map(esc).join(sep)).join('\r\n');
    const blob = new Blob(
      [new Uint8Array([0xEF,0xBB,0xBF]), csv], // BOM UTF-8
      { type: 'text/csv;charset=utf-8' }
    );

    const pad2 = (x) => String(x).padStart(2,'0');
    const now = new Date();
    const fname = `carta-nomo-export-${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}.csv`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    alert('Error al exportar CSV. Revisa la consola.');
  }
});

// ————————————————————————————————————————————————
// IMPORTAR JSON
// ————————————————————————————————————————————————
(function setupImport() {
  if (!importBtn) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  importBtn.addEventListener('click', () => {
    if (!isAdmin) return alert('Solo disponible para administradores.');
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || !Array.isArray(data.items)) {
        return alert('Formato inválido. Debe contener { items: [...] }');
      }

      let ok = 0, fail = 0;
      for (const item of data.items) {
        try {
          const id = String(item.id || '').trim();
          if (!id) { fail++; continue; }

          const payload = {
            palabra: item.palabra ?? '',
            descripcion: item.descripcion ?? '',
            imageURL: item.imageURL ?? ''
          };
          await setDoc(doc(db, 'numeros', id), payload, { merge: true });
          ok++;
        } catch (e) {
          console.error('Error importando item', item, e);
          fail++;
        }
      }

      alert(`Importación completada.\nCorrectos: ${ok}\nFallidos: ${fail}`);

      if (currentNumberSelected) {
        const refreshed = await fetchNumberDoc(currentNumberSelected);
        if (refreshed) {
          renderView({
            n: Number(refreshed.id),
            palabra: refreshed.palabra || '',
            descripcion: refreshed.descripcion || '',
            imageURL: refreshed.imageURL || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al importar. Asegúrate de seleccionar un JSON válido.');
    }
  });
})();

