// src/ecoTips.js
// Daily Eco-Tips. The tip changes at local midnight (one tip per calendar day).
// Tips describe actions only. They make no quantified impact claims, because the app
// cannot verify impact (design document 2.3.7).

const ECO_TIPS = [
  'Unplug chargers once your devices are full. Idle chargers still draw a little power.',
  'Wash clothes in cold water when you can. Most of a warm wash goes into heating the water.',
  'Keep a reusable cup in your bag so the easy choice is already with you.',
  'Plan one meal this week around what is already in your fridge.',
  'Walk or cycle one short trip you would normally drive.',
  'Turn off ceiling lights when daylight is enough to work by.',
  'Set your laptop to sleep after a few idle minutes instead of leaving the screen on.',
  'Take a shorter shower today and notice how little you miss.',
  'Before buying something new, check if you can borrow, repair or buy it second-hand.',
  'Sort one bin properly today. Check your local rules for what actually gets recycled.',
  'Fill a reusable bottle before you leave instead of buying water on the go.',
  'Air-dry one load of laundry instead of using the dryer.',
];

// dateStr is YYYY-MM-DD in local time (from getTodayDate).
export const getDailyTip = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return ECO_TIPS[dayNumber % ECO_TIPS.length];
};

export default ECO_TIPS;
