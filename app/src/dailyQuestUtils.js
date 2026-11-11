// src/dailyQuestUtils.js
// Every function that changes points, swaps or quest state runs inside a Firestore
// transaction, so a double tap or two devices cannot spend or credit points twice
// (design document 2.3.8).
//
// Swaps come from two pots:
//   freeSwaps    – reset to FREE_REROLLS_PER_DAY each day (unused ones don't carry over)
//   rerollTokens – bought with points; they never expire
// Swapping uses free swaps first, then bought tokens, then points.
import { db, auth } from './firebaseConfig.js';
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';

const FREE_REROLLS_PER_DAY = 2;
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const REROLL_COST = 50;
const TOKEN_COST = 50;
const LATE_COMPLETION_MEMORY = 30;

// Local calendar date (YYYY-MM-DD), so the day changes at the user's midnight.
const getTodayDate = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Total swaps available, for display.
const getSwapBalance = (userData) => (userData?.freeSwaps || 0) + (userData?.rerollTokens || 0);

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

// Prefer quests matching the user's interests and not shown yesterday, falling back
// gracefully when the pool is small.
const choose = (candidates, interests, avoidIds) => {
  const fresh = candidates.filter(q => !avoidIds.has(q.id));
  const base = fresh.length > 0 ? fresh : candidates;
  const preferred = base.filter(q => q.tags && q.tags.some(tag => interests.includes(tag)));
  return pickRandom(preferred.length > 0 ? preferred : base);
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
          freeSwaps: FREE_REROLLS_PER_DAY,
          rerollTokens: 0,
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

      const interests = userData.interests || [];
      const yesterdayIds = new Set(existing.map(q => q.questId));
      const assignedIds = new Set();
      const newDailyQuests = [];

      for (const level of DIFFICULTY_LEVELS) {
        const candidates = pool.filter(q => q.difficulty === level && !assignedIds.has(q.id));
        if (candidates.length === 0) continue;
        const selected = choose(candidates, interests, yesterdayIds);
        newDailyQuests.push(toQuestObj(selected, todayDate));
        assignedIds.add(selected.id);
      }

      // Migration: before freeSwaps existed, rerollTokens held the 2 daily swaps plus
      // any bought tokens. Keep only the bought part.
      let purchased = userData.rerollTokens || 0;
      if (userData.freeSwaps === undefined && userDoc.exists()) {
        purchased = Math.max(0, purchased - FREE_REROLLS_PER_DAY);
      }

      t.set(userDocRef, {
        ...userData,
        dailyQuests: newDailyQuests,
        lastQuestAssignment: todayDate,
        freeSwaps: FREE_REROLLS_PER_DAY,
        rerollTokens: purchased,
      });
      return newDailyQuests;
    });
  } catch (error) {
    console.error('Error assigning daily quests:', error);
    return null;
  }
};

// assignedDate lets a completion that was queued offline still count after midnight,
// when that quest is no longer in today's list. Each late completion is remembered so
// it can never be credited twice.
const completeDailyQuest = async (questId, points, assignedDate) => {
  const user = auth.currentUser;
  if (!user || !questId) return false;

  const userDocRef = doc(db, 'Users', user.uid);

  try {
    return await runTransaction(db, async (t) => {
      const userDoc = await t.get(userDocRef);
      if (!userDoc.exists()) return false;
      const userData = userDoc.data();

      const quests = [...(userData.dailyQuests || [])];
      const index = quests.findIndex(q => q.questId === questId && (!assignedDate || q.assignedDate === assignedDate));

      if (index !== -1) {
        if (quests[index].completed) return false;
        quests[index] = { ...quests[index], completed: true };
        t.update(userDocRef, {
          dailyQuests: quests,
          score: (userData.score || 0) + points,
          questsCompletedCount: (userData.questsCompletedCount || 0) + 1,
        });
        return true;
      }

      // Not in today's list: only credit it if it was a real quest from an earlier day.
      if (!assignedDate || assignedDate >= getTodayDate()) return false;
      const key = `${assignedDate}:${questId}`;
      const late = userData.lateCompletions || [];
      if (late.includes(key)) return false;
      t.update(userDocRef, {
        score: (userData.score || 0) + points,
        questsCompletedCount: (userData.questsCompletedCount || 0) + 1,
        lateCompletions: [...late, key].slice(-LATE_COMPLETION_MEMORY),
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

      let freeSwaps = userData.freeSwaps || 0;
      let purchased = userData.rerollTokens || 0;
      let currentScore = userData.score || 0;
      const quests = [...(userData.dailyQuests || [])];
      const interests = userData.interests || [];

      const questIndex = quests.findIndex(q => q.questId === currentQuestId);
      if (questIndex === -1) return { success: false, message: 'Quest not found.' };
      if (quests[questIndex].completed) return { success: false, message: 'This quest is already completed.' };

      const currentDiff = quests[questIndex].difficulty;
      let targetDifficulty = currentDiff;
      if (targetMode === 'downgrade') {
        if (currentDiff === 'Hard') targetDifficulty = 'Medium';
        else if (currentDiff === 'Medium') targetDifficulty = 'Easy';
        else return { success: false, message: 'Quest is already Easy.' };
      } else if (targetMode === 'upgrade') {
        if (currentDiff === 'Easy') targetDifficulty = 'Medium';
        else if (currentDiff === 'Medium') targetDifficulty = 'Hard';
        else return { success: false, message: 'Quest is already Hard.' };
      }

      const heldIds = new Set(quests.map(q => q.questId));
      const candidates = pool.filter(q => q.difficulty === targetDifficulty && !heldIds.has(q.id));
      if (candidates.length === 0) {
        return { success: false, message: `No other ${targetDifficulty} quests are available.` };
      }

      if (freeSwaps > 0) freeSwaps -= 1;
      else if (purchased > 0) purchased -= 1;
      else if (currentScore >= REROLL_COST) currentScore -= REROLL_COST;
      else return { success: false, message: `Swapping needs 1 token or ${REROLL_COST} points.` };

      const newQuest = choose(candidates, interests, new Set());
      const newQuestObj = toQuestObj(newQuest, getTodayDate());
      quests[questIndex] = newQuestObj;

      t.update(userDocRef, { dailyQuests: quests, freeSwaps, rerollTokens: purchased, score: currentScore });
      return { success: true, message: `Swapped to ${newQuest.title}.`, newQuest: newQuestObj };
    });
  } catch (error) {
    console.error('Error rerolling quest:', error);
    return { success: false, message: 'Something went wrong during the swap.' };
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
        return { success: false, message: `You need ${TOKEN_COST} points to buy a token.` };
      }
      t.update(userDocRef, {
        rerollTokens: (userData.rerollTokens || 0) + 1,
        score: currentScore - TOKEN_COST,
      });
      return { success: true, message: 'Bought 1 swap token.' };
    });
  } catch (error) {
    console.error('Error buying token:', error);
    return { success: false, message: 'Purchase failed.' };
  }
};

export {
  assignDailyQuests, getTodayDate, getSwapBalance, completeDailyQuest, rerollDailyQuest, useSkipToGainReroll,
  REROLL_COST, TOKEN_COST, FREE_REROLLS_PER_DAY,
};
