import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { t } from "./i18n.js";

export function initAuth(auth, elements) {
  const {
    loginBtn,
    logoutBtn,
    userInfo,
    loginBackdrop,
    loginEmail,
    loginPass,
    loginSubmit,
    loginCancel
  } = elements;

  const loginEmailError = document.getElementById('loginEmailError');
  const loginPassError = document.getElementById('loginPassError');

  const setError = (input, errorEl, message) => {
    if (errorEl) errorEl.textContent = message || '';
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const clearErrors = () => {
    setError(loginEmail, loginEmailError, '');
    setError(loginPass, loginPassError, '');
  };

  const renderAuthUI = (user) => {
    const on = !!user;
    logoutBtn?.classList.toggle('hidden', !on);
    loginBtn?.classList.toggle('hidden', on);
    if (userInfo) userInfo.textContent = on ? `${t('sessionPrefix')}${user.email}` : t('sessionGuest');
  };
  onAuthStateChanged(auth, renderAuthUI);

  const openLogin = () => {
    loginEmail.value = '';
    loginPass.value = '';
    clearErrors();
    loginSubmit.disabled = false;
    loginBackdrop.classList.add('is-open');
    loginBackdrop.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    loginEmail.focus();
  };
  const closeLogin = () => {
    loginBackdrop.classList.remove('is-open');
    loginBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  loginBtn?.addEventListener('click', openLogin);
  loginCancel?.addEventListener('click', closeLogin);
  loginBackdrop?.addEventListener('click', (e) => {
    if (e.target === loginBackdrop) closeLogin();
  });
  loginSubmit?.addEventListener('click', async () => {
    clearErrors();

    const email = (loginEmail.value || '').trim();
    const pass = loginPass.value || '';
    let hasError = false;

    if (!email) {
      setError(loginEmail, loginEmailError, t('emailRequired'));
      hasError = true;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(loginEmail, loginEmailError, t('emailInvalid'));
      hasError = true;
    }

    if (!pass) {
      setError(loginPass, loginPassError, t('passRequired'));
      hasError = true;
    }

    if (hasError) return;

    loginSubmit.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = 'admin.html';
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/invalid-email' || code === 'auth/user-not-found' || code === 'auth/user-disabled') {
        setError(loginEmail, loginEmailError, t('userNotFound'));
      } else if (code === 'auth/wrong-password') {
        setError(loginPass, loginPassError, t('wrongPassword'));
      } else {
        setError(loginPass, loginPassError, t('loginError'));
      }
    } finally {
      loginSubmit.disabled = false;
    }
  });
  logoutBtn?.addEventListener('click', () => signOut(auth));

  return { openLogin, closeLogin };
}
