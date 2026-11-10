// src/offlineSyncUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { completeDailyQuest } from './dailyQuestUtils';

const QUEUE_KEY = '@ecoquest_offline_posts_queue';

export const queueOfflinePost = async (postData, questInfo) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({ postData, questInfo, queuedAt: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (e) {
    console.error("Failed to queue offline post:", e);
    return false;
  }
};

export const syncOfflinePosts = async () => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;
    const queue = JSON.parse(existing);
    if (queue.length === 0) return;

    const remainingQueue = [];
    for (const item of queue) {
      try {
        const { postData, questInfo } = item;
        await addDoc(collection(db, 'CommunityPosts'), {
          ...postData,
          timestamp: serverTimestamp()
        });
        if (questInfo) {
          await completeDailyQuest(questInfo.questId, questInfo.points);
        }
      } catch (err) {
        remainingQueue.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (e) {
    console.error("Failed syncing offline posts:", e);
  }
};