// i18n de la interfaz — el contenido de los platos (Firestore) permanece en español.

const dictionaries = {
  es: {
    subtitle: 'Toca un número para ver y escuchar. Azul = libre/no existe en menú.',
    sessionGuest: 'Sesión: invitado',
    sessionPrefix: 'Sesión: ',
    login: 'Iniciar sesión',
    searchPlaceholder: 'Buscar plato…',
    searchLabel: 'Buscar plato',
    searchClear: 'Borrar búsqueda',
    filterLabel: 'Filtrar por alérgenos',
    gridLabel: 'Selección de números',
    gridHelp: 'Consejo: usa ← → para moverte, Enter para escuchar.',
    loginTitle: 'Iniciar sesión',
    emailLabel: 'Correo',
    passLabel: 'Contraseña',
    cancel: 'Cancelar',
    enter: 'Entrar',
    close: 'Cerrar',
    ingredients: 'ingredientes',
    allergens: 'alérgenos',
    listen: 'Escuchar',
    filterSheetTitle: 'Ocultar platos con…',
    filterClearAll: 'Borrar todo',
    filterDone: 'Hecho',
    dishRotateHint: '↺ arrastra para girar',
    trace: 'trazas',
    emailRequired: 'El correo es obligatorio.',
    emailInvalid: 'Correo no válido.',
    passRequired: 'La contraseña es obligatoria.',
    userNotFound: 'Correo no válido o usuario inexistente.',
    wrongPassword: 'Contraseña incorrecta.',
    loginError: 'Error al iniciar sesión.',
  },
  en: {
    subtitle: 'Tap a number to view and listen. Blue = available/not on the menu.',
    sessionGuest: 'Session: guest',
    sessionPrefix: 'Session: ',
    login: 'Log in',
    searchPlaceholder: 'Search dish…',
    searchLabel: 'Search dish',
    searchClear: 'Clear search',
    filterLabel: 'Filter by allergens',
    gridLabel: 'Number selection',
    gridHelp: 'Tip: use ← → to move, Enter to listen.',
    loginTitle: 'Log in',
    emailLabel: 'Email',
    passLabel: 'Password',
    cancel: 'Cancel',
    enter: 'Log in',
    close: 'Close',
    ingredients: 'ingredients',
    allergens: 'allergens',
    listen: 'Listen',
    filterSheetTitle: 'Hide dishes with…',
    filterClearAll: 'Clear all',
    filterDone: 'Done',
    dishRotateHint: '↺ drag to rotate',
    trace: 'traces',
    emailRequired: 'Email is required.',
    emailInvalid: 'Invalid email.',
    passRequired: 'Password is required.',
    userNotFound: 'Invalid email or user not found.',
    wrongPassword: 'Incorrect password.',
    loginError: 'Login failed.',
  },
};

// Nombres de alérgenos: la clave interna (usada para casar con Firestore) es
// siempre en español; esto solo traduce lo que se muestra en pantalla.
const ALLERGEN_LABELS_EN = {
  'Gluten': 'Gluten',
  'Crustáceos': 'Crustaceans',
  'Huevos': 'Eggs',
  'Pescado': 'Fish',
  'Cacahuete': 'Peanuts',
  'Soja': 'Soy',
  'Leche': 'Milk',
  'F. cáscara': 'Tree nuts',
  'Apio': 'Celery',
  'Mostaza': 'Mustard',
  'Sésamo': 'Sesame',
  'Altramuces': 'Lupin',
  'Sulfitos': 'Sulphites',
  'Moluscos': 'Molluscs',
};

function detectLang() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'es'];
  for (const l of langs) {
    if (l.toLowerCase().startsWith('es')) return 'es';
  }
  return 'en';
}

export const LANG = detectLang();
document.documentElement.lang = LANG;

export function t(key) {
  return dictionaries[LANG][key] ?? dictionaries.es[key] ?? key;
}

export function allergenLabel(name) {
  if (LANG === 'en') return ALLERGEN_LABELS_EN[name] || name;
  return name;
}