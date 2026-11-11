// src/firestoreUtils.js
import { db } from './firebaseConfig.js';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import initialQuests from './initialQuests.js';

// Keeps the Quests collection in step with initialQuests.js.
// - Quests are written under their stable id, so nothing is duplicated.
// - Old quest documents whose id is not in the library (e.g. the original
//   auto-id quests) are removed. Users keep their copy of any quest already
//   assigned to them, because dailyQuests stores the full quest details.
// - Runs only when something is out of date, so normal launches cost one read.
const seedQuests = async () => {
  try {
    const questsRef = collection(db, 'Quests');
    const snapshot = await getDocs(questsRef);
    const existing = new Map(snapshot.docs.map(d => [d.id, d.data()]));
    const libraryIds = new Set(initialQuests.map(q => q.id));

    const toWrite = initialQuests.filter(q => {
      const cur = existing.get(q.id);
      if (!cur) return true;
      return cur.title !== q.title || cur.description !== q.description || cur.points !== q.points
        || cur.difficulty !== q.difficulty || JSON.stringify(cur.tags || []) !== JSON.stringify(q.tags);
    });
    const toDelete = snapshot.docs.filter(d => !libraryIds.has(d.id));

    if (toWrite.length === 0 && toDelete.length === 0) return false;

    // Firestore batches hold up to 500 writes.
    let batch = writeBatch(db);
    let ops = 0;
    const flush = async () => { if (ops > 0) { await batch.commit(); batch = writeBatch(db); ops = 0; } };

    for (const q of toWrite) {
      const { id, ...data } = q;
      batch.set(doc(questsRef, id), data);
      if (++ops >= 450) await flush();
    }
    for (const d of toDelete) {
      batch.delete(d.ref);
      if (++ops >= 450) await flush();
    }
    await flush();
    return true;
  } catch (error) {
    console.error('Error seeding quests:', error);
    return false;
  }
};

export { seedQuests };
