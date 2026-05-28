import { auth, db, storage, fetchNumberDoc } from '../app.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import {
  renderView,
  openView,
  closeView,
  getCurrentNumber,
  isViewOpen,
  getCurrentData
} from './viewPopup.js';
import { showToast, showConfirm } from './notifications.js';

const grid = document.getElementById('grid');
const userInfo = document.getElementById('userInfo');
const viewAdminActions = document.getElementById('viewAdminActions');
const viewEditBtn = document.getElementById('viewEditBtn');
const viewDeleteBtn = document.getElementById('viewDeleteBtn');

const guardarBtn = document.getElementById('guardarBtn');
const editBackdrop = document.getElementById('editBackdrop');
const numSelInput = document.getElementById('numSel');
const palabraInput = document.getElementById('palabra');
const descInput = document.getElementById('descripcion');
const ingredientesInput = document.getElementById('ingredientes');
const imagenInput = document.getElementById('imagen');
const cancelarBtn = document.getElementById('cancelarBtn');

const exportBtn = document.getElementById('exportBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importBtn = document.getElementById('importBtn');
const importCsvBtn = document.getElementById('importCsvBtn');
const importProgress = document.getElementById('importProgress');
const importProgressBar = document.getElementById('importProgressBar');
const importProgressText = document.getElementById('importProgressText');
const importSummary = document.getElementById('importSummary');
let isAdmin = false;

onAuthStateChanged(auth, (user) => {
  isAdmin = !!user;
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  if (userInfo) userInfo.textContent = `Sesión: ${user.email}`;
  viewAdminActions?.classList.toggle('hidden', !isAdmin);
  exportBtn?.classList.toggle('hidden', !isAdmin);
  exportCsvBtn?.classList.toggle('hidden', !isAdmin);
  importBtn?.classList.toggle('hidden', !isAdmin);
  importCsvBtn?.classList.toggle('hidden', !isAdmin);
});


async function upsertNumberDoc(n, { palabra, descripcion, imageURL, ingredientes }) {
  await setDoc(doc(db, 'numeros', String(n)), { palabra, descripcion, imageURL, ingredientes }, { merge: true });
}

// Editar desde popup -> abre sheet con datos actuales
viewEditBtn?.addEventListener('click', () => {
  const current = getCurrentNumber();
  if (!isAdmin || !current) return;
  const { palabra, descripcion, ingredientes } = getCurrentData();
  numSelInput.value = current;
  palabraInput.value = palabra || '';
  descInput.value = descripcion || '';
  if (ingredientesInput) ingredientesInput.value = (ingredientes || []).join('\n');
  editBackdrop.classList.add('is-open');
  editBackdrop.removeAttribute('aria-hidden');
});

const closeEdit = () => {
  editBackdrop.classList.remove('is-open');
  editBackdrop.setAttribute('aria-hidden', 'true');
};

cancelarBtn?.addEventListener('click', closeEdit);
editBackdrop?.addEventListener('click', (e) => {
  if (e.target === editBackdrop) closeEdit();
});

// Borrar desde popup
viewDeleteBtn?.addEventListener('click', async () => {
  const n = getCurrentNumber();
  if (!isAdmin || !n) return;
  const ok = await showConfirm(
    `¿Borrar el número ${n}? Esta acción no se puede deshacer.`,
    { okText: 'Borrar', okClass: 'danger' }
  );
  if (!ok) return;
  await deleteDoc(doc(db, 'numeros', String(n)));
  closeView();
  const cell = grid.querySelector(`.cell[data-n="${n}"]`);
  if (cell) cell.classList.add('empty');
});

// Guardar (incluye descripcion y subida de imagen)
guardarBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) {
      showToast('No tienes permisos para guardar', 'error');
      return;
    }

    const n = numSelInput.value.trim();
    const nNum = Number(n);
    const palabra = palabraInput.value.trim();
    const descripcion = descInput.value.trim();
    const ingredientes = (ingredientesInput?.value || '')
      .split('\n').map(s => s.trim()).filter(Boolean);
    const imagenFile = imagenInput.files[0];

    if (!n || isNaN(nNum) || nNum < 1 || nNum > 100 || !Number.isInteger(nNum)) {
      showToast('Número debe estar entre 1 y 100', 'error');
      return;
    }
    if (!palabra) {
      showToast('Palabra requerida', 'error');
      return;
    }

    let imageURL = '';
    if (imagenFile) {
      const imgRef = ref(storage, `numeros/${n}/${imagenFile.name}`);
      await uploadBytes(imgRef, imagenFile);
      imageURL = await getDownloadURL(imgRef);
    } else {
      const existing = await fetchNumberDoc(n);
      if (existing?.imageURL) imageURL = existing.imageURL;
    }

    const currentData = getCurrentData();
    await upsertNumberDoc(n, { palabra, descripcion, imageURL, ingredientes });

    showToast('Guardado con éxito', 'success');
    editBackdrop.classList.remove('is-open');
    editBackdrop.setAttribute('aria-hidden', 'true');

    if (isViewOpen() && getCurrentNumber() === Number(n)) {
      renderView({ n: Number(n), palabra, descripcion, imageURL, alergenos: currentData.alergenos || {}, ingredientes });
      openView();
    }
  } catch (err) {
    console.error(err);
    showToast('Error al guardar. Revisa la consola.', 'error');
  }
});

