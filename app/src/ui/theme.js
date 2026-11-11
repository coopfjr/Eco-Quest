// src/ui/theme.js
// Eco Quest design tokens (pastel greens). All text colours pass WCAG AA on every surface.

export const colors = {
  ink: '#1B2620',          // primary text, primary buttons, "you" highlights (14:1 on ground)
  muted: '#4A554F',        // secondary text (≥5.4:1 on every pastel)
  ground: '#F3F7F1',       // app background
  white: '#FFFFFF',
  line: '#E2E7E1',         // hairline borders
  lineStrong: '#B8C4BC',   // input borders
  onInkMuted: '#C9D3CC',   // inactive icons on the dark tab bar
  mint: '#D7F0DF',         // Easy, success, active tab
  mintDeep: '#C3E7CF',
  pistachio: '#E8F1C8',    // Medium
  seafoam: '#CFEAE3',      // Hard
  sage: '#DCE9D3',         // progress cards
  cream: '#EEF5D6',        // tips, notices
  blush: '#F2A7A0',
  scrim: 'rgba(27,38,32,0.5)',
};

export const difficultyTheme = {
  Easy: { bg: colors.mint, label: 'EASY' },
  Medium: { bg: colors.pistachio, label: 'MEDIUM' },
  Hard: { bg: colors.seafoam, label: 'HARD' },
};

// Font family keys registered in App.js with expo-font.
export const fonts = {
  display: 'Display',     // Bricolage Grotesque ExtraBold
  body: 'Body',           // DM Sans Regular
  medium: 'BodyMedium',   // DM Sans Medium
  bold: 'BodyBold',       // DM Sans Bold
};

export const radius = { sm: 16, md: 22, lg: 28, pill: 999 };

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 46, lineHeight: 44, letterSpacing: -1, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  h3: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyMuted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
};

export const MIN_TOUCH = 44;
