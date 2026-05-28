import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export const subscribeNumeros = (db, callback) =>
  onSnapshot(collection(db, 'numeros'), (snap) => {
    const nuevo = {};
    snap.forEach((d) => {
      const n = parseInt(d.id, 10);
      if (!isNaN(n)) {
        const data = d.data();
        nuevo[n] = {
          palabra: data.palabra || '',
          descripcion: data.descripcion || '',
          imageURL: data.imageURL || null,
          alergenos: data.alergenos || {},
          ingredientes: data.ingredientes || [],
        };
      }
    });
    callback(nuevo);
  });
