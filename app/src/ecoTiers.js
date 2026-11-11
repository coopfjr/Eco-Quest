// src/ecoTiers.js
// Single source of truth for Eco-Titles. Each title is drawn as its own geometric
// badge (see ui/Badges.js), so titles are recognisable without relying on colour.

export const ECO_TIERS = [
  { key: 'seedling', min: 0, title: 'Seedling' },
  { key: 'sapling', min: 50, title: 'Sapling' },
  { key: 'river', min: 200, title: 'River Keeper' },
  { key: 'forest', min: 500, title: 'Forest Ranger' },
  { key: 'guardian', min: 1000, title: 'Global Guardian' },
];

export const getTierIndex = (score = 0) => {
  let idx = 0;
  ECO_TIERS.forEach((t, i) => { if (score >= t.min) idx = i; });
  return idx;
};

export const getTier = (score = 0) => ECO_TIERS[getTierIndex(score)];
export const getNextTier = (score = 0) => ECO_TIERS[getTierIndex(score) + 1] || null;

// { min, max } where max is null for the top tier. A score is in the tier when min <= score < max.
export const getTierBounds = (score = 0) => {
  const i = getTierIndex(score);
  return { min: ECO_TIERS[i].min, max: ECO_TIERS[i + 1] ? ECO_TIERS[i + 1].min : null };
};

// 0–1 progress from the current title to the next one (1 at the top title).
export const getTierProgress = (score = 0) => {
  const { min, max } = getTierBounds(score);
  if (max === null) return 1;
  return Math.max(0, Math.min(1, (score - min) / (max - min)));
};

export const getEcoTitle = (score = 0) => getTier(score).title;
