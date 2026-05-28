// Popup de vista — Atelier design con plato 3D girable

let currentNumber = null;
let currentPalabra = '';
let currentDescripcion = '';
let currentImageURL = '';
let currentAlergenos = {};
let currentIngredientes = [];

const viewBackdrop = document.getElementById('viewBackdrop');
const viewShell = document.getElementById('viewShell');
const viewCloseBtn = document.getElementById('viewCloseBtn');
const viewSpeakBtn = document.getElementById('viewSpeakBtn');
const viewAlergenosSection = document.getElementById('viewAlergenos');
const viewIngredientesSection = document.getElementById('viewIngredientes');

// ── Dish 3D state ────────────────────────────────────────────────────
let dish3dRotY = 0;
let dish3dRotX = 42;
const dish3dDrag = { active: false, x: 0, y: 0, rotY: 0, rotX: 0 };
let dish3dInnerEl = null;

let autoRotateRaf = null;
let autoRotateResumeTimer = null;
let autoRotatePaused = false;

function stopAutoRotate() {
  cancelAnimationFrame(autoRotateRaf);
  autoRotateRaf = null;
}

function startAutoRotate() {
  stopAutoRotate();
  let last = null;
  function tick(ts) {
    if (!autoRotatePaused) {
      const dt = last ? ts - last : 16;
      dish3dRotY += dt * 0.022;
      updateDish3DTransform();
    }
    last = ts;
    autoRotateRaf = requestAnimationFrame(tick);
  }
  autoRotateRaf = requestAnimationFrame(tick);
}

function updateDish3DTransform() {
  if (dish3dInnerEl) {
    dish3dInnerEl.style.transform = `rotateX(${dish3dRotX}deg) rotateY(${dish3dRotY}deg)`;
  }
}

function onDish3DDown(e) {
  const p = e.touches ? e.touches[0] : e;
  dish3dDrag.active = true;
  autoRotatePaused = true;
  clearTimeout(autoRotateResumeTimer);
  dish3dDrag.x = p.clientX;
  dish3dDrag.y = p.clientY;
  dish3dDrag.rotY = dish3dRotY;
  dish3dDrag.rotX = dish3dRotX;
  e.preventDefault?.();
}

function onDish3DMove(e) {
  if (!dish3dDrag.active) return;
  const p = e.touches ? e.touches[0] : e;
  dish3dRotY = dish3dDrag.rotY + (p.clientX - dish3dDrag.x) * 0.6;
  dish3dRotX = Math.max(18, Math.min(72, dish3dDrag.rotX - (p.clientY - dish3dDrag.y) * 0.3));
  updateDish3DTransform();
}

function onDish3DUp() {
  dish3dDrag.active = false;
  autoRotateResumeTimer = setTimeout(() => { autoRotatePaused = false; }, 2000);
}

window.addEventListener('mousemove', onDish3DMove);
window.addEventListener('mouseup', onDish3DUp);
window.addEventListener('touchmove', onDish3DMove, { passive: true });
window.addEventListener('touchend', onDish3DUp);

// ── Dish visual ──────────────────────────────────────────────────────
function buildDishWellContent(imageURL) {
  if (imageURL) {
    return `<img src="${imageURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" loading="lazy" />`;
  }
  const h = 28;
  const h2 = (h + 8) % 360, h3 = (h - 10 + 360) % 360, h4 = (h + 12) % 360, h5 = (h + 60) % 360;
  return `
    <div class="dish-content">
      <div class="d-blob d-blob-base" style="background:radial-gradient(circle at 50% 45%,oklch(0.72 0.14 ${h}) 0%,oklch(0.52 0.16 ${h2}) 70%,transparent 78%)"></div>
      <div class="d-blob d-piece" style="top:22%;left:28%;background:radial-gradient(circle at 40% 35%,oklch(0.86 0.08 ${h3}),oklch(0.72 0.14 ${h}) 65%,transparent 80%)"></div>
      <div class="d-blob d-piece" style="top:52%;left:58%;background:radial-gradient(circle at 35% 30%,oklch(0.86 0.08 ${h3}),oklch(0.72 0.14 ${h}) 60%,transparent 80%)"></div>
      <div class="d-blob d-sauce" style="background:radial-gradient(ellipse 60% 38% at 50% 60%,oklch(0.42 0.18 ${h4}) 0%,transparent 70%)"></div>
      <div class="d-blob d-accent" style="top:30%;left:46%;background:oklch(0.78 0.18 ${h5})"></div>
      <div class="d-gloss"></div>
    </div>`;
}

