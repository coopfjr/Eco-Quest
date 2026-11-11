// src/screens/QuestDetailScreen.js
// Everything optional (sharing choice, caption, photo) comes BEFORE points are
// credited, so nothing is left to do after the reward (post-completion error).
import React, { useState } from 'react';
import { View, Text, Alert, TextInput, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { completeDailyQuest } from '../dailyQuestUtils';
import { queueOfflinePost } from '../offlineSyncUtils';
import { getPublicName } from '../profileUtils';
import { DIFFICULTY_CRITTER } from '../ui/Critters';
import { DifficultyIcon } from '../ui/Badges';
import { Button, IconButton, Field, inputStyle } from '../ui/components';
import { colors, difficultyTheme, fonts, type } from '../ui/theme';

const CAPTION_MAX = 120;

export const getScore = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'Users', uid));
    return snap.exists() ? snap.data().score || 0 : 0;
  } catch (e) {
    return 0;
  }
};

export default function QuestDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { quest } = route.params;
  const theme = difficultyTheme[quest.difficulty] || difficultyTheme.Medium;
  const Critter = DIFFICULTY_CRITTER[quest.difficulty] || DIFFICULTY_CRITTER.Medium;
  const [caption, setCaption] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const finalizeCompletion = async () => {
    if (submitting) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }
    setSubmitting(true);
    const prevScore = await getScore(user.uid);

    let postPayload = null;
    if (shareToFeed) {
      postPayload = {
        userId: user.uid,
        userDisplayName: await getPublicName(user.uid),
        dareTitle: quest?.title || 'Daily Quest',
        dareDescription: quest?.description || '',
        userCaption: caption.trim(),
        dareDifficulty: quest?.difficulty || 'Medium',
        imageURL: null,
        likes: 0,
        pointsAwarded: quest?.points || 0,
      };
    }

    try {
      if (postPayload) await addDoc(collection(db, 'CommunityPosts'), { ...postPayload, timestamp: serverTimestamp() });
      const success = await completeDailyQuest(quest.questId, quest.points, quest.assignedDate);
      if (!success) {
        Alert.alert('Already done', 'This quest was already completed.');
        navigation.goBack();
        return;
      }
      navigation.replace('Done', { quest, prevScore, shared: shareToFeed, offline: false });
    } catch (error) {
      await queueOfflinePost(postPayload, { questId: quest.questId, points: quest.points, assignedDate: quest.assignedDate });
      navigation.replace('Done', { quest, prevScore, shared: shareToFeed, offline: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: theme.bg, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 26 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton name="back" label="Back to quests" onPress={() => navigation.goBack()} />
            <View style={{ backgroundColor: colors.white, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 }}>
              <Text style={type.label}>+{quest.points} pts</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginVertical: 6 }}><Critter size={160} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <DifficultyIcon level={quest.difficulty} size={16} />
            <Text style={[type.eyebrow, { fontSize: 13 }]}>{theme.label} QUEST</Text>
          </View>
          <Text style={[type.hero, { fontSize: 42, lineHeight: 42, marginTop: 6, marginBottom: 8 }]} accessibilityRole="header">{quest.title.toUpperCase()}</Text>
          <Text style={[type.body, { fontSize: 16, lineHeight: 23 }]}>{quest.description}</Text>
        </View>

        <View style={{ padding: 20, gap: 14 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.ink }}>Share to community feed</Text>
                <Text style={[type.small, { marginTop: 2 }]}>{shareToFeed ? 'Visible to everyone on Eco Quest.' : 'Only you will see this completion.'}</Text>
              </View>
              <Switch
                value={shareToFeed}
                onValueChange={setShareToFeed}
                trackColor={{ false: '#B8C4BC', true: colors.ink }}
                thumbColor={colors.white}
                ios_backgroundColor="#B8C4BC"
                accessibilityLabel="Share this completion to the public community feed"
              />
            </View>
            {shareToFeed && (
              <Field label="Caption" optional>
                <TextInput
                  style={[inputStyle, { minHeight: 76, paddingTop: 12, backgroundColor: colors.ground, textAlignVertical: 'top' }]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="How did it go?"
                  placeholderTextColor={colors.muted}
                  maxLength={CAPTION_MAX}
                  multiline
                  accessibilityLabel="Optional caption for your post"
                />
                <Text style={[type.small, { textAlign: 'right' }]}>{caption.length}/{CAPTION_MAX}</Text>
              </Field>
            )}
          </View>

          <Button
            label="Add a photo"
            icon="camera"
            variant="outline"
            onPress={() => navigation.navigate('CameraScreen', { quest, caption })}
            disabled={submitting}
            accessibilityLabel="Add a photo. Photos are shared publicly."
          />
          <Button
            label={shareToFeed ? 'Complete & share' : 'Complete privately'}
            icon="check"
            onPress={finalizeCompletion}
            loading={submitting}
          />
          <Text style={[type.small, { textAlign: 'center' }]}>
            {shareToFeed ? 'Turn sharing off to complete privately.' : 'Points are still added to your total.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
