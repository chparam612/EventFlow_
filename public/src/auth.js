import { getAuth, signInWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from './firebase.js';

const auth = getAuth(app);

export function waitForAuth() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub(); resolve(user);
    });
  });
}

export async function getCurrentUser() {
  return waitForAuth();
}

export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch(e) {
    if (['auth/invalid-credential','auth/wrong-password', 'auth/user-not-found'].includes(e.code)) {
      throw new Error('Invalid email or password');
    }
    throw new Error('Login failed: ' + e.message);
  }
}

export async function loginAnonymously() {
  try {
    const cred = await signInAnonymously(auth);
    localStorage.setItem('ef_role','attendee');
    localStorage.setItem('ef_uid', cred.user.uid);
    return cred.user;
  } catch(e) {
    console.warn('Anonymous auth failed:', e.code);
    return null;
  }
}

export async function logout() {
  try { await signOut(auth); } catch(e) {}
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('/');
}

export function isStaffUser(u) { return u?.email?.toLowerCase().includes('staff'); }
export function isControlUser(u) { return u?.email?.toLowerCase().includes('control'); }
