// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
const storage = getStorage(app);

// Datos de ejemplo de descripciones
const descripciones = {
  1: "Café expreso intenso y aromático.",
  2: "Tostada con tomate y aceite de oliva.",
  3: "Zumo de naranja recién exprimido."
};

// Función para cargar imagen desde Storage
async function obtenerImagen(numero) {
  try {
    const ruta = `imagenes/${numero}.jpg`;
    const referencia = ref(storage, ruta);
    return await getDownloadURL(referencia);
  } catch (error) {
    console.error("No se pudo cargar la imagen:", error);
    return null;
  }
}

// Mostrar popup
async function mostrarPopup(numero) {
  const titulo = `Número ${numero}`;
  const descripcion = descripciones[numero] || "Sin descripción disponible";
  const imgUrl = await obtenerImagen(numero);

  document.getElementById("popupTitle").textContent = titulo;
  document.getElementById("popupDesc").textContent = descripcion;
  document.getElementById("popupImg").src = imgUrl || "https://via.placeholder.com/300?text=Sin+imagen";

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
