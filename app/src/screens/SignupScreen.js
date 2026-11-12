// src/screens/SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { assignDailyQuests } from '../dailyQuestUtils';
import { Drop } from '../ui/Critters';
import { Button, Field, IconButton, TextLink, inputStyle } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please fill in both fields.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'Users', user.uid), {
        email: user.email,
        score: 0,
        freeSwaps: 2,
        rerollTokens: 0,
        questsCompletedCount: 0,
        createdAt: new Date().toISOString(),
        dailyQuests: [],
        onboardingComplete: false,
      });
      await assignDailyQuests();
    } catch (error) {
      Alert.alert('Sign up failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.pistachio, borderBottomLeftRadius: 44, borderBottomRightRadius: 44, paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 28, minHeight: 300, justifyContent: 'flex-end' }}>
          <IconButton name="back" label="Back to log in" onPress={() => navigation.navigate('Login')} style={{ position: 'absolute', left: 14, top: insets.top + 8 }} />
          <View style={{ position: 'absolute', right: 22, top: insets.top + 40 }}><Drop size={116} /></View>
          <Text style={[type.eyebrow, { fontSize: 14, marginBottom: 6 }]}>START SMALL</Text>
          <Text style={type.hero} accessibilityRole="header">JOIN{'\n'}THE QUEST</Text>
        </View>

        <View style={{ padding: 24, gap: 16 }}>
          <Field label="Email">
            <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="you@gmail.com" placeholderTextColor={colors.muted}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" accessibilityLabel="Email" />
          </Field>
          <Field label="Password">
            <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor={colors.muted}
              secureTextEntry autoComplete="password-new" textContentType="newPassword" accessibilityLabel="Password" />
          </Field>
          <Text style={type.small}>Your email stays private. You'll pick a public handle in the next step.</Text>
          <Button label="Create account" onPress={handleSignup} loading={loading} style={{ marginTop: 4 }} />
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={type.bodyMuted}>Already have one? </Text>
          <TextLink label="Log in" onPress={() => navigation.navigate('Login')} textStyle={{ fontSize: 15 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
