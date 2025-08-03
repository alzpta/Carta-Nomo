    import { initializeApp } from "firebase/app";
    import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
    import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
    import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

(async () => {

    // Carga de configuración segura
    const configResp = await fetch(new URL('config.json', import.meta.url));
    if (!configResp.ok) {
        document.getElementById('output').textContent = 'No se pudo cargar config.json';
        return;
    }
    const firebaseConfig = await configResp.json();

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // UI refs
    const grid = document.getElementById("grid");
    const output = document.getElementById("output");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const editarBtn = document.getElementById("editarBtn");
    const borrarBtn = document.getElementById("borrarBtn");
    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");
    const userInfo = document.getElementById("userInfo");

    const editBackdrop = document.getElementById("editBackdrop");
    const numSel = document.getElementById("numSel");
    const palabraInput = document.getElementById("palabra");
    const imagenInput = document.getElementById("imagen");
    const guardarBtn = document.getElementById("guardarBtn");
    const cancelarBtn = document.getElementById("cancelarBtn");

    const loginBackdrop = document.getElementById("loginBackdrop");
    const loginEmail = document.getElementById("loginEmail");
    const loginPass = document.getElementById("loginPass");
    const loginSubmit = document.getElementById("loginSubmit");
    const loginCancel = document.getElementById("loginCancel");

    const sanitizePalabra = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const INVALID_PALABRA_CHARS = /[<>&"']/;

    // Estado
    let seleccionado = 1;
    let datos = {}; // {n: {palabra, imagenUrl}}

    const hablar = (t) => { try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='es-ES'; u.rate=1; u.pitch=1; speechSynthesis.speak(u);}catch{} };

    const tieneDatos = (n) => { const d = datos[n]; return !!(d && ((d.palabra && d.palabra.trim()) || d.imagenUrl)); };
    const refrescarCeldasVacias = () => { [...grid.children].forEach((el,ix)=>el.classList.toggle('empty', !tieneDatos(ix+1))); };
    const pintarSeleccion = () => { [...grid.children].forEach((el,ix)=>el.classList.toggle('selected', ix+1===seleccionado)); };
    const mostrar = (i, speak=true) => {
      const d = datos[i];
      output.textContent = '';

      const strong = document.createElement('strong');
      strong.textContent = `Número ${i}:`;
      output.appendChild(strong);

      const palabra = typeof d?.palabra === 'string' ? d.palabra.trim() : '';
      output.appendChild(document.createTextNode(' ' + (palabra || '(sin datos)')));

      if (d?.imagenUrl) {
        try {
          const url = new URL(d.imagenUrl, location.href);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            const div = document.createElement('div');
            const img = document.createElement('img');
            img.className = 'preview';
            img.src = url.href;
            img.alt = `Imagen ${i}`;
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';
            div.appendChild(img);
            output.appendChild(div);
          }
        } catch {}
      }

      if (speak && palabra) hablar(palabra);
    };

    const renderAuthUI = (user) => {
      const on = !!user;
      editarBtn.style.display = on ? '' : 'none';
      borrarBtn.style.display = on ? '' : 'none';
      exportBtn.style.display = on ? '' : 'none';
      importBtn.style.display = on ? '' : 'none';
      logoutBtn.style.display = on ? '' : 'none';
      loginBtn.style.display = on ? 'none' : '';
      userInfo.textContent = on ? `Sesión: ${user.email}` : 'Sesión: invitado';
    };
    onAuthStateChanged(auth, renderAuthUI);

    // Login modal
    const openLogin = () => { loginEmail.value=''; loginPass.value=''; loginBackdrop.style.display='flex'; loginBackdrop.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; loginEmail.focus(); };
    const closeLogin = () => { loginBackdrop.style.display='none'; loginBackdrop.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    loginBtn.onclick = openLogin; loginCancel.onclick = closeLogin;
    loginBackdrop.addEventListener('click', e => { if (e.target===loginBackdrop) closeLogin(); });
    loginSubmit.onclick = async () => { try{ await signInWithEmailAndPassword(auth, (loginEmail.value||'').trim(), loginPass.value||''); closeLogin(); }catch(e){ alert('No se pudo iniciar sesión: ' + (e?.message||e)); } };
    logoutBtn.onclick = () => signOut(auth);

    // Editar
    const openEdit = () => {
      if (!auth.currentUser) return alert('Debes iniciar sesión para editar.');
      const info = datos[seleccionado] || {}; numSel.value = seleccionado; palabraInput.value = info.palabra || ''; imagenInput.value = '';
      editBackdrop.style.display='flex'; editBackdrop.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; numSel.focus();
    };
    const closeEdit = () => { editBackdrop.style.display='none'; editBackdrop.setAttribute('aria-hidden','true'); document.body.style.overflow=''; imagenInput.value=''; };
    editarBtn.onclick = openEdit; cancelarBtn.onclick = closeEdit;
    editBackdrop.addEventListener('click', e => { if (e.target===editBackdrop) closeEdit(); });

    numSel.onchange = () => { let v = Math.max(1, Math.min(100, parseInt(numSel.value||'1',10))); numSel.value=v; seleccionado=v; pintarSeleccion(); const info=datos[v]||{}; palabraInput.value = info.palabra||''; imagenInput.value=''; };

    const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

    async function guardarNumero(n, palabra, file){
      if (!auth.currentUser) throw new Error('No autenticado');
      palabra = sanitizePalabra(palabra);
      let imagenUrl = datos[n]?.imagenUrl || null;
      if (file) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
          alert('Archivo no válido. Debe ser PNG/JPEG/GIF/WebP y menor de 2MB.');
          return false;
        }
        const ref = storageRef(storage, `imagenes/${n}`);
        const bytes = new Uint8Array(await file.arrayBuffer());
        await uploadBytes(ref, bytes, { contentType: file.type || 'image/png' });
        imagenUrl = await getDownloadURL(ref);
      }
      await setDoc(doc(collection(db, 'numeros'), String(n)), { palabra: palabra || '', imagenUrl: imagenUrl || null, updatedAt: Date.now() });
      return true;
    }

    guardarBtn.onclick = async () => {
      try{
        const n = Math.max(1, Math.min(100, parseInt(numSel.value||'1',10)));
        const palabraRaw=(palabraInput.value||'').trim();
        if (palabraRaw.length > MAX_PALABRA_LENGTH || INVALID_PALABRA_CHARS.test(palabraRaw)) {
          alert('Palabra no válida.');
          return;
        }
        const palabra = sanitizePalabra(palabraRaw);
        const file = imagenInput.files?.[0]||null;
        const ok = await guardarNumero(n, palabra, file);
        if (ok === false) return;
        seleccionado=n; pintarSeleccion(); closeEdit();
      }
      catch(e){ alert('Error al guardar: ' + (e?.message||e)); }
    };

    borrarBtn.onclick = async () => {
      if (!auth.currentUser) return alert('Debes iniciar sesión para borrar.');
      const n = seleccionado; if (!confirm(`¿Borrar el número ${n}?`)) return;
      try { try{ await deleteObject(storageRef(storage, `imagenes/${n}`)); }catch{} await deleteDoc(doc(collection(db,'numeros'), String(n))); }
      catch(e){ alert('No se pudo borrar: ' + (e?.message||e)); }
    };

    // Importar / Exportar
    const MAX_PALABRA_LENGTH = 50;
    const MAX_IMPORT_ENTRIES = 100;
    const MAX_IMPORT_FILE_SIZE = 1024 * 1024; // 1MB
    exportBtn.onclick = () => {
      if (!auth.currentUser) return alert('Inicia sesión.');
      const blob = new Blob([JSON.stringify(datos, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'palabrasNumeros.json'; a.click(); URL.revokeObjectURL(url);
    };
    importBtn.onclick = () => {
      if (!auth.currentUser) return alert('Inicia sesión.');
      const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
      inp.onchange = async () => {
        const f = inp.files?.[0];
        if(!f) return;
        if (f.size > MAX_IMPORT_FILE_SIZE) return alert('Archivo demasiado grande.');
        try{
          const obj = JSON.parse(await f.text());
          const entries = Object.entries(obj||{});
          if (entries.length > MAX_IMPORT_ENTRIES) return alert('Demasiadas entradas.');
          const ops=[]; const errors=[];
          for (const [k,v] of entries){
            const n = Number(k); if(!Number.isInteger(n)||n<1||n>100) continue;
            const palabraRaw = typeof v?.palabra==='string'?v.palabra.trim():'';
            if (palabraRaw.length>MAX_PALABRA_LENGTH || INVALID_PALABRA_CHARS.test(palabraRaw)) { errors.push(`Palabra inválida para ${n}`); continue; }
            const palabra = sanitizePalabra(palabraRaw);
            let imagenUrl = null;
            if (typeof v?.imagenUrl === 'string'){
              try{
                const url = new URL(v.imagenUrl);
                if (url.protocol==='http:'||url.protocol==='https:') imagenUrl = url.href; else { errors.push(`URL no permitida para ${n}`); continue; }
              }catch{ errors.push(`URL inválida para ${n}`); continue; }
            }
            ops.push(setDoc(doc(collection(db,'numeros'), String(n)), { palabra, imagenUrl, updatedAt: Date.now() }));
          }
          await Promise.all(ops);
          if (errors.length){ console.error('Errores de importación:', errors); alert('Importación completada con errores. Revisa la consola.'); }
          else alert('Importación completada.');
        }catch(e){ alert('JSON no válido: ' + (e?.message||e)); }
      };
      document.body.appendChild(inp); inp.click(); inp.remove();
    };

    // Snapshot realtime
    onSnapshot(collection(db,'numeros'), (snap) => {
      const nuevo = {}; snap.forEach(d => { const n = parseInt(d.id,10); if(!isNaN(n)) nuevo[n] = { palabra: d.data().palabra || '', imagenUrl: d.data().imagenUrl || null }; });
      datos = nuevo; refrescarCeldasVacias(); mostrar(seleccionado, false);
    });

    // Crear grid
    for (let i=1;i<=100;i++){
      const cell = document.createElement('button');
      cell.className='cell'; cell.type='button'; cell.textContent = i;
      cell.setAttribute('role','gridcell'); cell.setAttribute('aria-label', `Número ${i}`);
      cell.onclick = () => { seleccionado=i; pintarSeleccion(); mostrar(i); };
      cell.onkeydown = (e) => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); seleccionado=i; pintarSeleccion(); mostrar(i);} };
      grid.appendChild(cell);
    }
    pintarSeleccion(); mostrar(seleccionado, false);

    // Navegación con teclado (sin interferir inputs/modales)
    const isTextInput = (el) => { if(!el) return false; const t = el.tagName?.toLowerCase(); return el.isContentEditable || t==='input'||t==='textarea'||t==='select'; };
    window.addEventListener('keydown', (e) => {
      const anySheetOpen = editBackdrop.getAttribute('aria-hidden')==='false' || loginBackdrop.getAttribute('aria-hidden')==='false';
      if (anySheetOpen || isTextInput(document.activeElement)) return;
      const max=100; let handled=false;
      if (e.key==='ArrowRight'){ seleccionado=Math.min(max, seleccionado+1); handled=true; }
      if (e.key==='ArrowLeft'){ seleccionado=Math.max(1, seleccionado-1); handled=true; }
      if (e.key==='Enter'){ mostrar(seleccionado); handled=true; }
      if (!handled) return; e.preventDefault(); pintarSeleccion(); const node=grid.children[seleccionado-1]; if (node) node.focus({preventScroll:true});
    });

    // Service Worker
    if ('serviceWorker' in navigator){
      window.addEventListener('load', () => navigator.serviceWorker.register('/Carta-Nomo/service-worker.js'));
    }

    })();
