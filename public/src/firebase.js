import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, query, orderByChild, equalTo, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfb2dJusJELO0XFuShgh_sPD96Yu6CpKY",
  authDomain: "eventflow-v3.firebaseapp.com",
  projectId: "eventflow-v3",
  storageBucket: "eventflow-v3.firebasestorage.app",
  messagingSenderId: "2493932253",
  appId: "1:2493932253:web:0b75e246720ef38f99f134",
  measurementId: "G-PZDD3F2SMD"
};

export const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const _writing = new Set();

async function safeWrite(key, fn) {
  if (_writing.has(key)) return;
  _writing.add(key);
  try { await fn(); }
  finally { _writing.delete(key); }
}

export async function writeZone(zoneId, density, status) {
  await safeWrite('zone:' + zoneId, () =>
    set(ref(db, 'zones/' + zoneId), { density, status, updatedAt: Date.now() })
  );
}

export async function writeStaffStatus(uid, zone, status) {
  await safeWrite('staff:' + uid, () =>
    set(ref(db, 'staff/' + uid), { zone, status, updatedAt: Date.now(), online: true })
  );
}

export async function pushInstruction(zoneId, message, sentBy) {
  await safeWrite('instr:' + zoneId, () =>
    push(ref(db, 'instructions'), { zoneId, message, sentBy, sentAt: Date.now(), acked: [] })
  );
}

export async function pushNudge(zoneId, message) {
  await safeWrite('nudge:' + zoneId, () =>
    push(ref(db, 'nudges'), { zoneId, message, sentAt: Date.now() })
  );
}

export async function saveAttendeeData(uid, data) {
  await safeWrite('att:' + uid, () =>
    set(ref(db, 'attendees/' + uid), { ...data, savedAt: Date.now() })
  );
}

export async function saveFeedback(data) {
  await push(ref(db, 'feedback'), { ...data, submittedAt: Date.now() });
}

export function listenZones(cb) {
  return onValue(ref(db, 'zones'), snap => cb(snap.val() || {}));
}

export function listenInstructions(zoneId, cb) {
  const q = query(ref(db, 'instructions'), orderByChild('zoneId'), equalTo(zoneId), limitToLast(10));
  return onValue(q, snap => {
    const items = [];
    snap.forEach(c => items.push({ id: c.key, ...c.val() }));
    cb(items.reverse());
  });
}

export function listenNudges(cb) {
  return onValue(ref(db, 'nudges'), snap => {
    const items = [];
    snap.forEach(c => items.push({ id: c.key, ...c.val() }));
    cb(items.slice(-5));
  });
}

export function listenAllStaff(cb) {
  return onValue(ref(db, 'staff'), snap => cb(snap.val() || {}));
}
