// src/ui/Badges.js
// Eco-Title badges are flat geometric shapes (circle → star). Gift awards are line
// glyphs on round coins. The two never share a shape, so a title can't be mistaken
// for an award.
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Icon from './Icons';
import { colors } from './theme';

const TIER_SHAPES = {
  seedling: <Circle cx={12} cy={12} r={10} fill="#9DB89A" />,
  sapling: <Rect x={2} y={2} width={20} height={20} rx={6} fill="#4FA772" />,
  river: <Path d="M12 1.5l10.5 10.5L12 22.5 1.5 12z" fill="#3E9C88" />,
  forest: <Path d="M12 1.5l9.5 5.5v10L12 22.5 2.5 17V7z" fill="#2F7D55" />,
  guardian: <Path d="M12 1.5l3.1 6.4 7 1-5.1 4.9 1.2 7L12 17.5l-6.2 3.3 1.2-7L1.9 8.9l7-1z" fill="#6E8F2E" />,
};

export function TierBadge({ tierKey, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {TIER_SHAPES[tierKey] || TIER_SHAPES.seedling}
    </Svg>
  );
}

const DIFF_SHAPES = {
  Easy: <Path d="M4 20C3 10 9 4 20 4c1 10-5 16-16 16z" fill="#4FA772" />,
  Medium: <Path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13z" fill="#3E9C88" />,
  Hard: (
    <>
      <Path d="M10.5 16h3v6h-3z" fill="#9C7756" />
      <Circle cx={12} cy={9} r={7} fill="#2F7D55" />
      <Circle cx={7} cy={13} r={4.5} fill="#2F7D55" />
      <Circle cx={17} cy={13} r={4.5} fill="#2F7D55" />
    </>
  ),
};

export function DifficultyIcon({ level, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {DIFF_SHAPES[level] || DIFF_SHAPES.Medium}
    </Svg>
  );
}

const AWARD_GLYPHS = {
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7',
  tree: 'M12 21v-6M7 15a5 5 0 0 1 1-9.5A4.5 4.5 0 0 1 16 5a5 5 0 0 1 1 10z',
  water: 'M12 3c-3.5 5-6 8-6 11a6 6 0 0 0 12 0c0-3-2.5-6-6-11z',
  planet: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
};
const AWARD_BG = { leaf: colors.mint, tree: colors.pistachio, water: colors.seafoam, planet: colors.sage };

export function AwardCoin({ awardId, size = 52 }) {
  const glyph = AWARD_GLYPHS[awardId];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: AWARD_BG[awardId] || colors.mint, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" accessible={false}>
        <Path d={glyph} fill="none" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export { Icon };
