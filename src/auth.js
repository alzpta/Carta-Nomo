import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

export function initAuth(auth, elements) {
  const {
    loginBtn,
    logoutBtn,
    editarBtn,
    borrarBtn,
    exportBtn,
    importBtn,
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
    editarBtn.classList.toggle('hidden', !on);
    borrarBtn.classList.toggle('hidden', !on);
    exportBtn.classList.toggle('hidden', !on);
    importBtn.classList.toggle('hidden', !on);
    logoutBtn.classList.toggle('hidden', !on);
    loginBtn.classList.toggle('hidden', on);
    userInfo.textContent = on ? `Sesión: ${user.email}` : 'Sesión: invitado';
  };
  onAuthStateChanged(auth, renderAuthUI);

  const openLogin = () => {
    loginEmail.value = '';
    loginPass.value = '';
    clearErrors();
    loginSubmit.disabled = false;
    loginBackdrop.style.display = 'flex';
    loginBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loginEmail.focus();
  };
  const closeLogin = () => {
    loginBackdrop.style.display = 'none';
    loginBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  loginBtn.onclick = openLogin;
  loginCancel.onclick = closeLogin;
  loginBackdrop.addEventListener('click', (e) => {
    if (e.target === loginBackdrop) closeLogin();
  });
  loginSubmit.onclick = async () => {
    clearErrors();

    const email = (loginEmail.value || '').trim();
    const pass = loginPass.value || '';
    let hasError = false;

    if (!email) {
      setError(loginEmail, loginEmailError, 'El correo es obligatorio.');
      hasError = true;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(loginEmail, loginEmailError, 'Correo no válido.');
      hasError = true;
    }

    if (!pass) {
      setError(loginPass, loginPassError, 'La contraseña es obligatoria.');
      hasError = true;
    }

    if (hasError) return;

    loginSubmit.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeLogin();
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/invalid-email' || code === 'auth/user-not-found' || code === 'auth/user-disabled') {
        setError(loginEmail, loginEmailError, 'Correo no válido o usuario inexistente.');
      } else if (code === 'auth/wrong-password') {
        setError(loginPass, loginPassError, 'Contraseña incorrecta.');
      } else {
        setError(loginPass, loginPassError, e?.message || 'Error al iniciar sesión.');
      }
    } finally {
      loginSubmit.disabled = false;
    }
  };
  logoutBtn.onclick = () => signOut(auth);

  return { openLogin, closeLogin };
}
