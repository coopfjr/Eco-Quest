// App.js
import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import AuthStack from './src/AuthStack.js';
import AppTabs from './src/AppTabs.js';
import LoadingScreen from './src/screens/LoadingScreen.js';
import { auth } from './src/firebaseConfig.js';
import { seedQuests } from './src/firestoreUtils.js';
import { syncOfflinePosts } from './src/offlineSyncUtils.js';
import { colors } from './src/ui/theme';

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ground } };

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [fontsLoaded, fontError] = useFonts({
    Display: BricolageGrotesque_800ExtraBold,
    Body: DMSans_400Regular,
    BodyMedium: DMSans_500Medium,
    BodyBold: DMSans_700Bold,
  });

  useEffect(() => {
    seedQuests();
    syncOfflinePosts();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (initializing) setTimeout(() => setInitializing(false), 900);
    });
    // Retry queued offline completions whenever the app comes back to the foreground.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncOfflinePosts();
    });
    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [initializing]);

  const fontsReady = fontsLoaded || !!fontError;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {initializing || !fontsReady ? (
        <LoadingScreen />
      ) : (
        <NavigationContainer theme={navTheme}>
          {user ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}
