// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Earth } from '../ui/Critters';
import { Button, Field, TextLink, inputStyle } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      Alert.alert('Log in failed', 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Enter your email', 'Type the email you signed up with, then tap "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
    } catch (e) {
      // Same message either way, so the app doesn't reveal which emails have accounts.
    }
    Alert.alert('Check your inbox', `If ${trimmed} has an Eco Quest account, we've sent a link to reset the password.`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.mint, borderBottomLeftRadius: 44, borderBottomRightRadius: 44, paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 28, minHeight: 300, justifyContent: 'flex-end' }}>
          <View style={{ position: 'absolute', right: 22, top: insets.top + 36 }} accessible accessibilityRole="image" accessibilityLabel="Eco Quest logo">
            <Earth size={124} />
          </View>
          <Text style={[type.eyebrow, { fontSize: 14, marginBottom: 6 }]}>ECO QUEST</Text>
          <Text style={type.hero} accessibilityRole="header">WELCOME{'\n'}BACK</Text>
        </View>

        <View style={{ padding: 24, gap: 16 }}>
          <Field label="Email">
            <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="you@school.ca" placeholderTextColor={colors.muted}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" accessibilityLabel="Email" />
          </Field>
          <Field label="Password">
            <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={colors.muted}
              secureTextEntry autoComplete="password" textContentType="password" accessibilityLabel="Password" onSubmitEditing={handleLogin} />
          </Field>
          <TextLink label="Forgot password?" onPress={handleForgot} style={{ alignSelf: 'flex-end', marginTop: -6 }} textStyle={{ fontSize: 14 }} />
          <Button label="Log in" onPress={handleLogin} loading={loading} />
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={type.bodyMuted}>New here? </Text>
          <TextLink label="Create an account" onPress={() => navigation.navigate('Signup')} textStyle={{ fontSize: 15 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
