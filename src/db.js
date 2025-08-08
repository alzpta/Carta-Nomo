import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { MAX_NUMEROS } from './config.js';

export const subscribeNumeros = (db, callback) =>
  onSnapshot(collection(db, 'numeros'), (snap) => {
    const nuevo = {};
    snap.forEach((d) => {
      const n = parseInt(d.id, 10);
      if (!isNaN(n))
        nuevo[n] = {
          palabra: d.data().palabra || '',
          imagenUrl: d.data().imagenUrl || null,
          descripcion: d.data().descripcion || '',
        };
    });
    callback(nuevo);
  });

export async function guardarNumero(db, storage, n, palabra, descripcion, file) {
  const dref = doc(collection(db, 'numeros'), String(n));
  const snap = await getDoc(dref);
  const actual = snap.exists() ? snap.data() : {};

  let imagenUrl = actual.imagenUrl || null;
  if (file) {
    const ref = storageRef(storage, `imagenes/${n}`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      await uploadBytes(ref, bytes, { contentType: file.type || 'image/png' });
      imagenUrl = await getDownloadURL(ref);
    } catch (e) {
      throw e;
    }
  }

  let desc = actual.descripcion || '';
  if (descripcion !== undefined && descripcion !== null) desc = descripcion;

  try {
    await setDoc(
      dref,
      {
        palabra: palabra || '',
        descripcion: desc,
        imagenUrl,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (e) {
    throw e;
  }
}

export async function borrarNumero(db, storage, n) {
  try {
    await deleteObject(storageRef(storage, `imagenes/${n}`));
  } catch {}
  await deleteDoc(doc(collection(db, 'numeros'), String(n)));
}

export function exportarDatos(datos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'palabrasNumeros.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importarArchivo(db, file) {
  const obj = JSON.parse(await file.text());
  const ops = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const n = Number(k);
    if (!Number.isInteger(n) || n < 1 || n > MAX_NUMEROS) continue;
    ops.push(
      setDoc(doc(collection(db, 'numeros'), String(n)), {
        palabra: typeof v?.palabra === 'string' ? v.palabra : '',
        descripcion: typeof v?.descripcion === 'string' ? v.descripcion : '',
        imagenUrl: typeof v?.imagenUrl === 'string' ? v.imagenUrl : null,
        updatedAt: Date.now(),
      })
    );
  }
  await Promise.all(ops);
}
