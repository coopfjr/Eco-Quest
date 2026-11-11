// src/AppTabs.js
// Root of the signed-in app: onboarding gate, the three tabs, and full-screen quest flow.
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { db, auth } from './firebaseConfig.js';
import { doc, onSnapshot } from 'firebase/firestore';

import TabBar from './ui/TabBar';
import { colors } from './ui/theme';
import QuestHubScreen from './screens/QuestHubScreen';
import QuestDetailScreen from './screens/QuestDetailScreen';
import CameraScreen from './screens/CameraScreen';
import DoneScreen from './screens/DoneScreen';
import CommunityScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="QuestHub"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}
    >
      <Tab.Screen name="QuestHub" component={QuestHubScreen} options={{ title: 'Quests' }} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppTabs() {
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'Users', user.uid), (docSnap) => {
      setOnboardingStatus(docSnap.exists() ? docSnap.data().onboardingComplete === true : false);
    }, () => setOnboardingStatus(true));
    return () => unsubscribe();
  }, []);

  if (onboardingStatus === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ground }}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (onboardingStatus === false) return <OnboardingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Done" component={DoneScreen} options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
