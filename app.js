import { BASE_PATH } from "./src/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initUI } from "./src/ui.js";

const addLink = (rel, href) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
};
addLink('manifest', `${BASE_PATH}/manifest.json`);
addLink('apple-touch-icon', `${BASE_PATH}/icons/icon-192.png`);
addLink('icon', `${BASE_PATH}/favicon.ico`);

const firebaseConfig = {
  apiKey: "AIzaSyAqqDLPFmtAPHXm5ZzpHyxRZZpW31f4Of0",
  authDomain: "carta-nomo.firebaseapp.com",
  projectId: "carta-nomo",
  storageBucket: "carta-nomo.firebasestorage.app",
  messagingSenderId: "354109744323",
  appId: "1:354109744323:web:d7548e8cfd0a1d4a41ae76",
  measurementId: "G-LWB4H4F6TD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

initUI({ auth, db, storage, BASE_PATH });
// === Popup de vista ===
const viewBackdrop = document.getElementById('viewBackdrop');
const viewClose    = document.getElementById('viewClose');
const viewImg      = document.getElementById('viewImg');
const viewTitle    = document.getElementById('viewTitle');
const viewDesc     = document.getElementById('viewDesc');

function openView({ num, palabra, imageUrl }) {
  viewTitle.textContent = `#${num} · ${palabra || 'Sin descripción'}`;
  viewDesc.textContent