// EXPORTAR JSON
exportBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) {
      showToast('Solo disponible para administradores.', 'error');
      return;
    }
    const q = query(collection(db, 'numeros'), orderBy('__name__')); // ids "1".."100"
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(d => {
      const data = d.data() || {};
      items.push({
        id: d.id,
        palabra: data.palabra || '',
        descripcion: data.descripcion || '',
        imageURL: data.imageURL || '',
        alergenos: data.alergenos || {},
        ingredientes: data.ingredientes || []
      });
    });

    const payload = { updatedAt: new Date().toISOString(), items };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

    const pad2 = (x) => String(x).padStart(2,'0');
    const now = new Date();
    const fname = `carta-nomo-export-${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}-${pad2(now.getHours())}`+
`${pad2(now.getMinutes())}.json`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    showToast('Error al exportar. Revisa la consola.', 'error');
  }
});

// EXPORTAR CSV
exportCsvBtn?.addEventListener('click', async () => {
  try {
    if (!isAdmin) {
      showToast('Solo disponible para administradores.', 'error');
      return;
    }

    const q = query(collection(db, 'numeros'), orderBy('__name__'));
    const snap = await getDocs(q);

    const sep = ';';
    const esc = (v) => {
      const s = (v ?? '').toString();
      if (/[;\n\r"]/u.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = [['id','palabra','descripcion','imageURL','alergenos','ingredientes']];
    snap.forEach(d => {
      const data = d.data() || {};
      rows.push([
        d.id,
        data.palabra || '',
        data.descripcion || '',
        data.imageURL || '',
        JSON.stringify(data.alergenos || {}),
        (data.ingredientes || []).join('|')
      ]);
    });

    const csv = rows.map(r => r.map(esc).join(sep)).join('\r\n');
    const blob = new Blob(
      [new Uint8Array([0xEF,0xBB,0xBF]), csv],
      { type: 'text/csv;charset=utf-8' }
    );

    const pad2 = (x) => String(x).padStart(2,'0');
    const now = new Date();
    const fname = `carta-nomo-export-${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}-${pad2(now.getHours())}`+
`${pad2(now.getMinutes())}.csv`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    showToast('Error al exportar CSV. Revisa la consola.', 'error');
  }
});

// IMPORTAR JSON
(function setupImport() {
  if (!importBtn) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.classList.add('hidden');
  document.body.appendChild(fileInput);

  importBtn.addEventListener('click', () => {
    if (!isAdmin) {
      showToast('Solo disponible para administradores.', 'error');
      return;
    }
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
        showToast('Formato inválido. Debe contener { items: [...] }', 'error');
        return;
      }

      importSummary.textContent = '';
      if (importProgress) {
        importProgress.classList.remove('hidden');
        importProgressBar.value = 0;
        importProgressBar.max = data.items.length || 1;
        importProgressText.textContent = '0%';
      }

      let ok = 0, fail = 0;
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        try {
          const id = String(item.id || '').trim();
          if (!id) { fail++; continue; }

          const payload = {
            palabra: item.palabra ?? '',
            descripcion: item.descripcion ?? '',
            imageURL: item.imageURL ?? '',
            alergenos: item.alergenos ?? {},
            ingredientes: item.ingredientes ?? []
          };
          await setDoc(doc(db, 'numeros', id), payload, { merge: true });
          ok++;
        } catch (e) {
          console.error('Error importando item', item, e);
          fail++;
        }
        if (importProgress) {
          importProgressBar.value = i + 1;
          const pct = Math.round(((i + 1) / data.items.length) * 100);
          importProgressText.textContent = `${pct}%`;
        }
      }

      if (importProgress) importProgress.classList.add('hidden');
      importSummary.textContent = `Importación completada. Correctos: ${ok} Fallidos: ${fail}`;
      showToast(`Importación completada.\nCorrectos: ${ok}\nFallidos: ${fail}`, 'success');

      if (getCurrentNumber()) {
        const refreshed = await fetchNumberDoc(getCurrentNumber());
        if (refreshed) {
          renderView({
            n: Number(refreshed.id),
            palabra: refreshed.palabra || '',
            descripcion: refreshed.descripcion || '',
            imageURL: refreshed.imageURL || '',
            alergenos: refreshed.alergenos || {},
            ingredientes: refreshed.ingredientes || []
          });
          openView();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al importar. Asegúrate de seleccionar un JSON válido.', 'error');
    } finally {
      if (importProgress) importProgress.classList.add('hidden');
    }
  });
})();

function parseCsvLine(line, sep = ';') {
  const fields = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let field = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') { field += '"'; i += 2; }
          else { i++; break; }
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === sep) i++;
    } else {
      const end = line.indexOf(sep, i);
      if (end === -1) { fields.push(line.slice(i)); break; }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

// IMPORTAR CSV
(function setupImportCsv() {
  if (!importCsvBtn) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv,text/csv';
  fileInput.classList.add('hidden');
  document.body.appendChild(fileInput);

  importCsvBtn.addEventListener('click', () => {
    if (!isAdmin) {
      showToast('Solo disponible para administradores.', 'error');
      return;
    }
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/u).filter(l => l.trim().length);
      const rows = lines
        .map(l => parseCsvLine(l))
        .filter(r => r[0] && r[0].trim() && r[0].trim().toLowerCase() !== 'id');

      importSummary.textContent = '';
      if (importProgress) {
        importProgress.classList.remove('hidden');
        importProgressBar.value = 0;
        importProgressBar.max = rows.length || 1;
        importProgressText.textContent = '0%';
      }

      let ok = 0, fail = 0;
      for (let i = 0; i < rows.length; i++) {
        const [idRaw, palabra = '', descripcion = '', imageURL = '', alergenosRaw = '', ingredientesRaw = ''] = rows[i];
        const id = String(idRaw).trim();
        if (!id) { fail++; continue; }
        try {
          let alergenos = {};
          try { alergenos = alergenosRaw ? JSON.parse(alergenosRaw) : {}; } catch {}
          const ingredientes = ingredientesRaw ? ingredientesRaw.split('|').map(s => s.trim()).filter(Boolean) : [];
          const payload = { palabra, descripcion, imageURL, alergenos, ingredientes };
          await setDoc(doc(db, 'numeros', id), payload, { merge: true });
          ok++;
        } catch (e) {
          console.error('Error importando fila', rows[i], e);
          fail++;
        }
        if (importProgress) {
          importProgressBar.value = i + 1;
          const pct = Math.round(((i + 1) / rows.length) * 100);
          importProgressText.textContent = `${pct}%`;
        }
      }

      if (importProgress) importProgress.classList.add('hidden');
      importSummary.textContent = `Importación completada. Correctos: ${ok} Fallidos: ${fail}`;
      showToast(`Importación completada.\nCorrectos: ${ok}\nFallidos: ${fail}`, 'success');

      if (getCurrentNumber()) {
        const refreshed = await fetchNumberDoc(getCurrentNumber());
        if (refreshed) {
          renderView({
            n: Number(refreshed.id),
            palabra: refreshed.palabra || '',
            descripcion: refreshed.descripcion || '',
            imageURL: refreshed.imageURL || '',
            alergenos: refreshed.alergenos || {},
            ingredientes: refreshed.ingredientes || []
          });
          openView();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al importar CSV. Asegúrate de seleccionar un CSV válido.', 'error');
    } finally {
      if (importProgress) importProgress.classList.add('hidden');
    }
  });
})();
