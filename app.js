import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { initUI } from "./src/ui.js";
import { BASE_PATH } from "./src/config.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "carta-nomo.firebaseapp.com",
  projectId: "carta-nomo",
  storageBucket: "carta-nomo.appspot.com",
  messagingSenderId: "354109744323",
  appId: "1:354109744323:web:d7548e8cfd0aXXXXXX",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

initUI({ auth, db, storage, BASE_PATH });
