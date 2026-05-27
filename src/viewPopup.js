// Popup de vista (detalle)
// Maneja la apertura, cierre y renderizado del popup de detalle.

let currentNumber = null;
let currentPalabra = '';
let currentDescripcion = '';
let currentImageURL = '';
let currentAlergenos = {};

const viewBackdrop = document.getElementById('viewBackdrop');
let viewTitle = document.getElementById('viewTitle');
const viewImage = document.getElementById('viewImage');
let viewDesc = document.getElementById('viewDesc');
const viewCloseBtn = document.getElementById('viewCloseBtn');
const viewSpeakBtn = document.getElementById('viewSpeakBtn');
const viewAlergenosSection = document.getElementById('viewAlergenos');

function ensureViewNodes() {
  if (!viewTitle) {
    viewTitle = document.createElement('h2');
    viewTitle.id = 'viewTitle';
    viewBackdrop.querySelector('header')?.appendChild(viewTitle);
  }
  if (!viewDesc) {
    viewDesc = document.createElement('p');
    viewDesc.id = 'viewDesc';
    viewDesc.className = 'subtitle popup-desc';
    viewBackdrop.querySelector('.body')?.appendChild(viewDesc);
  }
}

function openView() {
  ensureViewNodes();
  viewBackdrop.classList.add('is-open');
  viewBackdrop.removeAttribute('aria-hidden');
  viewCloseBtn?.focus();
}

function closeView() {
  viewBackdrop.classList.remove('is-open');
  viewBackdrop.setAttribute('aria-hidden', 'true');
  currentNumber = null;
}

function renderView({ n, palabra, descripcion, imageURL, alergenos }) {
  ensureViewNodes();
  currentNumber = n;
  currentPalabra = palabra || '';
  currentDescripcion = descripcion || '';
  currentImageURL = imageURL || '';
  currentAlergenos = alergenos || {};

  viewTitle.textContent = `${n}. ${currentPalabra || '—'}`;
  viewDesc.textContent = currentDescripcion || '—';

  if (currentImageURL) {
    viewImage.src = currentImageURL;
    viewImage.alt = currentPalabra ? `Imagen de ${currentPalabra}` : `Imagen del número ${n}`;
    viewImage.style.display = '';
  } else {
    viewImage.removeAttribute('src');
    viewImage.alt = '';
    viewImage.style.display = 'none';
  }

  renderAlergenosSection(currentAlergenos);
}

function renderAlergenosSection(alergenos) {
  if (!viewAlergenosSection) return;
  const chips = viewAlergenosSection.querySelector('.alergenos-chips');
  if (!chips) return;
  chips.innerHTML = '';
  const entries = Object.entries(alergenos || {});
  if (entries.length === 0) {
    viewAlergenosSection.classList.add('hidden');
    return;
  }
  viewAlergenosSection.classList.remove('hidden');
  for (const [name, val] of entries) {
    const chip = document.createElement('span');
    chip.className = `alergeno-chip ${val === 'T' ? 'traza' : 'presente'}`;
    chip.textContent = val === 'T' ? `${name} (T)` : name;
    chip.title = val === 'T' ? `${name}: trazas` : `${name}: presente`;
    chips.appendChild(chip);
  }
}

function getCurrentNumber() {
  return currentNumber;
}

function isViewOpen() {
  return viewBackdrop.classList.contains('is-open');
}

function getCurrentData() {
  return {
    n: currentNumber,
    palabra: currentPalabra,
    descripcion: currentDescripcion,
    imageURL: currentImageURL,
    alergenos: currentAlergenos
  };
}

function speakDesc() {
  if (!currentDescripcion) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(currentDescripcion);
    u.lang = 'es-ES';
    u.rate = 1;
    u.pitch = 1;
    synth.speak(u);
  } catch {}
}

// Eventos internos de cierre
viewBackdrop?.addEventListener('click', (e) => {
  if (e.target === viewBackdrop) closeView();
});
viewCloseBtn?.addEventListener('click', closeView);
viewSpeakBtn?.addEventListener('click', speakDesc);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeView();
});

export { renderView, openView, closeView, getCurrentNumber, isViewOpen, getCurrentData };
