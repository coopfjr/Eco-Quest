// src/screens/LoadingScreen.js
// Shown before custom fonts load, so it uses the system font.
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Earth } from '../ui/Critters';
import { colors } from '../ui/theme';

export default function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <View style={{ position: 'absolute', left: -80, top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.mintDeep }} />
      <View style={{ position: 'absolute', right: -90, bottom: -70, width: 300, height: 300, borderRadius: 150, backgroundColor: colors.pistachio }} />
      <View accessible accessibilityRole="image" accessibilityLabel="Eco Quest logo, a smiling Earth"><Earth size={190} /></View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 52, fontWeight: '900', color: colors.ink, letterSpacing: -1.5, textAlign: 'center', lineHeight: 52 }}>ECO{'\n'}QUEST</Text>
        <Text style={{ fontSize: 17, color: colors.ink, marginTop: 12 }}>Small actions, every day.</Text>
      </View>
      <ActivityIndicator color={colors.ink} style={{ position: 'absolute', bottom: 72 }} accessibilityLabel="Loading" />
    </View>
  );
}
