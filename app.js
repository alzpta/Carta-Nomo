import { BASE_PATH } from "./src/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initUI } from "./src/ui.js";
import { loadFirebaseConfig } from "./src/firebaseConfig.js";

const addLink = (rel, href) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
};
addLink('manifest', `${BASE_PATH}/manifest.json`);
addLink('apple-touch-icon', `${BASE_PATH}/icons/icon-192.png`);
addLink('icon', `${BASE_PATH}/favicon.ico`);

const firebaseConfig = await loadFirebaseConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

initUI({ auth, db, storage, BASE_PATH });
