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

## 🔐 Configuración segura

Las credenciales de Firebase ya no se incluyen en el código fuente. La aplicación
carga un archivo `config.json` al iniciar, por lo que debes proporcionar este
archivo en el entorno de despliegue y mantenerlo fuera del control de versiones.
Si el archivo no está presente, la app se ejecutará en modo vacío sin conexión
a Firebase.

1. Crea un archivo `config.json` junto a `index.html` con el siguiente formato:

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "...",
  "measurementId": "..."
}
```

2. Usa variables de entorno u otros mecanismos seguros para generar ese archivo
   sin exponer las claves en el repositorio.
3. Durante el despliegue, copia `config.json` junto a `index.html` (por ejemplo,
   en el directorio público de tu hosting) para que el `fetch` a `/config.json`
   pueda resolverlo correctamente.

La aplicación realiza un `fetch` a `/config.json` para inicializar Firebase, por
lo que el archivo debe estar accesible en el servidor.

## 🧼 Sanitización de entradas

Para proteger contra inyección de código, las palabras introducidas manualmente o
mediante importación se validan y sanitizan antes de guardarse:

- Se rechazan entradas que superen 50 caracteres o incluyan los símbolos
  `<`, `>`, `&`, `"` o `'`.
- Las cadenas válidas se procesan con [DOMPurify](https://github.com/cure53/DOMPurify)
  para eliminar cualquier contenido HTML no deseado antes de almacenarse en Firestore.

Estas reglas ayudan a mantener coherencia y seguridad en futuras modificaciones.

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
