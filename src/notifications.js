export function showToast(message, type = 'info', timeout = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  // Force reflow for animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  setTimeout(() => {
    toast.classList.remove('visible');
    let done = false;
    const remove = () => {
      if (done) return;
      done = true;
      toast.remove();
      if (!container.childElementCount) container.remove();
    };
    toast.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 400);
  }, timeout);
}

export function showConfirm(message, {
  okText = 'Aceptar',
  cancelText = 'Cancelar',
  okClass = 'primary'
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-backdrop';
    const modal = document.createElement('div');
    modal.className = 'confirm-modal glass';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Confirmación');

    const body = document.createElement('div');
    body.className = 'body';
    const p = document.createElement('p');
    p.textContent = message;
    body.appendChild(p);

    const actions = document.createElement('div');
    actions.className = 'actions confirm-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = cancelText;
    const okBtn = document.createElement('button');
    okBtn.className = `btn ${okClass}`.trim();
    okBtn.textContent = okText;
    actions.append(cancelBtn, okBtn);

    modal.append(body, actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => cancelBtn.focus());

    const cleanup = (result) => {
      backdrop.remove();
      document.body.style.overflow = '';
      resolve(result);
    };

    cancelBtn.addEventListener('click', () => cleanup(false));
    okBtn.addEventListener('click', () => cleanup(true));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { cleanup(false); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (document.activeElement === cancelBtn) okBtn.focus();
        else cancelBtn.focus();
      }
    });
  });
}
