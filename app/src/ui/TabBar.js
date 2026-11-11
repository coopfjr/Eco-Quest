// src/ui/TabBar.js
// Floating pill tab bar. Inactive tabs show only an icon; the current tab expands
// into an icon + label pill so users always see which screen they're on.
import React from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icons';
import { colors, fonts } from './theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const META = {
  QuestHub: { label: 'Quests', icon: 'leaf' },
  Community: { label: 'Community', icon: 'people' },
  Profile: { label: 'Profile', icon: 'user' },
};

export const TAB_BAR_SPACE = 110; // bottom padding screens should leave for the floating bar

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) + 8, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink, borderRadius: 34, height: 68, paddingHorizontal: 8 }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = META[route.name] || { label: route.name, icon: 'leaf' };
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              // Animate the label pill growing on the newly selected tab.
              LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
              navigation.navigate(route.name);
            }
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              activeOpacity={0.8}
              style={focused
                ? { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 20, borderRadius: 26, backgroundColor: colors.mint }
                : { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={meta.icon} size={focused ? 22 : 24} color={focused ? colors.ink : colors.onInkMuted} />
              {focused ? <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }} numberOfLines={1}>{meta.label}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
