// src/screens/DoneScreen.js
// Completion feels like recognition, not payment: the action and any new title are
// the headline; the points are a small detail (overjustification, Wave 3).
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { getTier, getTierIndex, getNextTier } from '../ecoTiers';
import { DIFFICULTY_CRITTER } from '../ui/Critters';
import { TierBadge } from '../ui/Badges';
import { Button } from '../ui/components';
import { colors, fonts, type } from '../ui/theme';

const Sparkle = ({ size, style }) => (
  <View style={[{ position: 'absolute' }, style]} accessible={false}>
    <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11z" fill="#FFFFFF" /></Svg>
  </View>
);

export default function DoneScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { quest, prevScore = 0, shared, offline } = route.params || {};
  const [userData, setUserData] = useState(null);
  const Critter = DIFFICULTY_CRITTER[quest?.difficulty] || DIFFICULTY_CRITTER.Medium;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    return onSnapshot(doc(db, 'Users', user.uid), snap => snap.exists() && setUserData(snap.data()));
  }, []);

  const points = quest?.points || 0;
  const newScore = prevScore + points;
  const unlocked = getTierIndex(newScore) > getTierIndex(prevScore);
  const newTier = getTier(newScore);
  const nextTier = getNextTier(newScore);
  const quests = userData?.dailyQuests || [];
  const done = Math.max(quests.filter(q => q.completed).length, offline ? 0 : 1);
  const total = quests.length || 3;
  const name = userData?.userDisplayName;

  let summary = `That's ${done} of today's ${total} actions.`;
  if (offline) summary = "You're offline, so this is saved on your phone and will sync when you reconnect.";
  else if (shared) summary += ' Your post is on the community feed.';

  return (
    <View style={{ flex: 1, backgroundColor: colors.mint }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <View style={{ height: 290, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.mintDeep }} />
          <Sparkle size={30} style={{ left: 30, top: 30 }} />
          <Sparkle size={22} style={{ right: 30, top: 60 }} />
          <Sparkle size={28} style={{ right: 20, top: 200 }} />
          <Sparkle size={20} style={{ left: 20, top: 210 }} />
          <Critter size={200} />
        </View>

        <Text style={[type.eyebrow, { fontSize: 14, marginTop: 8 }]}>{(quest?.title || 'Quest').toUpperCase()} · DONE</Text>
        <Text style={[type.hero, { fontSize: 50, lineHeight: 48, marginTop: 6, marginBottom: 10 }]} accessibilityRole="header">
          NICE ONE{name ? `,\n${name.toUpperCase()}.` : '.'}
        </Text>
        <Text style={[type.body, { fontSize: 17, lineHeight: 24 }]}>{summary}</Text>

        <View
          style={{ marginTop: 20, backgroundColor: colors.white, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          accessible
          accessibilityLabel={unlocked ? `New title unlocked: ${newTier.title}. Plus ${points} points.` : `Plus ${points} points. ${nextTier ? `${nextTier.min - newScore} points to ${nextTier.title}.` : ''}`}
        >
          <TierBadge tierKey={newTier.key} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[type.small, { fontFamily: fonts.bold }]}>{unlocked ? 'NEW TITLE UNLOCKED' : 'YOUR TITLE'}</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.ink, marginTop: 2 }}>{newTier.title}</Text>
            {!unlocked && nextTier ? <Text style={type.small}>{nextTier.min - newScore} pts to {nextTier.title}</Text> : null}
          </View>
          <Text style={type.label}>+{points} pts</Text>
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />
        <View style={{ gap: 10 }}>
          <Button label="Back to quests" onPress={() => navigation.navigate('Tabs', { screen: 'QuestHub' })} />
          {shared && !offline && (
            <Button label="See it on the feed" variant="outline" onPress={() => navigation.navigate('Tabs', { screen: 'Community' })} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
