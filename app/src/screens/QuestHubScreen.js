// src/screens/QuestHubScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { rerollDailyQuest, useSkipToGainReroll, assignDailyQuests, getTodayDate, REROLL_COST, TOKEN_COST } from '../dailyQuestUtils';
import { getDailyTip } from '../ecoTips';
import { getTier, getNextTier, getTierProgress } from '../ecoTiers';
import { DIFFICULTY_CRITTER, Avatar } from '../ui/Critters';
import { TierBadge, DifficultyIcon } from '../ui/Badges';
import Icon from '../ui/Icons';
import { Button, Sheet, ProgressBar } from '../ui/components';
import { TAB_BAR_SPACE } from '../ui/TabBar';
import { colors, difficultyTheme, fonts, type } from '../ui/theme';

const formatToday = () =>
  new Date().toLocaleDateString('en-CA', { weekday: 'long', day: 'numeric', month: 'long' });

function QuestCard({ quest, onStart, onSwap, swapLabel }) {
  const theme = difficultyTheme[quest.difficulty] || difficultyTheme.Medium;
  const Critter = DIFFICULTY_CRITTER[quest.difficulty] || DIFFICULTY_CRITTER.Medium;

  const header = (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <DifficultyIcon level={quest.difficulty} size={16} />
          <Text style={type.eyebrow}>{theme.label} · {quest.points} PTS</Text>
        </View>
        <Text style={[type.h3, { fontSize: 21, marginTop: 8, marginBottom: 4 }]}>{quest.title}</Text>
        <Text style={type.bodyMuted}>{quest.description}</Text>
      </View>
      <Critter size={76} />
    </View>
  );

  if (quest.completed) {
    return (
      <View
        style={{ backgroundColor: theme.bg, borderRadius: 26, padding: 18 }}
        accessible
        accessibilityLabel={`${quest.difficulty} quest, ${quest.title}, completed, ${quest.points} points earned`}
      >
        {header}
        <View style={{ marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 }}>
          <Icon name="check" size={18} strokeWidth={2.6} />
          <Text style={type.label}>Done · +{quest.points} pts</Text>
        </View>
      </View>
    );
  }

  // The swap link and the Start button are separate, well-spaced targets:
  // a near-miss on one can't trigger the other (Fitts' law).
  return (
    <View style={{ backgroundColor: theme.bg, borderRadius: 26, padding: 18 }}>
      <TouchableOpacity
        onPress={onStart}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${quest.difficulty} quest, ${quest.title}, ${quest.points} points. Opens the quest.`}
      >
        {header}
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 24 }}>
        <TouchableOpacity
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel={`Swap this quest. ${swapLabel}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4 }}
        >
          <Icon name="swap" size={18} />
          <Text style={[type.label, { textDecorationLine: 'underline' }]}>Swap</Text>
        </TouchableOpacity>
        <Button label="Start quest" iconRight="arrow" onPress={onStart} style={{ minHeight: 48, paddingHorizontal: 20 }} />
      </View>
    </View>
  );
}

function SwapOption({ Critter, title, sub, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22, backgroundColor: selected ? colors.mint : colors.ground, borderWidth: 2, borderColor: selected ? colors.ink : 'transparent' }}
    >
      <Critter size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>{title}</Text>
        <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text>
      </View>
      {selected
        ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={16} color={colors.white} strokeWidth={3} /></View>
        : <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.ink }} />}
    </TouchableOpacity>
  );
}

const POINTS_BY_LEVEL = { Easy: 50, Medium: 100, Hard: 150 };
const EASIER = { Hard: 'Medium', Medium: 'Easy' };
const HARDER = { Easy: 'Medium', Medium: 'Hard' };

