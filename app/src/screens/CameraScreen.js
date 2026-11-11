// src/screens/CameraScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { completeDailyQuest } from '../dailyQuestUtils';
import { queueOfflinePost } from '../offlineSyncUtils';
import { getPublicName } from '../profileUtils';
import { prepareImageForUpload } from '../imageUtils';
import { getScore } from './QuestDetailScreen';
import { DIFFICULTY_CRITTER } from '../ui/Critters';
import Icon from '../ui/Icons';
import { Button, IconButton, Notice, Field, inputStyle } from '../ui/components';
import { colors, difficultyTheme, fonts, type } from '../ui/theme';

const CAPTION_MAX = 120;
const DARK = '#16211B';

export default function CameraScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { quest, caption: initialCaption } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [caption, setCaption] = useState(initialCaption || '');
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);
  const Critter = DIFFICULTY_CRITTER[quest?.difficulty] || DIFFICULTY_CRITTER.Medium;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // Re-encode every image before preview/upload: drops EXIF/GPS metadata and shrinks size.
  const applyImage = async (uri, width) => {
    setProcessing(true);
    try {
      const prepared = await prepareImageForUpload(uri, width);
      setPhoto(prepared.uri);
      setBase64Image(prepared.base64);
    } catch (e) {
      Alert.alert('Error', 'Could not process the photo.');
    } finally {
      setProcessing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || processing) return;
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
      await applyImage(shot.uri, shot.width);
    } catch (e) {
      Alert.alert('Error', 'Could not take the photo.');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is needed to upload a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, exif: false });
    if (!result.canceled && result.assets?.length) await applyImage(result.assets[0].uri, result.assets[0].width);
  };

  const handlePost = async () => {
    if (!base64Image || uploading) return;
    const user = auth.currentUser;
    if (!user) return;
    setUploading(true);
    const prevScore = await getScore(user.uid);
    const postPayload = {
      userId: user.uid,
      userDisplayName: await getPublicName(user.uid),
      dareTitle: quest?.title || 'Daily Quest',
      dareDescription: quest?.description || '',
      userCaption: caption.trim(),
      dareDifficulty: quest?.difficulty || 'Medium',
      imageURL: base64Image,
      likes: 0,
      pointsAwarded: quest?.points || 0,
    };
    try {
      await addDoc(collection(db, 'CommunityPosts'), { ...postPayload, timestamp: serverTimestamp() });
      if (quest) await completeDailyQuest(quest.questId, quest.points, quest.assignedDate);
      navigation.replace('Done', { quest, prevScore, shared: true, offline: false });
    } catch (e) {
      await queueOfflinePost(postPayload, quest ? { questId: quest.questId, points: quest.points, assignedDate: quest.assignedDate } : null);
      navigation.replace('Done', { quest, prevScore, shared: true, offline: true });
    } finally {
      setUploading(false);
    }
  };

  // ---- Preview + caption step (light) ----
  if (photo) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton name="back" label="Retake photo" onPress={() => { setPhoto(null); setBase64Image(null); }} />
            <Text style={type.h2} accessibilityRole="header">Add a caption</Text>
            <View style={{ width: 48 }} />
          </View>
          <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1, borderRadius: 28, backgroundColor: colors.sage }} accessibilityLabel="Your photo" />
          <Field label="Caption" optional>
            <TextInput
              style={[inputStyle, { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }]}
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
          <Notice icon="lock">Shared publicly to the community feed. Location data has been removed.</Notice>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Button label="Retake" variant="outline" onPress={() => { setPhoto(null); setBase64Image(null); }} disabled={uploading} style={{ flex: 1, paddingHorizontal: 10 }} />
            <Button label="Share & complete" iconRight="arrow" onPress={handlePost} loading={uploading} style={{ flex: 2, paddingHorizontal: 12 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---- Capture step (dark) ----
  return (
    <View style={{ flex: 1, backgroundColor: DARK, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton name="close" label="Close camera" onPress={() => navigation.goBack()} bg="rgba(255,255,255,0.14)" color={colors.white} />
        {quest && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: (difficultyTheme[quest.difficulty] || difficultyTheme.Medium).bg, borderRadius: 20, paddingVertical: 4, paddingLeft: 6, paddingRight: 14 }}>
            <Critter size={28} />
            <Text style={type.label} numberOfLines={1}>{quest.title}</Text>
          </View>
        )}
        <View style={{ width: 48 }} />
      </View>

      <View style={{ flex: 1, marginTop: 20, marginBottom: 24, borderRadius: 32, overflow: 'hidden', backgroundColor: '#2C3B33', justifyContent: 'center', alignItems: 'center' }}>
        {permission?.granted ? (
          <CameraView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} ref={cameraRef} facing="back" />
        ) : (
          <View style={{ alignItems: 'center', gap: 12, padding: 24 }}>
            <Text style={{ fontFamily: fonts.body, color: '#C9D3CC', fontSize: 15, textAlign: 'center' }}>Camera access is needed to take a photo. You can still upload one from your library.</Text>
            <Button label="Allow camera" variant="outline" onPress={requestPermission} />
          </View>
        )}
        {processing && <ActivityIndicator size="large" color={colors.white} />}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: 'rgba(27,38,32,0.85)', borderRadius: 18, padding: 12, flexDirection: 'row', gap: 10 }}>
          <Icon name="lock" size={18} color={colors.mint} />
          <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.white }}>
            Posts are public. Avoid faces, house numbers and licence plates. Location data is removed from photos.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <IconButton name="image" label="Upload from your photos" onPress={pickFromGallery} bg="rgba(255,255,255,0.14)" color={colors.white} size={60} iconSize={26} />
        <TouchableOpacity
          onPress={takePicture}
          disabled={!permission?.granted || processing}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={{ width: 86, height: 86, borderRadius: 43, borderWidth: 5, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center', opacity: permission?.granted ? 1 : 0.4 }}
        >
          <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.white }} />
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}
