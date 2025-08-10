import { BASE_PATH } from './config.js';

export async function loadFirebaseConfig() {
  const env = globalThis?.process?.env ?? {};
  const config = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
    measurementId: env.FIREBASE_MEASUREMENT_ID,
  };

  if (Object.values(config).every(Boolean)) {
    return config;
  }

  const response = await fetch(`${BASE_PATH}/firebaseConfig.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Firebase configuration not found');
  }
  return await response.json();
}
