import { initAuth } from './auth.js';
import { guardarNumero, borrarNumero, exportarDatos, importarArchivo, subscribeNumeros } from './db.js';
import { MAX_NUMEROS } from './config.js';

export function initUI({ auth, db, storage, BASE_PATH, openView }) {
  const grid = document.getElementById('grid');
  const output = document.getElementById('output');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const editarBtn = document.getElementById('editarBtn');
  const borrarBtn = document.getElementById('borrarBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const userInfo = document.getElementById('userInfo');

  const editBackdrop = document.getElementById('editBackdrop');
  const numSel = document.getElementById('numSel');
  const palabraInput = document.getElementById('palabra');
  const descripcionInput = document.getElementById('descripcion');
  const imagenInput = document.getElementById('imagen');
  const guardarBtn = document.getElementById('guardarBtn');
  const cancelarBtn = document.getElementById('cancelarBtn');

  const loginBackdrop = document.getElementById('loginBackdrop');
  const loginEmail = document.getElementById('loginEmail');
  const loginPass = document.getElementById('loginPass');
  const loginSubmit = document.getElementById('loginSubmit');
  const loginCancel = document.getElementById('loginCancel');

  initAuth(auth, {
    loginBtn,
    logoutBtn,
    editarBtn,
    borrarBtn,
    exportBtn,
    importBtn,
    userInfo,
    loginBackdrop,
    loginEmail,
    loginPass,
    loginSubmit,
    loginCancel
  });

  let seleccionado = 1;
  let datos = {};

  const hablar = (t) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'es-ES';
      u.rate = 1;
      u.pitch = 1;
      speechSynthesis.speak(u);
    } catch {}
  };

  const tieneDatos = (n) => {
    const d = datos[n];
    return !!(
      d &&
      ((d.palabra && d.palabra.trim()) || d.imagenUrl || (d.descripcion && d.descripcion.trim()))
    );
  };
  const refrescarCeldasVacias = () => {
    [...grid.children].forEach((el, ix) =>
      el.classList.toggle('empty', !tieneDatos(ix + 1))
    );
  };
  const pintarSeleccion = () => {
    [...grid.children].forEach((el, ix) =>
      el.classList.toggle('selected', ix + 1 === seleccionado)
    );
  };
  const mostrar = (i, speak = true) => {
    const d = datos[i];
    output.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = `Número ${i}:`;
    output.append(strong, ' ', d?.palabra ?? '(sin datos)');
    if (d?.imagenUrl) {
      const imgWrapper = document.createElement('div');
      const img = document.createElement('img');
      img.className = 'preview';
      img.src = d.imagenUrl;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.alt = d?.palabra
        ? `Imagen de ${d.palabra}`
        : `Imagen del número ${i}`;
      imgWrapper.appendChild(img);
      output.appendChild(imgWrapper);
    }
    if (speak && d?.palabra) hablar(d.palabra);
  };

  const openEdit = () => {
    if (!auth.currentUser) return alert('Debes iniciar sesión para editar.');
    const info = datos[seleccionado] || {};
    numSel.value = seleccionado;
    palabraInput.value = info.palabra || '';
    descripcionInput.value = info.descripcion || '';
    imagenInput.value = '';
    editBackdrop.style.display = 'flex';
    editBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    numSel.focus();
  };
  const closeEdit = () => {
    editBackdrop.style.display = 'none';
    editBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    imagenInput.value = '';
    descripcionInput.value = '';
  };
  editarBtn.onclick = openEdit;
  cancelarBtn.onclick = closeEdit;
  editBackdrop.addEventListener('click', (e) => {
    if (e.target === editBackdrop) closeEdit();
  });

  numSel.onchange = () => {
    let v = Math.max(
      1,
      Math.min(MAX_NUMEROS, parseInt(numSel.value || '1', 10))
    );
    numSel.value = v;
    seleccionado = v;
    pintarSeleccion();
    const info = datos[v] || {};
    palabraInput.value = info.palabra || '';
    descripcionInput.value = info.descripcion || '';
    imagenInput.value = '';
  };

  guardarBtn.onclick = async () => {
    try {
      const n = Math.max(
        1,
        Math.min(MAX_NUMEROS, parseInt(numSel.value || '1', 10))
      );
      const palabra = (palabraInput.value || '').trim();
      const descripcion = (descripcionInput.value || '').trim();
      const file = imagenInput.files?.[0] || null;
      await guardarNumero(db, storage, n, palabra, descripcion, file);
      seleccionado = n;
      pintarSeleccion();
      closeEdit();
    } catch (e) {
      alert('Error al guardar: ' + (e?.message || e));
    }
  };

  borrarBtn.onclick = async () => {
    if (!auth.currentUser)
      return alert('Debes iniciar sesión para borrar.');
    const n = seleccionado;
    if (!confirm(`¿Borrar el número ${n}?`)) return;
    try {
      await borrarNumero(db, storage, n);
    } catch (e) {
      alert('No se pudo borrar: ' + (e?.message || e));
    }
  };

  exportBtn.onclick = () => {
    if (!auth.currentUser) return alert('Inicia sesión.');
    exportarDatos(datos);
  };
  importBtn.onclick = () => {
    if (!auth.currentUser) return alert('Inicia sesión.');
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        await importarArchivo(db, f);
        alert('Importación completada.');
      } catch (e) {
        alert('JSON no válido: ' + (e?.message || e));
      }
    };
    document.body.appendChild(inp);
    inp.click();
    inp.remove();
  };

  subscribeNumeros(db, (nuevo) => {
    datos = nuevo;
    refrescarCeldasVacias();
    mostrar(seleccionado, false);
  });

  for (let i = 1; i <= MAX_NUMEROS; i++) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.textContent = i;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Número ${i}`);
    cell.onclick = () => {
      seleccionado = i;
      pintarSeleccion();
      mostrar(i);
      openView({
        num: i,
        palabra: datos[i]?.palabra,
        imageUrl: datos[i]?.imagenUrl,
        descripcion: datos[i]?.descripcion,
      });
    };
    cell.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        seleccionado = i;
        pintarSeleccion();
        mostrar(i);
        openView({
          num: i,
          palabra: datos[i]?.palabra,
          imageUrl: datos[i]?.imagenUrl,
          descripcion: datos[i]?.descripcion,
        });
      }
    };
    grid.appendChild(cell);
  }
  pintarSeleccion();
  mostrar(seleccionado, false);

  const isTextInput = (el) => {
    if (!el) return false;
    const t = el.tagName?.toLowerCase();
    return (
      el.isContentEditable ||
      t === 'input' ||
      t === 'textarea' ||
      t === 'select'
    );
  };
  window.addEventListener('keydown', (e) => {
    const anySheetOpen =
      editBackdrop.getAttribute('aria-hidden') === 'false' ||
      loginBackdrop.getAttribute('aria-hidden') === 'false';
    if (anySheetOpen || isTextInput(document.activeElement)) return;
    const max = MAX_NUMEROS;
    let handled = false;
    if (e.key === 'ArrowRight') {
      seleccionado = Math.min(max, seleccionado + 1);
      handled = true;
    }
    if (e.key === 'ArrowLeft') {
      seleccionado = Math.max(1, seleccionado - 1);
      handled = true;
    }
    if (e.key === 'Enter') {
      mostrar(seleccionado);
      openView({
        num: seleccionado,
        palabra: datos[seleccionado]?.palabra,
        imageUrl: datos[seleccionado]?.imagenUrl,
        descripcion: datos[seleccionado]?.descripcion,
      });
      handled = true;
    }
    if (!handled) return;
    e.preventDefault();
    pintarSeleccion();
    const node = grid.children[seleccionado - 1];
    if (node) node.focus({ preventScroll: true });
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () =>
      navigator.serviceWorker.register(`${BASE_PATH}/service-worker.js`, {
        type: 'module',
      })
    );
  }
}
