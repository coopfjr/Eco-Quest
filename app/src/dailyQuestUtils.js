// src/dailyQuestUtils.js
// Every function that changes points, tokens or quest state runs inside a Firestore
// transaction, so a double tap or two devices cannot spend or credit points twice
// (design document 2.3.8).
import { db, auth } from './firebaseConfig.js';
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';

const FREE_REROLLS_PER_DAY = 2;
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const REROLL_COST = 50;
const TOKEN_COST = 50;

// Local calendar date (YYYY-MM-DD), so the day changes at the user's midnight, not at UTC midnight.
const getTodayDate = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const toQuestObj = (q, todayDate) => ({
  questId: q.id,
  assignedDate: todayDate,
  completed: false,
  title: q.title,
  description: q.description,
  points: q.points,
  difficulty: q.difficulty,
});

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fetchQuestPool = async () => {
  const snap = await getDocs(collection(db, 'Quests'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const assignDailyQuests = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const todayDate = getTodayDate();
  const userDocRef = doc(db, 'Users', user.uid);

  try {
    // Queries cannot run inside a transaction, so read the quest pool first.
    const pool = await fetchQuestPool();

    return await runTransaction(db, async (t) => {
      const userDoc = await t.get(userDocRef);
      let userData = userDoc.exists() ? userDoc.data() : null;

      if (!userData) {
        userData = {
          score: 0,
          rerollTokens: FREE_REROLLS_PER_DAY,
          questsCompletedCount: 0,
          createdAt: new Date().toISOString(),
          dailyQuests: [],
          onboardingComplete: false,
          interests: [],
        };
      }

      const existing = userData.dailyQuests || [];
      if (userData.lastQuestAssignment === todayDate && existing.length > 0 && existing[0].assignedDate === todayDate) {
        return existing;
      }

      const userInterests = userData.interests || [];
      const assignedIds = new Set();
      const newDailyQuests = [];

      for (const level of DIFFICULTY_LEVELS) {
        const available = pool.filter(q => q.difficulty === level && !assignedIds.has(q.id));
        if (available.length === 0) continue;
        const preferred = available.filter(q => q.tags && q.tags.some(tag => userInterests.includes(tag)));
        const selected = preferred.length > 0 ? pickRandom(preferred) : pickRandom(available);
        newDailyQuests.push(toQuestObj(selected, todayDate));
        assignedIds.add(selected.id);
      }

      const updates = {
        ...userData,
        dailyQuests: newDailyQuests,
        lastQuestAssignment: todayDate,
        rerollTokens: FREE_REROLLS_PER_DAY,
      };
      t.set(userDocRef, updates);
      return newDailyQuests;
    });
  } catch (error) {
    console.error('Error assigning daily quests:', error);
    return null;
  }
};

const completeDailyQuest = async (questId, points) => {
  const user = auth.currentUser;
  if (!user || !questId) return false;

  const userDocRef = doc(db, 'Users', user.uid);

  try {
    return await runTransaction(db, async (t) => {
      const userDoc = await t.get(userDocRef);
      if (!userDoc.exists()) return false;
      const userData = userDoc.data();

      const quests = [...(userData.dailyQuests || [])];
      const index = quests.findIndex(q => q.questId === questId);
      if (index === -1 || quests[index].completed) return false;

      quests[index] = { ...quests[index], completed: true };
      t.update(userDocRef, {
        dailyQuests: quests,
        score: (userData.score || 0) + points,
        questsCompletedCount: (userData.questsCompletedCount || 0) + 1,
      });
      return true;
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    return false;
  }
};

const rerollDailyQuest = async (currentQuestId, targetMode = 'same') => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'User not logged in.' };

  const userDocRef = doc(db, 'Users', user.uid);

  try {
    const pool = await fetchQuestPool();

    return await runTransaction(db, async (t) => {
      const userDoc = await t.get(userDocRef);
      if (!userDoc.exists()) return { success: false, message: 'User not found.' };
      const userData = userDoc.data();

      let availableTokens = userData.rerollTokens || 0;
      let currentScore = userData.score || 0;
      const quests = [...(userData.dailyQuests || [])];
      const userInterests = userData.interests || [];

      const questIndex = quests.findIndex(q => q.questId === currentQuestId);
      if (questIndex === -1) return { success: false, message: 'Quest not found.' };
      if (quests[questIndex].completed) return { success: false, message: 'This quest is already completed.' };

      const currentDiff = quests[questIndex].difficulty;
      let targetDifficulty = currentDiff;

      if (targetMode === 'downgrade') {
        if (currentDiff === 'Hard') targetDifficulty = 'Medium';
        else if (currentDiff === 'Medium') targetDifficulty = 'Easy';
        else return { success: false, message: 'Quest is already at Easy difficulty.' };
      } else if (targetMode === 'upgrade') {
        if (currentDiff === 'Easy') targetDifficulty = 'Medium';
        else if (currentDiff === 'Medium') targetDifficulty = 'Hard';
        else return { success: false, message: 'Quest is already at Hard difficulty.' };
      }

      const heldIds = new Set(quests.map(q => q.questId));
      const available = pool.filter(q => q.difficulty === targetDifficulty && !heldIds.has(q.id));
      if (available.length === 0) {
        return { success: false, message: `No alternative ${targetDifficulty} quests available.` };
      }

      // Check what the user can pay with before charging anything.
      if (availableTokens > 0) {
        availableTokens -= 1;
      } else if (currentScore >= REROLL_COST) {
        currentScore -= REROLL_COST;
      } else {
        return { success: false, message: `Requires ${REROLL_COST} points or 1 token.` };
      }

      const preferred = available.filter(q => q.tags && q.tags.some(tag => userInterests.includes(tag)));
      const newQuest = preferred.length > 0 ? pickRandom(preferred) : pickRandom(available);
      const newQuestObj = toQuestObj(newQuest, getTodayDate());
      quests[questIndex] = newQuestObj;

      t.update(userDocRef, { dailyQuests: quests, rerollTokens: availableTokens, score: currentScore });
      return { success: true, message: `Swapped to (${targetDifficulty}): ${newQuest.title}`, newQuest: newQuestObj };
    });
  } catch (error) {
    console.error('Error rerolling quest:', error);
    return { success: false, message: 'Error during reroll.' };
  }
};

const useSkipToGainReroll = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: 'User not logged in.' };

  const userDocRef = doc(db, 'Users', user.uid);

  try {
    return await runTransaction(db, async (t) => {
      const userDoc = await t.get(userDocRef);
      if (!userDoc.exists()) return { success: false, message: 'User not found.' };
      const userData = userDoc.data();
      const currentScore = userData.score || 0;

      if (currentScore < TOKEN_COST) {
        return { success: false, message: `Need ${TOKEN_COST} points to buy a token.` };
      }

      t.update(userDocRef, {
        rerollTokens: (userData.rerollTokens || 0) + 1,
        score: currentScore - TOKEN_COST,
      });
      return { success: true, message: 'Purchased 1 Reroll Token.' };
    });
  } catch (error) {
    console.error('Error buying token:', error);
    return { success: false, message: 'Transaction failed.' };
  }
};

export { assignDailyQuests, getTodayDate, completeDailyQuest, rerollDailyQuest, useSkipToGainReroll, REROLL_COST, TOKEN_COST };