export default function QuestHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState(getTodayDate());
  const [swapQuest, setSwapQuest] = useState(null);
  const [swapMode, setSwapMode] = useState('same');

  useEffect(() => {
    if (auth.currentUser) assignDailyQuests();
  }, []);

  // Roll the tip and quests over at local midnight, even if the app stays open.
  useEffect(() => {
    let current = getTodayDate();
    const timer = setInterval(() => {
      const now = getTodayDate();
      if (now !== current) {
        current = now;
        setToday(now);
        assignDailyQuests();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    const unsubscribe = onSnapshot(doc(db, 'Users', user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.ink} /></View>;
  }

  const score = userData?.score || 0;
  const tokens = userData?.rerollTokens || 0;
  const quests = userData?.dailyQuests || [];
  const doneCount = quests.filter(q => q.completed).length;
  const tier = getTier(score);
  const nextTier = getNextTier(score);
  const canAffordSwap = tokens > 0 || score >= REROLL_COST;
  const swapCostLabel = tokens > 0 ? `Uses 1 of your ${tokens} swap tokens. No points spent.` : `Costs ${REROLL_COST} points.`;
  const name = userData?.userDisplayName || 'there';

  const openSwap = (quest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!canAffordSwap) {
      Alert.alert('No swaps left', `Swapping needs 1 token or ${REROLL_COST} points.`);
      return;
    }
    setSwapMode('same');
    setSwapQuest(quest);
  };

  // The sheet itself is the confirmation step: pick an option, then confirm.
  const confirmSwap = async () => {
    if (!swapQuest || busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await rerollDailyQuest(swapQuest.questId, swapMode);
      setSwapQuest(null);
      if (!result.success) Alert.alert('Swap failed', result.message);
    } finally {
      setBusy(false);
    }
  };

  const buyToken = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (score < TOKEN_COST) {
      Alert.alert('Not enough points', `You need ${TOKEN_COST} points to buy a swap token.`);
      return;
    }
    Alert.alert('Buy a swap token?', `This spends ${TOKEN_COST} of your ${score} Eco Points.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Buy for ${TOKEN_COST} pts`, onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            const result = await useSkipToGainReroll();
            if (!result.success) Alert.alert('Purchase failed', result.message);
          } finally {
            setBusy(false);
          }
      } },
    ]);
  };

  const sq = swapQuest;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + insets.bottom, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyMuted, { fontFamily: fonts.medium }]}>{formatToday()}</Text>
            <Text style={[type.h1, { marginTop: 2 }]} accessibilityRole="header" numberOfLines={1}>Hi, {name}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Open your profile">
            <Avatar avatarKey={userData?.avatar} seed={auth.currentUser?.uid} size={48} bg={colors.mint} />
          </TouchableOpacity>
        </View>

        {/* Progress: today's actions + distance to the next Eco-Title */}
        <View style={{ backgroundColor: colors.sage, borderRadius: 28, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }} accessible accessibilityLabel={`${doneCount} of ${quests.length || 3} actions done today`}>
            <Text style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 46, letterSpacing: -1, color: colors.ink }}>{doneCount} of {quests.length || 3}</Text>
            <Text style={type.label}>actions done today</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }} accessible={false}>
            {(quests.length ? quests : [{}, {}, {}]).map((q, i) => (
              <View key={i} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: q.completed ? colors.ink : colors.white, borderWidth: q.completed ? 0 : 1.5, borderColor: colors.ink }} />
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(27,38,32,0.15)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TierBadge tierKey={tier.key} size={30} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={type.label}>{tier.title}</Text>
                <Text style={type.label}>{score} pts</Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <ProgressBar value={getTierProgress(score)} label={nextTier ? `${Math.round(getTierProgress(score) * 100)} percent of the way to ${nextTier.title}` : 'Top title reached'} />
              </View>
              <Text style={[type.small, { marginTop: 6 }]}>{nextTier ? `${nextTier.min - score} pts to ${nextTier.title}` : 'You hold the top title'}</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.cream, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 12 }} accessible accessibilityLabel={`Daily tip: ${getDailyTip(today)}`}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bulb" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.eyebrow}>DAILY TIP</Text>
            <Text style={[type.body, { fontSize: 14, lineHeight: 20, marginTop: 3 }]}>{getDailyTip(today)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={type.h2} accessibilityRole="header">Today's quests</Text>
          <View style={{ backgroundColor: colors.seafoam, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={[type.label, { fontSize: 13 }]}>{tokens} {tokens === 1 ? 'swap' : 'swaps'} left</Text>
          </View>
        </View>

        {quests.map(quest => (
          <QuestCard
            key={quest.questId}
            quest={quest}
            swapLabel={swapCostLabel}
            onStart={() => navigation.navigate('QuestDetail', { quest })}
            onSwap={() => openSwap(quest)}
          />
        ))}

        <View style={{ backgroundColor: colors.white, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: colors.line }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>Need more swaps?</Text>
            <Text style={[type.small, { marginTop: 2 }]}>You get 2 free each day. Extra tokens cost {TOKEN_COST} pts.</Text>
          </View>
          <Button label={`Buy · ${TOKEN_COST}`} variant="outline" onPress={buyToken} disabled={score < TOKEN_COST || busy}
            accessibilityLabel={`Buy one swap token for ${TOKEN_COST} points`} style={{ minHeight: 44, paddingHorizontal: 16 }} />
        </View>
      </ScrollView>

      <Sheet visible={!!sq} onClose={() => !busy && setSwapQuest(null)} labelledBy="Swap this quest">
        {sq && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {React.createElement(DIFFICULTY_CRITTER[sq.difficulty] || DIFFICULTY_CRITTER.Medium, { size: 56 })}
              <View style={{ flex: 1 }}>
                <Text style={[type.small, { fontFamily: fonts.bold }]}>CURRENT · {sq.difficulty.toUpperCase()}</Text>
                <Text style={[type.h2, { fontSize: 24, lineHeight: 27 }]} accessibilityRole="header">Swap {sq.title}?</Text>
              </View>
            </View>
            <Text style={type.bodyMuted}>Pick what you'd like instead.</Text>
            <View style={{ gap: 10 }} accessibilityRole="radiogroup">
              <SwapOption Critter={DIFFICULTY_CRITTER[sq.difficulty]} title={`Another ${sq.difficulty} quest`} sub={`Same points: ${POINTS_BY_LEVEL[sq.difficulty]}`} selected={swapMode === 'same'} onPress={() => setSwapMode('same')} />
              {EASIER[sq.difficulty] && (
                <SwapOption Critter={DIFFICULTY_CRITTER[EASIER[sq.difficulty]]} title="Something easier" sub={`${EASIER[sq.difficulty]} quest · ${POINTS_BY_LEVEL[EASIER[sq.difficulty]]} pts`} selected={swapMode === 'downgrade'} onPress={() => setSwapMode('downgrade')} />
              )}
              {HARDER[sq.difficulty] && (
                <SwapOption Critter={DIFFICULTY_CRITTER[HARDER[sq.difficulty]]} title="Something harder" sub={`${HARDER[sq.difficulty]} quest · ${POINTS_BY_LEVEL[HARDER[sq.difficulty]]} pts`} selected={swapMode === 'upgrade'} onPress={() => setSwapMode('upgrade')} />
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cream, borderRadius: 16, padding: 12 }}>
              <Icon name="swap" size={20} />
              <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{swapCostLabel}</Text>
            </View>
            <Button label="Swap quest" onPress={confirmSwap} loading={busy} />
            <Button label="Keep this quest" variant="outline" onPress={() => setSwapQuest(null)} disabled={busy} style={{ borderWidth: 0 }} />
          </>
        )}
      </Sheet>
    </View>
  );
}
