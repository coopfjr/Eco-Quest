// src/profileUtils.js
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// The public handle chosen in onboarding. Never fall back to the email address,
// because the email prefix would then appear on the public feed.
export const getPublicName = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'Users', uid));
    const name = snap.exists() ? snap.data().userDisplayName : null;
    return name && name.trim() ? name.trim() : 'EcoActioner';
  } catch (e) {
    return 'EcoActioner';
  }
};

// Handles: 3–20 characters, letters, numbers, dots and underscores.
export const HANDLE_RULES = '3 to 20 characters: letters, numbers, dots or underscores.';
export const validateHandle = (raw) => {
  const handle = (raw || '').trim();
  if (handle.length < 3 || handle.length > 20) return { ok: false, message: `Handles need ${HANDLE_RULES}` };
  if (!/^[A-Za-z0-9._]+$/.test(handle)) return { ok: false, message: `Handles can only use ${HANDLE_RULES.split(': ')[1]}` };
  return { ok: true, handle, lower: handle.toLowerCase() };
};

// Case-insensitive check, so "C" and "c" can't both exist. Also checks the
// exact-case field for accounts created before userDisplayNameLower existed.
export const isHandleTaken = async (handle, myUid) => {
  const lower = handle.toLowerCase();
  const usersRef = collection(db, 'Users');
  const [byLower, byExact] = await Promise.all([
    getDocs(query(usersRef, where('userDisplayNameLower', '==', lower))),
    getDocs(query(usersRef, where('userDisplayName', '==', handle))),
  ]);
  return [...byLower.docs, ...byExact.docs].some(d => d.id !== myUid);
};
