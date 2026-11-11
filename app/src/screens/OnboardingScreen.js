// src/screens/OnboardingScreen.js
// Four steps: welcome → critter + handle → how it works → action domains.
// Explicit Next/Back buttons instead of swiping, so every step is reachable by tap
// and by screen reader.
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { Sprout, Drop, Tree, Earth, AVATARS, Avatar, DEFAULT_AVATAR } from '../ui/Critters';
import { TierBadge } from '../ui/Badges';
import Icon from '../ui/Icons';
import { Button, Chip, Field, IconButton, TextLink, inputStyle } from '../ui/components';
import { colors, fonts, type } from '../ui/theme';

export const CLIMATE_TAGS = ['Energy', 'Mobility', 'Food', 'Digital', 'Home', 'Consumption', 'Fitness'];
const STEP_BG = [colors.mint, colors.pistachio, colors.seafoam, colors.sage];

function Dots({ step }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessible={false}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{ width: i === step ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: colors.ink, opacity: i === step ? 1 : 0.25 }} />
      ))}
    </View>
  );
}

function HowRow({ art, title, text }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 22, padding: 14 }}>
      <View style={{ width: 64, alignItems: 'center' }}>{art}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>{title}</Text>
        <Text style={[type.bodyMuted, { marginTop: 3 }]}>{text}</Text>
      </View>
    </View>
  );
}

const circleIcon = (name) => (
  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name={name} size={24} />
  </View>
);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag) => {
    setSelectedInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const next = () => {
    if (step === 1 && !displayName.trim()) {
      Alert.alert('Pick a handle', 'Please enter a public username to continue.');
      return;
    }
    setStep(s => Math.min(3, s + 1));
  };
  const back = () => (step === 0 ? signOut(auth).catch(() => {}) : setStep(s => s - 1));

  const finish = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setStep(1);
      Alert.alert('Pick a handle', 'Please enter a public username.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'Users'), where('userDisplayName', '==', trimmedName)));
      if (snap.docs.some(d => d.id !== user.uid)) {
        setLoading(false);
        setStep(1);
        Alert.alert('Handle taken', 'That handle is already claimed. Please choose another.');
        return;
      }
      await updateDoc(doc(db, 'Users', user.uid), {
        onboardingComplete: true,
        userDisplayName: trimmedName,
        avatar,
        interests: selectedInterests,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not save your choices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: STEP_BG[step] }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {step === 0
            ? <TextLink label="Back to log in" onPress={back} textStyle={{ fontSize: 15 }} />
            : <IconButton name="back" label="Back" onPress={back} />}
          <Text style={type.label} accessibilityLabel={`Step ${step + 1} of 4`}>{step + 1} of 4</Text>
        </View>

        {step === 0 && (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
              <View style={{ width: 290, height: 290, borderRadius: 145, backgroundColor: colors.mintDeep, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 54 }}
                accessible accessibilityRole="image" accessibilityLabel="Three critters: a sprout, a water drop and a tree">
                <Drop size={92} /><Sprout size={128} /><Tree size={92} />
              </View>
            </View>
            <Text style={type.hero} accessibilityRole="header">SMALL{'\n'}ACTIONS.{'\n'}EVERY DAY.</Text>
            <Text style={[type.body, { fontSize: 16, lineHeight: 23, marginTop: 16 }]}>
              Climate news can feel too big to act on. Eco Quest gives you three small actions a day that fit around your life, and shows you that other people are doing them too.
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={{ flex: 1 }}>
            <Text style={[type.hero, { fontSize: 42, lineHeight: 41, marginTop: 24 }]} accessibilityRole="header">PICK YOUR{'\n'}LOOK + NAME</Text>
            <Text style={[type.body, { marginTop: 8 }]}>This is how people see you on the feed and in rankings. Your email is never shown.</Text>
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <Avatar avatarKey={avatar} size={112} bg={colors.white} />
            </View>
            <Text style={[type.label, { marginBottom: 10 }]}>Choose a critter</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {AVATARS.map(a => {
                const on = a.key === avatar;
                return (
                  <TouchableOpacity
                    key={a.key}
                    onPress={() => setAvatar(a.key)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${a.name} avatar`}
                    accessibilityState={{ selected: on }}
                    style={{ width: '22.5%', height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.white : 'rgba(255,255,255,0.55)', borderWidth: on ? 3 : 2, borderColor: on ? colors.ink : 'transparent' }}
                  >
                    <a.Component size={52} />
                    {on && (
                      <View style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ marginTop: 22 }}>
              <Field label="Public handle" hint="Up to 20 characters. Must be unique.">
                <TextInput style={inputStyle} value={displayName} onChangeText={setDisplayName} maxLength={20} autoCapitalize="none"
                  placeholder="e.g. cooper" placeholderTextColor={colors.muted} accessibilityLabel="Public handle" returnKeyType="done" />
              </Field>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ flex: 1 }}>
            <Text style={[type.hero, { fontSize: 42, lineHeight: 41, marginTop: 24, marginBottom: 20 }]} accessibilityRole="header">HOW IT{'\n'}WORKS</Text>
            <View style={{ gap: 12 }}>
              <HowRow art={<View style={{ flexDirection: 'row', alignItems: 'flex-end', marginLeft: -6 }}><Sprout size={30} /><Drop size={30} /><Tree size={30} /></View>}
                title="Three quests a day" text="One Easy, one Medium, one Hard. A sprout, a drop or a tree tells you which is which." />
              <HowRow art={circleIcon('swap')} title="Swap if it doesn't fit" text="You get 2 free swaps a day. Pick an easier or harder quest instead." />
              <HowRow art={circleIcon('camera')} title="Share if you want to" text="Add a photo or caption, or complete privately. Your choice every time." />
              <HowRow art={<View style={{ flexDirection: 'row', gap: 3 }}><TierBadge tierKey="seedling" size={16} /><TierBadge tierKey="sapling" size={16} /><TierBadge tierKey="river" size={16} /></View>}
                title="Earn titles, cheer others" text="Points move you from Seedling to Global Guardian. Send awards to encourage people." />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ flex: 1 }}>
            <Text style={[type.hero, { fontSize: 42, lineHeight: 41, marginTop: 24 }]} accessibilityRole="header">WHAT DO YOU{'\n'}CARE ABOUT?</Text>
            <Text style={[type.body, { marginTop: 8, marginBottom: 24 }]}>Pick the areas you'd like your quests to focus on. You can change this any time in your profile.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CLIMATE_TAGS.map(tag => (
                <Chip key={tag} label={tag} role="checkbox" selected={selectedInterests.includes(tag)} onPress={() => toggleTag(tag)} />
              ))}
            </View>
            <Text style={[type.label, { marginTop: 16 }]}>{selectedInterests.length} selected</Text>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 170 }}><Earth size={150} /></View>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <Dots step={step} />
          {step < 3
            ? <Button label="Next" iconRight="arrow" onPress={next} style={{ paddingHorizontal: 28 }} />
            : <Button label="Start quests" iconRight="arrow" onPress={finish} loading={loading} style={{ paddingHorizontal: 26 }} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
