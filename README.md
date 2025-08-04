# 🧊 Carta Nomo 

Una app web interactiva para visualizar, editar y escuchar palabras asociadas a números del 1 al 100. Desarrollada con Firebase, HTML, CSS y JavaScript. Perfecta para aprendizaje, accesibilidad o menús visuales personalizados.

## 🚀 Características

- 🎨 **Interfaz estilo Liquid Glass**: moderna, accesible y responsiva.
- 🔊 **Síntesis de voz**: lectura automática de palabras (Text-to-Speech).
- 🧾 **Visualización de imágenes**: cada número puede tener una imagen.
- 🔒 **Acceso administrador**: login seguro para editar, importar y exportar.
- ☁️ **Integración completa con Firebase**:
  - Firestore: guarda palabras e imágenes.
  - Auth: sistema de login.
  - Storage: subida de imágenes.
- 📱 **PWA lista para móvil**: se puede instalar como app en dispositivos.

## ⚙️ Configuración de rutas

Las rutas a los recursos estáticos dependen del prefijo definido en `src/config.js`:

```js
export const BASE_PATH = '/Carta-Nomo';
```

- Para despliegues en GitHub Pages bajo `/Carta-Nomo` deja el valor por defecto.
- Para servidores en la raíz del dominio usa cadena vacía `''` o `'/'`.

Ajusta `BASE_PATH` según el entorno y los enlaces del manifiesto, iconos y Service Worker se actualizarán en consecuencia.

## 🛠️ Generar el precache

`service-worker.js` precarga archivos listados en `APP_SHELL`. Para mantener esta lista al día se incluye una tarea de build que la genera automáticamente a partir del contenido del directorio.

```bash
npm install        # solo la primera vez
npm run build      # actualiza APP_SHELL
```

Ejecuta `npm run build` antes de desplegar para que el Service Worker contenga la lista más reciente de recursos estáticos.

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
