// src/db.js
import {
  collection, doc, getDoc, setDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp, getDocs, query
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  ref as sRef, uploadBytes, getDownloadURL, listAll, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

/** Util para derivar el path interno desde un downloadURL */
function pathFromDownloadUrl(url) {
  try {
    // formato: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/items%2F12-...ext?alt=media&token=...
    const u = new URL(url);
    const encodedPath = u.pathname.split('/o/')[1]; // items%2F12-....
    if (!encodedPath) return null;
    return decodeURIComponent(encodedPath.split('?')[0]);
  } catch {
    return null;
  }
}

/** Sube la imagen (si hay) y devuelve { imagenUrl, pathSubido } */
async function subirImagen(storage, numero, file) {
  if (!file) return { imagenUrl: null, pathSubido: null };

  const ext =
    file.type === "image/png"  ? "png"  :
    file.type === "image/webp" ? "webp" : "jpg";

  const path = `items/${numero}-${Date.now()}.${ext}`;
  const r = sRef(storage, path);
  await uploadBytes(r, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000, immutable"
  });
  const imagenUrl = await getDownloadURL(r);
  return { imagenUrl, pathSubido: path };
}

/** Borra todas las imágenes previas con prefijo del número (items/{n}-*) */
async function borrarImagenesDeNumero(storage, numero) {
  const baseRef = sRef(storage, 'items');
  const { items } = await listAll(baseRef);
  const prefix = `items/${numero}-`;
  const toDelete = items.filter(it => it.fullPath.startsWith(prefix));
  await Promise.allSettled(toDelete.map(it => deleteObject(it)));
}

/** Guarda un número en Firestore y, si hay file, en Storage */
export async function guardarNumero(db, storage, numero, palabra, descripcion, file) {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new Error('Número inválido');
  }

  // Subir imagen (si hay). Las reglas de Storage controlan si el usuario puede subir.
  let imagenUrl = null;
  if (file) {
    // opcional: borra imágenes previas de ese número para no acumular basura
    await borrarImagenesDeNumero(storage, numero);
    const res = await subirImagen(storage, numero, file);
    imagenUrl = res.imagenUrl;
  }

  const payload = {
    numero,
    updatedAt: serverTimestamp(),
  };
  if (palabra)     payload.palabra = palabra;
  if (descripcion) payload.descripcion = descripcion;
  if (imagenUrl)   payload.imagenUrl = imagenUrl;

  await setDoc(doc(db, "items", String(numero)), payload, { merge: true });
}

/** Elimina los datos del número y sus imágenes en Storage */
export async function borrarNumero(db, storage, numero) {
  // Firestore
  await deleteDoc(doc(db, "items", String(numero)));
  // Storage
  try {
    await borrarImagenesDeNumero(storage, numero);
  } catch (e) {
    // no crítico si no existían
    console.warn('No se pudieron borrar imágenes previas:', e?.message || e);
  }
}

/** Suscripción en tiempo real. Devuelve unmap { [n]: {palabra, descripcion, imagenUrl, ...} } */
export function subscribeNumeros(db, callback) {
  const col = collection(db, "items");
  const q = query(col);
  return onSnapshot(q, (snap) => {
    const out = {};
    snap.forEach(docu => {
      const d = docu.data() || {};
      const n = parseInt(docu.id, 10) || d.numero;
      if (!n) return;
      out[n] = {
        palabra: d.palabra || '',
        descripcion: d.descripcion || '',
        imagenUrl: d.imagenUrl || '',
        numero: n,
        updatedAt: d.updatedAt || null,
        updatedBy: d.updatedBy || null
      };
    });
    callback(out);
  }, (err) => {
    console.error('subscribeNumeros error:', err);
  });
}

/** Exporta a JSON y fuerza descarga */
export function exportarDatos(datosObj) {
  const ordered = Object.keys(datosObj)
    .map(k => parseInt(k, 10))
    .sort((a,b) => a - b)
    .map(n => ({ numero: n, ...datosObj[n] }));

  const blob = new Blob([JSON.stringify(ordered, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'carta-nomo-export.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Importa un JSON con [{numero, palabra, descripcion, imagenUrl?}] (no sube imágenes) */
export async function importarArchivo(db, file) {
  const text = await file.text();
  let arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error('El JSON debe ser un array');

  const batch = writeBatch(db);
  for (const item of arr) {
    const n = parseInt(item.numero, 10);
    if (!Number.isInteger(n) || n < 1) continue;
    const payload = {
      numero: n,
      updatedAt: serverTimestamp(),
    };
    if (item.palabra)     payload.palabra = String(item.palabra);
    if (item.descripcion) payload.descripcion = String(item.descripcion);
    if (item.imagenUrl)   payload.imagenUrl = String(item.imagenUrl); // ojo: solo URL, no archivo
    batch.set(doc(db, "items", String(n)), payload, { merge: true });
  }
  await batch.commit();
}
