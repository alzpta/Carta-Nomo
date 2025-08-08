// src/auth.js
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/**
 * initAuth(auth, uiRefs)
 * - Controla login/logout + visibilidad de botones
 * - Detecta si el usuario es admin (users/{uid}.isAdmin === true)
 * - No bloquea nada en cliente (las reglas de Storage/Firestore son la autoridad)
 */
export function initAuth(auth, {
  loginBtn, logoutBtn, editarBtn, borrarBtn, exportBtn, importBtn,
  userInfo, loginBackdrop, loginEmail, loginPass, loginSubmit, loginCancel,
  db // opcional si quieres pasar db aquí (si no, quitamos admin check)
}) {
  let isAdmin = false;

  const setButtons = (logged, admin) => {
    if (userInfo) userInfo.textContent = logged
      ? `${auth.currentUser?.email || 'usuario'}${admin ? ' (admin)' : ''}`
      : 'Sesión: invitado';

    if (loginBtn)  loginBtn.style.display  = logged ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = logged ? 'inline-flex' : 'none';
    if (editarBtn) editarBtn.style.display = (logged && admin) ? 'inline-flex' : 'none';
    if (borrarBtn) borrarBtn.style.display = (logged && admin) ? 'inline-flex' : 'none';
    if (exportBtn) exportBtn.style.display = (logged && admin) ? 'inline-flex' : 'none';
    if (importBtn) importBtn.style.display = (logged && admin) ? 'inline-flex' : 'none';
  };

  const isAdminUser = async (uid) => {
    if (!db || !uid) return false;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() && snap.data().isAdmin === true;
    } catch {
      return false;
    }
  };

  // Abrir/cerrar modal de login
  const openLogin = () => {
    if (!loginBackdrop) return;
    loginBackdrop.style.display = 'grid';
    loginBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loginEmail?.focus();
  };
  const closeLogin = () => {
    if (!loginBackdrop) return;
    loginBackdrop.style.display = 'none';
    loginBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  loginBtn?.addEventListener('click', openLogin);
  loginCancel?.addEventListener('click', closeLogin);

  loginSubmit?.addEventListener('click', async () => {
    const email = (loginEmail?.value || '').trim().toLowerCase();
    const pass  = loginPass?.value || '';
    if (!email || !pass) {
      alert('Completa email y contraseña.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      closeLogin();
    } catch (e) {
      console.error(e);
      alert('Login falló. Revisa credenciales.');
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
      alert('No se pudo cerrar sesión.');
    }
  });

  // Estado de auth + admin
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      isAdmin = false;
      setButtons(false, false);
      return;
    }
    isAdmin = await isAdminUser(user.uid);
    setButtons(true, isAdmin);
  });
}
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