function buildAndMountDish3D(imageURL) {
  const stage = document.getElementById('viewDish3DStage');
  if (!stage) return;

  stopAutoRotate();
  clearTimeout(autoRotateResumeTimer);
  autoRotatePaused = false;
  dish3dRotY = -30;
  dish3dRotX = 42;

  stage.innerHTML = `
    <div class="dish3d dish3d--atelier" id="dish3dEl">
      <div class="dish3d-tableshadow"></div>
      <div class="dish3d-inner" id="dish3dInner"
           style="transform:rotateX(80deg) rotateY(-200deg) scale(0.5);opacity:0;">
        <div class="dish3d-plate">
          <div class="dish3d-plate-rim"></div>
          <div class="dish3d-plate-well">${buildDishWellContent(imageURL)}</div>
        </div>
        <div class="dish3d-spotglow"></div>
      </div>
      <div class="dish3d-hint">↺ arrastra para girar</div>
    </div>`;

  dish3dInnerEl = document.getElementById('dish3dInner');
  const el = document.getElementById('dish3dEl');
  if (el) {
    el.addEventListener('mousedown', onDish3DDown);
    el.addEventListener('touchstart', onDish3DDown, { passive: false });
  }

  requestAnimationFrame(() => {
    if (!dish3dInnerEl) return;
    dish3dInnerEl.style.transition = 'transform 1.1s cubic-bezier(.16,.9,.18,1), opacity 0.7s ease';
    dish3dInnerEl.style.transform = `rotateX(${dish3dRotX}deg) rotateY(${dish3dRotY}deg)`;
    dish3dInnerEl.style.opacity = '1';
    setTimeout(() => {
      if (!dish3dInnerEl) return;
      dish3dInnerEl.style.transition = '';
      startAutoRotate();
    }, 1150);
  });
}

// ── Ingredients ──────────────────────────────────────────────────────
function renderIngredientesSection(ingredientes) {
  if (!viewIngredientesSection) return;
  const list = viewIngredientesSection.querySelector('.ing-list');
  if (!list) return;
  list.innerHTML = '';
  if (!ingredientes || ingredientes.length === 0) {
    viewIngredientesSection.classList.add('hidden');
    return;
  }
  viewIngredientesSection.classList.remove('hidden');
  for (const ing of ingredientes) {
    const li = document.createElement('li');
    li.textContent = ing;
    list.appendChild(li);
  }
}

// ── Allergens ────────────────────────────────────────────────────────
function renderAlergenosSection(alergenos) {
  if (!viewAlergenosSection) return;
  const chips = viewAlergenosSection.querySelector('.alg-atelier-chips');
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
    const isTrace = val === 'T';
    chip.className = `alg-atelier-chip${isTrace ? ' is-trace' : ''}`;
    chip.title = isTrace ? `${name}: trazas` : `${name}: presente`;
    chip.textContent = name;
    if (isTrace) {
      const em = document.createElement('em');
      em.textContent = ' · trazas';
      chip.appendChild(em);
    }
    chips.appendChild(chip);
  }
}

// ── Public API ───────────────────────────────────────────────────────
function renderView({ n, palabra, descripcion, imageURL, alergenos, ingredientes }) {
  currentNumber = n;
  currentPalabra = palabra || '';
  currentDescripcion = descripcion || '';
  currentImageURL = imageURL || '';
  currentAlergenos = alergenos || {};
  currentIngredientes = ingredientes || [];

  const numEl = document.getElementById('viewNumber');
  const titleEl = document.getElementById('viewTitle');
  const descEl = document.getElementById('viewDesc');

  if (numEl) numEl.textContent = String(n).padStart(2, '0');
  if (titleEl) titleEl.textContent = currentPalabra || '—';
  if (descEl) descEl.textContent = currentDescripcion || '—';

  buildAndMountDish3D(imageURL);
  renderIngredientesSection(currentIngredientes);
  renderAlergenosSection(currentAlergenos);
}

function openView() {
  viewBackdrop.classList.add('is-open');
  viewBackdrop.removeAttribute('aria-hidden');
  requestAnimationFrame(() => {
    viewShell?.classList.add('is-mounted');
  });
  viewCloseBtn?.focus();
}

function closeView() {
  stopAutoRotate();
  clearTimeout(autoRotateResumeTimer);
  viewShell?.classList.remove('is-mounted');
  setTimeout(() => {
    viewBackdrop.classList.remove('is-open');
    viewBackdrop.setAttribute('aria-hidden', 'true');
  }, 320);
  currentNumber = null;
}

function getCurrentNumber() { return currentNumber; }
function isViewOpen() { return viewBackdrop.classList.contains('is-open'); }
function getCurrentData() {
  return {
    n: currentNumber,
    palabra: currentPalabra,
    descripcion: currentDescripcion,
    imageURL: currentImageURL,
    alergenos: currentAlergenos,
    ingredientes: currentIngredientes
  };
}

// ── Event listeners ──────────────────────────────────────────────────
viewBackdrop?.addEventListener('click', (e) => {
  if (e.target === viewBackdrop) closeView();
});
viewCloseBtn?.addEventListener('click', closeView);
viewSpeakBtn?.addEventListener('click', () => {
  if (!currentDescripcion) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(currentDescripcion);
    u.lang = 'es-ES'; u.rate = 1; u.pitch = 1;
    synth.speak(u);
  } catch {}
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && viewBackdrop?.classList.contains('is-open')) closeView();
});

export { renderView, openView, closeView, getCurrentNumber, isViewOpen, getCurrentData };
