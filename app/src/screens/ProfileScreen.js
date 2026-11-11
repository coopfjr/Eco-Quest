// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ECO_TIERS, getTier, getNextTier, getTierProgress } from '../ecoTiers';
import { CLIMATE_TAGS } from './OnboardingScreen';
import { AVATARS, Avatar } from '../ui/Critters';
import { TierBadge } from '../ui/Badges';
import Icon from '../ui/Icons';
import { Button, Chip, ProgressBar, Sheet } from '../ui/components';
import { TAB_BAR_SPACE } from '../ui/TabBar';
import { colors, fonts, type } from '../ui/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [titlesOpen, setTitlesOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    return onSnapshot(doc(db, 'Users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setSelectedInterests(prev => prev === null ? (data.interests || []) : prev);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.ink} /></View>;

  const uid = auth.currentUser?.uid;
  const score = userData?.score || 0;
  const tier = getTier(score);
  const nextTier = getNextTier(score);
  const interests = selectedInterests || [];
  const prefsChanged = JSON.stringify([...interests].sort()) !== JSON.stringify([...(userData?.interests || [])].sort());

  const toggleTag = (tag) => setSelectedInterests(prev => (prev || []).includes(tag) ? prev.filter(t => t !== tag) : [...(prev || []), tag]);

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateDoc(doc(db, 'Users', uid), { interests });
      Alert.alert('Saved', 'Your quests will lean towards these areas from tomorrow.');
    } catch (e) {
      Alert.alert('Error', 'Could not save your changes.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const chooseAvatar = async (key) => {
    try {
      await updateDoc(doc(db, 'Users', uid), { avatar: key });
      setAvatarOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update your critter.');
    }
  };

  const logout = () => {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut(auth).catch(() => Alert.alert('Error', 'Log out failed.')) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}>
        <View style={{ backgroundColor: colors.mint, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', gap: 10 }}>
          <View>
            <Avatar avatarKey={userData?.avatar} seed={uid} size={116} bg={colors.white} />
            <TouchableOpacity
              onPress={() => setAvatarOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Change your critter"
              style={{ position: 'absolute', right: -4, bottom: -2, width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: colors.mint, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="edit" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[type.h1, { marginTop: 4 }]} accessibilityRole="header">{userData?.userDisplayName || 'EcoActioner'}</Text>
          <TouchableOpacity
            onPress={() => setTitlesOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Eco-Title: ${tier.title}. Show all titles`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, backgroundColor: colors.white, borderRadius: 22, paddingHorizontal: 16 }}
          >
            <TierBadge tierKey={tier.key} size={18} />
            <Text style={type.label}>{tier.title}</Text>
            <Text style={[type.bodyMuted, { fontFamily: fonts.medium }]}>· all titles</Text>
            <Icon name="forward" size={16} />
          </TouchableOpacity>
          <View style={{ alignSelf: 'stretch', marginTop: 4 }}>
            <ProgressBar value={getTierProgress(score)} height={10} label={nextTier ? `${Math.round(getTierProgress(score) * 100)} percent of the way to ${nextTier.title}` : 'Top title reached'} />
            <Text style={[type.small, { color: colors.ink, textAlign: 'center', marginTop: 6 }]}>{nextTier ? `${nextTier.min - score} pts to ${nextTier.title}` : 'You hold the top title'}</Text>
          </View>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[[score, 'Points'], [userData?.questsCompletedCount || 0, 'Actions'], [userData?.rerollTokens || 0, 'Swaps left']].map(([v, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: colors.white, borderRadius: 20, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.line }} accessible accessibilityLabel={`${l}: ${v}`}>
                <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink }}>{v}</Text>
                <Text style={[type.small, { fontFamily: fonts.bold }]}>{l}</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: colors.white, borderRadius: 26, padding: 18, borderWidth: 1.5, borderColor: colors.line, gap: 12 }}>
            <View>
              <Text style={type.h3}>Action domains</Text>
              <Text style={[type.bodyMuted, { marginTop: 3 }]}>Your quests lean towards these areas.</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CLIMATE_TAGS.map(tag => <Chip key={tag} label={tag} role="checkbox" selected={interests.includes(tag)} onPress={() => toggleTag(tag)} />)}
            </View>
            <Button label="Save changes" onPress={savePreferences} loading={savingPrefs} disabled={!prefsChanged} style={{ minHeight: 50 }} />
          </View>

          <TouchableOpacity
            onPress={logout}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, backgroundColor: colors.white, borderRadius: 22, paddingHorizontal: 18, borderWidth: 1.5, borderColor: colors.line }}
          >
            <Icon name="logout" size={22} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ECO-TITLES SHEET */}
      <Sheet visible={titlesOpen} onClose={() => setTitlesOpen(false)} labelledBy="Eco-Titles">
        <Text style={[type.h1, { fontSize: 28 }]} accessibilityRole="header">Eco-Titles</Text>
        <Text style={type.bodyMuted}>Complete quests to earn points and move up. Each title has its own shape, so you can spot it anywhere in the app.</Text>
        <View style={{ gap: 8, marginTop: 4 }}>
          {[...ECO_TIERS].reverse().map(t => {
            const current = t.key === tier.key;
            const unlocked = score >= t.min;
            return (
              <View key={t.key}
                accessible
                accessibilityLabel={`${t.title}, ${t.min} points, ${current ? 'your current title' : unlocked ? 'unlocked' : 'locked'}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: current ? colors.mint : colors.ground, borderWidth: 2, borderColor: current ? colors.ink : 'transparent' }}>
                <TierBadge tierKey={t.key} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>{t.title}</Text>
                  <Text style={[type.small, { marginTop: 1 }]}>{t.min} pts</Text>
                </View>
                {current ? (
                  <View style={{ backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 }}><Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.white }}>You're here</Text></View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name={unlocked ? 'check' : 'lock'} size={16} color={unlocked ? colors.ink : colors.muted} strokeWidth={unlocked ? 2.6 : 2} />
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: unlocked ? colors.ink : colors.muted }}>{unlocked ? 'Unlocked' : 'Locked'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <Button label="Close" variant="outline" onPress={() => setTitlesOpen(false)} style={{ borderWidth: 0 }} />
      </Sheet>

      {/* AVATAR PICKER SHEET */}
      <Sheet visible={avatarOpen} onClose={() => setAvatarOpen(false)} labelledBy="Choose your critter">
        <Text style={[type.h1, { fontSize: 28 }]} accessibilityRole="header">Choose your critter</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} accessibilityRole="radiogroup">
          {AVATARS.map(a => {
            const on = a.key === (userData?.avatar || null);
            return (
              <TouchableOpacity key={a.key} onPress={() => chooseAvatar(a.key)}
                accessibilityRole="radio" accessibilityLabel={`${a.name} avatar`} accessibilityState={{ selected: on }}
                style={{ width: '22.5%', height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.mint : colors.ground, borderWidth: on ? 3 : 2, borderColor: on ? colors.ink : 'transparent' }}>
                <a.Component size={56} />
              </TouchableOpacity>
            );
          })}
        </View>
        <Button label="Close" variant="outline" onPress={() => setAvatarOpen(false)} style={{ borderWidth: 0 }} />
      </Sheet>
    </View>
  );
}
