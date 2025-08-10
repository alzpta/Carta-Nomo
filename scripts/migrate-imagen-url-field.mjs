import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });

const db = getFirestore();

async function migrateImagenUrl() {
  const snap = await db.collection('numeros').get();
  const batch = db.batch();
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.imagenUrl && !data.imageURL) {
      batch.update(docSnap.ref, {
        imageURL: data.imagenUrl,
        imagenUrl: FieldValue.delete(),
      });
    }
  });
  await batch.commit();
  console.log('Migración completada');
}

migrateImagenUrl().catch((err) => {
  console.error(err);
  process.exit(1);
});
