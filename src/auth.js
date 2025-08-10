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

  const renderAuthUI = (user) => {
    const on = !!user;
    editarBtn.style.display = on ? '' : 'none';
    borrarBtn.style.display = on ? '' : 'none';
    exportBtn.style.display = on ? '' : 'none';
    importBtn.style.display = on ? '' : 'none';
    logoutBtn.style.display = on ? '' : 'none';
    loginBtn.style.display = on ? 'none' : '';
    userInfo.textContent = on ? `Sesión: ${user.email}` : 'Sesión: invitado';
  };
  onAuthStateChanged(auth, renderAuthUI);

  const openLogin = () => {
    loginEmail.value = '';
    loginPass.value = '';
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
    try {
      await signInWithEmailAndPassword(auth, (loginEmail.value || '').trim(), loginPass.value || '');
      closeLogin();
    } catch (e) {
      alert('No se pudo iniciar sesión: ' + (e?.message || e));
    }
  };
  logoutBtn.onclick = () => signOut(auth);

  return { openLogin, closeLogin };
}
