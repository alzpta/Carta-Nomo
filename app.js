// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";


// Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "carta-nomo.firebaseapp.com",
  projectId: "carta-nomo",
  storageBucket: "carta-nomo.appspot.com",
  messagingSenderId: "354109744323",
  appId: "1:354109744323:web:d7548e8cfd0aXXXXXX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let datos = {};
subscribeNumeros(db, (nuevo) => {
  datos = nuevo;
});

// Mostrar popup
function mostrarPopup(numero) {
  const titulo = `Número ${numero}`;
  const info = datos[numero] || {};
  const descripcion = info.palabra || "Sin descripción disponible";
  const imgUrl =
    info.imagenUrl || "https://via.placeholder.com/300?text=Sin+imagen";

  document.getElementById("popupTitle").textContent = titulo;
  document.getElementById("popupDesc").textContent = descripcion;
  document.getElementById("popupImg").src = imgUrl;

  document.getElementById("popupBackdrop").style.display = "flex";
}

// Cerrar popup
document.getElementById("popupClose").addEventListener("click", () => {
  document.getElementById("popupBackdrop").style.display = "none";
});

// Detectar clic en un número
document.getElementById("grid").addEventListener("click", (e) => {
  if (e.target.classList.contains("numero")) {
    const numero = e.target.dataset.num;
    mostrarPopup(numero);
  }
});
