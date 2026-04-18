/**
 * EventFlow V2 — Firebase Module
 * Version: 10.8.0 ONLY
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getDatabase, ref, set, push, onValue,
  query, orderByChild, equalTo, limitToLast, off
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// ─── Firebase Config ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBYRQswMKJZITJwta4IBnZfdQ-Sw7kercQ",
  authDomain: "eventflow-4f04a.firebaseapp.com",
  databaseURL: "https://eventflow-4f04a-default-rtdb.firebaseio.com",
  projectId: "eventflow-4f04a",
  storageBucket: "eventflow-4f04a.firebasestorage.app",
  messagingSenderId: "48936766474",
  appId: "1:48936766474:web:605b8c457f3a73ca0463f3",
  measurementId: "G-ZJ6Q3RCY0N"
};

// ─── App Init ──────────────────────────────────────────────────────────────
export const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

/**
 * Structured logging helper
 * @param {'info'|'warn'|'error'} level 
 * @param {string} message 
 * @param {object} [data] 
 */
function log(level, message, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
}

import { validateZoneId } from './simulation.js';

const _writing = new Set();

/**
 * Prevent concurrent writes to the same key
 * @param {string} key 
 * @param {Function} fn 
 */
async function safeWrite(key, fn) {
  if (_writing.has(key)) return;
  _writing.add(key);
  try {
    await fn();
  } catch (e) {
    log('warn', 'Firebase write failed', { key, error: e.message });
  } finally {
    _writing.delete(key);
  }
}

// ─── Write Helpers ─────────────────────────────────────────────────────────

/**
 * Log a critical incident to Firestore for historical audit
 * @param {string} type 
 * @param {string} zone 
 * @param {string} description 
 */
export async function logIncident(type, zone, description) {
  try {
    await addDoc(collection(firestore, 'incidents'), {
      type,
      zone: validateZoneId(zone),
      description,
      timestamp: serverTimestamp(),
      severity: 'CRITICAL'
    });
  } catch (e) {
    log('error', 'Firestore incident log failed', { error: e.message, type, zone });
  }
}

export async function writeZone(zoneId, density, status) {
  await safeWrite('zone:' + zoneId, () =>
    set(ref(db, 'zones/' + zoneId), {
      density,
      status,
      updatedAt: Date.now()
    })
  );
}

export async function writeStaffStatus(uid, zone, status, online = true) {
  try {
    const ts = Date.now();
    await safeWrite('staff:' + uid, () =>
      set(ref(db, 'staff/' + uid), {
        zone: validateZoneId(zone),
        status,
        online,
        updatedAt: ts
      })
    );
    log('info', 'Status Sync Success', { role: 'STAFF', latency: Date.now() - ts });
  } catch (e) {
    log('error', 'writeStaffStatus failed', { error: e.message, uid });
  }
}

/**
 * Push an instruction message to the database for staff consumption
 * @param {string} zoneId 
 * @param {string} message 
 * @param {string} sentBy 
 * @param {string} [role] 
 */
export async function pushInstruction(zoneId, message, sentBy, role = 'CONTROL') {
  try {
    const ts = Date.now();
    const data = {
      zoneId: validateZoneId(zoneId),
      message,
      sentBy,
      senderRole: role,
      sentAt: ts,
      acked: [],
      status: 'pending'
    };

    log('info', 'Command Dispatch Started', { zoneId, sentBy });

    await safeWrite('instr:' + zoneId + ':' + ts, async () => {
      const newRef = push(ref(db, 'instructions'));
      await set(newRef, data);
      log('info', 'Command Dispatch Confirmed', { latency: Date.now() - ts });
    });
  } catch (e) {
    log('error', 'pushInstruction failed', { error: e.message, zoneId });
  }
}

export async function pushNudge(zoneId, message) {
  await safeWrite('nudge:' + zoneId + ':' + Date.now(), () =>
    push(ref(db, 'nudges'), {
      zoneId,
      message,
      sentAt: Date.now()
    })
  );
}

export async function saveAttendeeData(uid, data) {
  await safeWrite('att:' + uid, () =>
    set(ref(db, 'attendees/' + uid), {
      ...data,
      savedAt: Date.now()
    })
  );
}

export async function saveFeedback(data) {
  try {
    await push(ref(db, 'feedback'), {
      ...data,
      submittedAt: Date.now()
    });
  } catch (e) {
    log('error', 'Feedback save failed', { error: e.message });
  }
}

export async function setEmergencyStatus(active, type = null, zone = null) {
  try {
    const timestamp = Date.now();
    await safeWrite('emergency_status', () =>
      set(ref(db, 'emergency/status'), {
        active,
        type,
        zone,
        timestamp: active ? timestamp : null
      })
    );

    // Log to Firestore if active
    if (active) {
      await logIncident(type, zone, `Emergency activated by control room`);
    }
    log('info', 'Emergency status updated', { active, type, zone });
  } catch (error) {
    log('error', 'Emergency write failed', { error: error.message });
  }
}

// ─── Listeners ─────────────────────────────────────────────────────────────

export function listenZones(cb) {
  const r = ref(db, 'zones');
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
}

export function listenInstructions(zoneId, cb) {
  const q = query(
    ref(db, 'instructions'),
    orderByChild('zoneId'),
    equalTo(zoneId),
    limitToLast(10)
  );
  onValue(q, snap => {
    const items = [];
    snap.forEach(c => items.push({ id: c.key, ...c.val() }));
    if (cb) cb(items.reverse());
  });
  return () => off(q);
}

export function listenNudges(cb) {
  const q = query(ref(db, 'nudges'), limitToLast(5));
  onValue(q, snap => {
    const items = [];
    snap.forEach(c => items.push({ id: c.key, ...c.val() }));
    if (cb) cb(items.reverse());
  });
  return () => off(q);
}

export function listenAllStaff(cb) {
  const r = ref(db, 'staff');
  onValue(r, snap => cb(snap.val() || {}));
  return () => off(r);
}

export function listenEmergency(cb) {
  const r = ref(db, 'emergency/status');
  onValue(r, snap => {
    const val = snap.val();
    if (!val) {
      set(ref(db, 'emergency/status'), { active: false });
      cb({ active: false });
    } else {
      cb(val);
    }
  });
  return () => off(r);
}

/**
 * Persistent Telemetry
 * Writes performance/simulation metrics to Firestore (5th Google Service)
 * @param {object} data 
 */
export async function sendTelemetry(data) {
  try {
    await addDoc(collection(firestore, 'telemetry'), {
      ...data,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    log('warn', 'Telemetry sync failed locally', { error: e.message });
  }
}
