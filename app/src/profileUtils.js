// src/profileUtils.js
import { doc, getDoc } from 'firebase/firestore';
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
