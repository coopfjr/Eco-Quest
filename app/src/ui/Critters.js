// src/ui/Critters.js
// Eco Quest characters, drawn with react-native-svg.
// Easy = Sprout, Medium = Drop, Hard = Tree. Extra avatars: Leaf, Rain cloud, Acorn, Sun, Earth.
// Requires: npx expo install react-native-svg
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';
import { colors } from './theme';

const INK = colors.ink;
const stroke = { fill: 'none', stroke: INK, strokeWidth: 3, strokeLinecap: 'round' };

const Blush = ({ x1, x2, y }) => (
  <>
    <Ellipse cx={x1} cy={y} rx={4} ry={2.6} fill={colors.blush} opacity={0.85} />
    <Ellipse cx={x2} cy={y} rx={4} ry={2.6} fill={colors.blush} opacity={0.85} />
  </>
);

const HappyEyes = ({ x1, x2, y }) => (
  <Path d={`M${x1 - 4.5} ${y}q4.5-5 9 0M${x2 - 4.5} ${y}q4.5-5 9 0`} {...stroke} />
);

const Googly = ({ x1, x2, y, r = 7, dx = 1.5, dy = 1 }) => (
  <>
    <Circle cx={x1} cy={y} r={r} fill="#FFFFFF" />
    <Circle cx={x2} cy={y} r={r} fill="#FFFFFF" />
    <Circle cx={x1 + dx} cy={y + dy} r={r * 0.48} fill={INK} />
    <Circle cx={x2 + dx} cy={y + dy} r={r * 0.48} fill={INK} />
    <Circle cx={x1 + dx + 1.2} cy={y + dy - 1.3} r={1.1} fill="#FFFFFF" />
    <Circle cx={x2 + dx + 1.2} cy={y + dy - 1.3} r={1.1} fill="#FFFFFF" />
  </>
);

const Frame = ({ size, children }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}>
    {children}
  </Svg>
);

export const Sprout = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M40 30V17" stroke="#4FA772" strokeWidth={4} strokeLinecap="round" />
    <Path d="M40 20c-2-9-10-14-21-12 1 10 10 15 21 12z" fill="#6CC28A" />
    <Path d="M38 18c-5-3-10-6-15-7" fill="none" stroke="#4FA772" strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M40 17c2-9 10-14 21-12-1 10-10 15-21 12z" fill="#8FD3A6" />
    <Path d="M42 15c5-3 10-6 15-7" fill="none" stroke="#5FB47E" strokeWidth={1.6} strokeLinecap="round" />
    <Ellipse cx={40} cy={51} rx={27} ry={24} fill="#A8DDB5" />
    <Path d="M14 56c4 11 14 19 26 19s22-8 26-19c-6 7-15 11-26 11s-20-4-26-11z" fill="#8FD3A6" />
    <Ellipse cx={26} cy={40} rx={6} ry={3.4} fill="#FFFFFF" opacity={0.55} rotation={-32} origin="26, 40" />
    <HappyEyes x1={31} x2={49} y={49} />
    <Blush x1={25} x2={55} y={56} />
    <Path d="M33 57q7 7 14 0" {...stroke} />
  </Frame>
);

export const Drop = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M40 6C31 21 16 34 16 51a24 24 0 0 0 48 0C64 34 49 21 40 6z" fill="#A6DDD3" />
    <Path d="M62 46c1 3 2 3 2 5a24 24 0 0 1-24 24c-9 0-17-5-21-12 6 5 12 7 19 7 15 0 25-11 24-24z" fill="#86CDC1" />
    <Path d="M27 38c2-6 6-11 9-15" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
    <Googly x1={32} x2={49} y={48} r={7} />
    <Blush x1={26} x2={56} y={58} />
    <Path d="M35 59h11a5.5 5.5 0 0 1-11 0z" fill={INK} />
    <Path d="M38 62.5a3 2 0 0 0 5 0z" fill={colors.blush} />
  </Frame>
);

export const Tree = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M34 54h12v19a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#B9926E" />
    <Path d="M40 62l-6-5M40 66l5-4" stroke="#9C7756" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={24} cy={40} r={15} fill="#5FB47E" />
    <Circle cx={56} cy={40} r={15} fill="#5FB47E" />
    <Circle cx={40} cy={26} r={19} fill="#6CC28A" />
    <Circle cx={40} cy={44} r={18} fill="#6CC28A" />
    <Circle cx={24} cy={38} r={12} fill="#6CC28A" />
    <Circle cx={56} cy={38} r={12} fill="#6CC28A" />
    <Ellipse cx={31} cy={18} rx={6} ry={3.4} fill="#FFFFFF" opacity={0.45} rotation={-30} origin="31, 18" />
    <Path d="M28 31l8 3M52 31l-8 3" {...stroke} />
    <Circle cx={33} cy={39} r={3.4} fill={INK} />
    <Circle cx={47} cy={39} r={3.4} fill={INK} />
    <Blush x1={27} x2={53} y={46} />
    <Path d="M34 47q6 6 12 0z" fill={INK} />
  </Frame>
);

