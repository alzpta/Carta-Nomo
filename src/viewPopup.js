// Popup de vista (detalle)
// Maneja la apertura, cierre y renderizado del popup de detalle.

let currentNumber = null;
let currentPalabra = '';
let currentDescripcion = '';
let currentImageURL = '';

const viewBackdrop = document.getElementById('viewBackdrop');
const viewTitle = document.getElementById('viewTitle');
const viewImage = document.getElementById('viewImage');
const viewDesc = document.getElementById('viewDesc');
const viewCloseBtn = document.getElementById('viewCloseBtn');

function openView() {
  viewBackdrop.classList.add('is-open');
  viewBackdrop.removeAttribute('aria-hidden');
  viewCloseBtn?.focus();
}

function closeView() {
  viewBackdrop.classList.remove('is-open');
  viewBackdrop.setAttribute('aria-hidden', 'true');
  currentNumber = null;
}

function renderView({ n, palabra, descripcion, imageURL }) {
  currentNumber = n;
  currentPalabra = palabra || '';
  currentDescripcion = descripcion || '';
  currentImageURL = imageURL || '';

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
    imageURL: currentImageURL
  };
}

// Eventos internos de cierre
viewBackdrop?.addEventListener('click', (e) => {
  if (e.target === viewBackdrop) closeView();
});
viewCloseBtn?.addEventListener('click', closeView);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeView();
});

export { renderView, openView, closeView, getCurrentNumber, isViewOpen, getCurrentData };
