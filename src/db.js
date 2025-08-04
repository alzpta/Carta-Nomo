import { collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

export const subscribeNumeros = (db, callback) =>
  onSnapshot(collection(db, 'numeros'), (snap) => {
    const nuevo = {};
    snap.forEach((d) => {
      const n = parseInt(d.id, 10);
      if (!isNaN(n))
        nuevo[n] = {
          palabra: d.data().palabra || '',
          imagenUrl: d.data().imagenUrl || null,
        };
    });
    callback(nuevo);
  });

export async function guardarNumero(db, storage, n, palabra, file) {
  let imagenUrl = null;
  if (file) {
    const ref = storageRef(storage, `imagenes/${n}`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadBytes(ref, bytes, { contentType: file.type || 'image/png' });
    imagenUrl = await getDownloadURL(ref);
  } else {
    imagenUrl = null;
  }
  await setDoc(doc(collection(db, 'numeros'), String(n)), {
    palabra: palabra || '',
    imagenUrl: imagenUrl || null,
    updatedAt: Date.now(),
  });
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
    if (!Number.isInteger(n) || n < 1 || n > 100) continue;
    ops.push(
      setDoc(doc(collection(db, 'numeros'), String(n)), {
        palabra: typeof v?.palabra === 'string' ? v.palabra : '',
        imagenUrl: typeof v?.imagenUrl === 'string' ? v.imagenUrl : null,
        updatedAt: Date.now(),
      })
    );
  }
  await Promise.all(ops);
}