export const Earth = ({ size = 160 }) => (
  <Frame size={size}>
    <Circle cx={40} cy={40} r={34} fill="#A9DED0" />
    <Path d="M15 26c6-1 9 3 14 2s6-6 11-5 4 7 0 9-10 1-12 6-6 6-11 4c-3-5-4-11-2-16z" fill="#6DBE8C" />
    <Path d="M50 50c5-2 11 0 15 3-3 6-8 11-14 13-3-4-6-12-1-16z" fill="#6DBE8C" />
    <Path d="M53 15c4 1 8 4 10 8-4 1-8 0-10-3z" fill="#6DBE8C" />
    <Path d="M27 41q4-5 8 0M45 41q4-5 8 0" {...stroke} />
    <Path d="M31 50q9 8 18 0" {...stroke} />
    <Circle cx={25} cy={49} r={3} fill={colors.blush} opacity={0.8} />
    <Circle cx={55} cy={49} r={3} fill={colors.blush} opacity={0.8} />
  </Frame>
);

export const Leaf = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M14 66C10 38 30 14 66 12c2 34-20 56-52 54z" fill="#B9E2A0" />
    <Path d="M66 12c2 34-20 56-52 54 22-6 40-26 52-54z" fill="#9FD18A" />
    <Path d="M18 62C30 46 44 32 58 20" fill="none" stroke="#7FB86A" strokeWidth={2} strokeLinecap="round" />
    <Googly x1={34} x2={48} y={38} r={6} />
    <Path d="M36 49q5 5 10 0" {...stroke} />
  </Frame>
);

export const RainCloud = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M20 56a12 12 0 0 1-2-23.8A16 16 0 0 1 40 20a16 16 0 0 1 21 12.5A12 12 0 0 1 60 56z" fill="#CFE6DC" />
    <Path d="M18 50c4 4 8 6 14 6h28a12 12 0 0 0 11-8c-3 3-7 4-11 4H32c-6 0-10-1-14-2z" fill="#B5D9CB" />
    <Path d="M30 63l-3 7M42 63l-3 7M54 63l-3 7" stroke="#86CDC1" strokeWidth={3.2} strokeLinecap="round" />
    <HappyEyes x1={33} x2={49} y={40} />
    <Blush x1={27} x2={55} y={46} />
    <Path d="M37 46q4 4 8 0" {...stroke} />
  </Frame>
);

export const Acorn = ({ size = 76 }) => (
  <Frame size={size}>
    <Path d="M20 36h40v8c0 17-9 30-20 30S20 61 20 44z" fill="#D9C29A" />
    <Path d="M52 44c0 15-6 26-14 29 11-1 22-12 22-29v-8h-8z" fill="#C7AC80" />
    <Path d="M16 36c0-11 11-18 24-18s24 7 24 18z" fill="#9FBF7A" />
    <Path d="M40 18c0-5 2-9 6-11" fill="none" stroke="#7F9C5E" strokeWidth={3.5} strokeLinecap="round" />
    <Path d="M24 30h32M28 24h24" stroke="#86A866" strokeWidth={2} strokeLinecap="round" />
    <HappyEyes x1={32} x2={48} y={50} />
    <Blush x1={27} x2={53} y={57} />
    <Path d="M36 57q4 4 8 0" {...stroke} />
  </Frame>
);

export const Sun = ({ size = 76 }) => (
  <Frame size={size}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <Rect key={a} x={37.5} y={4} width={5} height={12} rx={2.5} fill="#D9E58A" rotation={a} origin="40, 40" />
    ))}
    <Circle cx={40} cy={40} r={21} fill="#E6EDA0" />
    <Path d="M58 44a21 21 0 0 1-36 10 21 21 0 0 0 36-10z" fill="#D9E58A" />
    <Googly x1={33} x2={47} y={38} r={5.5} />
    <Blush x1={28} x2={52} y={46} />
    <Path d="M34 46q6 6 12 0" {...stroke} />
  </Frame>
);

export const DIFFICULTY_CRITTER = { Easy: Sprout, Medium: Drop, Hard: Tree };

export const AVATARS = [
  { key: 'sprout', name: 'Sprout', Component: Sprout },
  { key: 'drop', name: 'Drop', Component: Drop },
  { key: 'tree', name: 'Tree', Component: Tree },
  { key: 'leaf', name: 'Leaf', Component: Leaf },
  { key: 'cloud', name: 'Rain cloud', Component: RainCloud },
  { key: 'acorn', name: 'Acorn', Component: Acorn },
  { key: 'sun', name: 'Sun', Component: Sun },
  { key: 'earth', name: 'Earth', Component: Earth },
];
export const DEFAULT_AVATAR = 'sprout';

// Users who haven't picked one get a stable avatar derived from their id.
export const avatarFor = (key, fallbackSeed = '') => {
  const found = AVATARS.find(a => a.key === key);
  if (found) return found;
  let h = 0;
  for (let i = 0; i < fallbackSeed.length; i++) h = (h * 31 + fallbackSeed.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
};

export function Avatar({ avatarKey, seed, size = 40, bg = colors.cream, style }) {
  const { Component } = avatarFor(avatarKey, seed);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      <Component size={size * 0.9} />
    </View>
  );
}
