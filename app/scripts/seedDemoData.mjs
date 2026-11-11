// scripts/seedDemoData.mjs
// Fills Firebase with demo members, posts, likes, awards and follows for a presentation.
// Everything it creates is tagged `demo: true` (and demo logins use @example.com),
// so scripts/removeDemoData.mjs can remove it cleanly afterwards.
//
// Setup (once):
//   1. Firebase console → Project settings → Service accounts → Generate new private key.
//      Save it as scripts/serviceAccountKey.json  (it's in .gitignore, never commit it).
//   2. npm install --save-dev firebase-admin
//
// Run (the morning of the presentation, so "today" lines up):
//   node scripts/seedDemoData.mjs
//
// It also:
//   - writes the full quest library to the Quests collection
//   - creates the presenter account Cooper@gmail.com (handle "Cooper", password 123456)
//     with history, followers, today's quests (1 done) and posts of its own
//   - attaches illustrated photos from scripts/demo-images/ to the photo posts, including
//     three that show the privacy guidance (plate blurred, house number hidden, hands only)
//
// All demo members share the password below, so you can log in as one during the demo,
// e.g. demo+maya.k@example.com

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const DEMO_PASSWORD = 'EcoQuestDemo2026!';
const DAYS_OF_POSTS = 10;
const RANDOM_TEXT_POSTS = 22;

const PRESENTER = { email: 'Cooper@gmail.com', password: '123456', handle: 'Cooper', avatar: 'sprout', score: 165, interests: ['Energy', 'Mobility', 'Home'] };

const here = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(here, 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

// Load the app's quest library (src/initialQuests.js uses `export default`).
const questSrc = readFileSync(path.join(here, '..', 'src', 'initialQuests.js'), 'utf8').replace('export default initialQuests;', 'return initialQuests;');
const QUESTS = new Function(questSrc)();
const questById = Object.fromEntries(QUESTS.map(q => [q.id, q]));

const imageDir = path.join(here, 'demo-images');
const image = (name) => `data:image/jpeg;base64,${readFileSync(path.join(imageDir, `${name}.jpg`)).toString('base64')}`;

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Seeded random numbers, so every run produces the same demo world.
let seed = 351;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

// Scores spread across every Eco-Title, with a cluster around Sapling (50–199)
// so the "My Title" league looks busy for a new presenter account.
const MEMBERS = [
  { handle: 'priya.m', avatar: 'sun', score: 1120, interests: ['Energy', 'Digital'] },
  { handle: 'oscar', avatar: 'tree', score: 640, interests: ['Mobility', 'Fitness'] },
  { handle: 'kaito', avatar: 'drop', score: 510, interests: ['Home', 'Energy'] },
  { handle: 'zoe.b', avatar: 'sprout', score: 455, interests: ['Food', 'Consumption'] },
  { handle: 'maya.k', avatar: 'leaf', score: 340, interests: ['Mobility', 'Food'] },
  { handle: 'fatima', avatar: 'cloud', score: 290, interests: ['Consumption', 'Home'] },
  { handle: 'liam.c', avatar: 'acorn', score: 230, interests: ['Fitness', 'Mobility'] },
  { handle: 'hana', avatar: 'earth', score: 210, interests: ['Food'] },
  { handle: 'nadia.r', avatar: 'cloud', score: 195, interests: ['Energy', 'Home'] },
  { handle: 'leo.w', avatar: 'acorn', score: 182, interests: ['Digital', 'Consumption'] },
  { handle: 'sam.t', avatar: 'tree', score: 178, interests: ['Mobility'] },
  { handle: 'marco', avatar: 'sprout', score: 160, interests: ['Food', 'Home'] },
  { handle: 'jun.p', avatar: 'sun', score: 140, interests: ['Energy', 'Digital'] },
  { handle: 'ari', avatar: 'drop', score: 120, interests: ['Home'] },
  { handle: 'dev.s', avatar: 'leaf', score: 95, interests: ['Fitness', 'Food'] },
  { handle: 'ella.j', avatar: 'drop', score: 75, interests: ['Consumption'] },
  { handle: 'lena', avatar: 'earth', score: 60, interests: ['Food', 'Mobility'] },
  { handle: 'theo', avatar: 'tree', score: 40, interests: ['Mobility', 'Energy'] },
  { handle: 'ruby', avatar: 'leaf', score: 25, interests: ['Home', 'Digital'] },
  { handle: 'noah.v', avatar: 'sun', score: 0, interests: ['Energy'] },
];

// Captions written to match specific quests.
const CAPTIONS = {
  'active-commute': ['Bus + a short walk. Saw a heron by the creek!', 'Biked in, rain and all.', 'Took the SkyTrain and finally finished my reading.'],
  'car-free-errand': ['Walked to the grocery store. Backpack was heavy but worth it.', 'Biked to pick up my prescription, 15 min each way.'],
  'ghost-power-hunt': ['Found four chargers plugged in behind my desk.', 'My roommate had 3 things plugged in doing nothing.'],
  'natural-daylight-shift': ['Studied by the window all morning. Way nicer honestly.'],
  'five-minute-shower': ['Used a song as my timer. Made it with 20 seconds to spare.'],
  'cold-wash': ['Cold wash, everything still came out clean.'],
  'bring-your-bottle': ['Refilled at the library fountain three times today.'],
  'reusable-cup-run': ['Brought my own mug and got 25 cents off.', 'The barista complimented my cup.'],
  'inbox-clean-up': ['Unsubscribed from 7 newsletters I never signed up for.'],
  'meat-free-lunch': ['Falafel wrap from the food truck.', 'Lentil soup in the dining hall, surprisingly good.'],
  'leftovers-first': ['Turned old rice into fried rice.'],
  'stairs-only': ['Six floors to my lab. My legs have opinions.'],
  'walk-and-talk': ['Called my mom while walking the seawall.'],
  'plant-powered-plate': ['Chickpea curry for dinner!', 'Tofu stir-fry, would make again.'],
  'fridge-first-dinner': ['Pasta with whatever veg was left. Zero grocery run.'],
  'line-dry': ['Rack set up by the heater. Clothes dried overnight.'],
  'screen-free-evening': ['Played cards with my housemates instead of scrolling.'],
  'fix-it': ['Sewed the button back on my coat. First time sewing in years.', 'Glued my mug handle back on.'],
  'second-hand-first': ['Found a desk lamp at the thrift store for $6.'],
  'refill-run': ['Refilled my dish soap at the bulk store.'],
  'compost-it': ['Our building finally has a green bin, so I used it.'],
  'packed-lunch': ['Made sandwiches for the whole week tonight.'],
  'litter-pick': ['Filled a whole bag at the beach in 20 minutes.', 'Grabbed litter on the walk to class.'],
  'new-veg-recipe': ['Tried a black bean burger recipe. 8/10.'],
  'market-run': ['Trout Lake market haul: apples, kale and squash.'],
  'plant-something': ['Planted basil on the windowsill.'],
  'ten-thousand-steps': ['12,400 steps. Walked instead of taking the bus home.'],
  'plant-based-day': ['Oatmeal, lentil salad, veggie chili. Easier than I expected.'],
  'car-free-day': ['Transit and walking all day. Planned my route the night before.'],
  'zero-waste-day': ['Almost failed at lunch but brought my own container.'],
  'bike-both-ways': ['Bike both ways, 7 km each. Legs are done.'],
  'mend-and-wear': ['Patched my favourite jeans and wore them today.'],
  'clean-up-hour': ['Six of us did a clean-up in the park after class.'],
  'batch-cook': ['Big pot of veggie chili, 5 lunches sorted.'],
  'closet-swap': ['Dropped off 6 things at the clothing swap.'],
  'no-buy-day': ['Didn\'t spend a cent. Brought snacks from home.'],
  'veg-dinner-party': ['Made dal and rice for my study group.'],
  'transit-explorer': ['Took the ferry and the bus to Bowen Island. No car needed.'],
};
const CAPTIONED_IDS = Object.keys(CAPTIONS).filter(id => questById[id]);

// Photo posts: every illustration appears, and three show the privacy guidance from the
// camera screen being followed. [quest id, image, caption, author handle, hours ago]
const PHOTO_POSTS = [
  ['car-free-errand', 'plate', 'Biked to the grocery store. Blurred the plate on the car behind me before posting.', 'liam.c', 3],
  ['compost-it', 'doorstep', 'Green bin is out. Cropped our house number out first.', 'fatima', 20],
  ['reusable-cup-run', 'hands', 'Hands only, no faces. My mug, my rules.', 'zoe.b', 6],
  ['active-commute', 'bus', 'Bus + a short walk. Saw a heron by the creek!', 'maya.k', 2],
  ['bike-both-ways', 'bike', 'Bike both ways, 7 km each. Grabbed groceries on the way home.', 'oscar', 9],
  ['reusable-cup-run', 'cup', 'Brought my own mug and got 25 cents off.', 'jun.p', 28],
  ['plant-powered-plate', 'bowl', 'Chickpea and greens bowl for lunch!', 'hana', 5],
  ['mend-and-wear', 'mend', 'Patched my favourite jeans and wore them today.', 'kaito', 50],
  ['line-dry', 'laundry', 'Sunny enough to dry everything outside.', 'nadia.r', 30],
  ['market-run', 'market', 'Market haul: apples, kale and squash, all local.', 'priya.m', 26],
  ['plant-something', 'basil', 'Planted basil on the windowsill.', 'ari', 74],
  ['clean-up-hour', 'cleanup', 'Six of us filled a whole bag at the beach in an hour.', 'priya.m', 52],
  ['second-hand-first', 'lamp', 'Found this desk lamp at the thrift store for $6.', 'leo.w', 98],
  ['batch-cook', 'batch', 'Big pot of veggie chili. Four lunches sorted.', 'sam.t', 120],
  ['transit-explorer', 'ferry', 'Ferry and bus to Bowen Island. No car needed.', 'oscar', 145],
  ['ghost-power-hunt', 'plugs', 'Found four chargers plugged in behind my desk.', 'dev.s', 12],
  ['refill-run', 'refill', 'Refilled dish soap and oats at the bulk store.', 'zoe.b', 170],
  ['plant-based-day', 'bowl', 'Oatmeal, lentil salad, veggie chili. Easier than I expected.', 'lena', 190],
];

// Cooper's own posts. [quest id, image or null, caption, hours ago]
const PRESENTER_POSTS = [
  ['natural-daylight-shift', null, 'Studied by the window all morning. Way nicer honestly.', 1],
  ['car-free-day', 'bike', 'Transit and bike all day. Planned my route the night before.', 27],
  ['ghost-power-hunt', 'plugs', 'Unplugged everything in my room that was just sitting there.', 75],
  ['fix-it', 'mend', 'Sewed a patch on my backpack instead of buying a new one.', 124],
];

const AWARD_COST = { leaf: 10, tree: 25, water: 50, planet: 100 };

async function upsertMember(m) {
  const email = `demo+${m.handle}@example.com`;
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password: DEMO_PASSWORD, displayName: m.handle });
  }
  return { ...m, uid: user.uid, email };
}

async function main() {
  console.log(`Creating ${MEMBERS.length} demo members…`);
  const members = [];
  for (const m of MEMBERS) members.push(await upsertMember(m));
  const uids = members.map(m => m.uid);

  // Every score must be different so the rankings never tie.
  const scores = [...MEMBERS.map(m => m.score), PRESENTER.score];
  if (new Set(scores).size !== scores.length) throw new Error('Demo scores must all be different.');

  console.log(`Writing ${QUESTS.length} quests…`);
  for (let i = 0; i < QUESTS.length; i += 400) {
    const b = db.batch();
    QUESTS.slice(i, i + 400).forEach(({ id, ...q }) => b.set(db.collection('Quests').doc(id), q));
    await b.commit();
  }

  // Presenter account
  let presenterUser;
  try {
    presenterUser = await auth.getUserByEmail(PRESENTER.email);
    await auth.updateUser(presenterUser.uid, { password: PRESENTER.password, displayName: PRESENTER.handle });
  } catch {
    presenterUser = await auth.createUser({ email: PRESENTER.email, password: PRESENTER.password, displayName: PRESENTER.handle });
  }
  const presenter = { ...PRESENTER, uid: presenterUser.uid };
  const today = todayLocal();
  const todays = ['natural-daylight-shift', 'active-commute', 'car-free-errand'].map((id, i) => {
    const q = questById[id];
    return { questId: id, assignedDate: today, completed: i === 0, title: q.title, description: q.description, points: q.points, difficulty: q.difficulty };
  });

  // Profiles + follows
  let batch = db.batch();
  for (const m of members) {
    const others = uids.filter(id => id !== m.uid);
    batch.set(db.collection('Users').doc(m.uid), {
      demo: true,
      email: m.email,
      userDisplayName: m.handle,
      userDisplayNameLower: m.handle.toLowerCase(),
      avatar: m.avatar,
      interests: m.interests,
      score: m.score,
      questsCompletedCount: Math.max(0, Math.round(m.score / 85) + between(0, 3)),
      freeSwaps: 2,
      rerollTokens: 0,
      following: sample(others, between(3, 7)),
      giftPointsReceived: 0,
      onboardingComplete: true,
      createdAt: new Date(Date.now() - between(14, 40) * 86400000).toISOString(),
      dailyQuests: [],
    }, { merge: true });
  }
  const fans = ['maya.k', 'marco', 'jun.p', 'nadia.r', 'leo.w', 'zoe.b'];
  batch.set(db.collection('Users').doc(presenter.uid), {
    email: PRESENTER.email.toLowerCase(),
    userDisplayName: PRESENTER.handle,
    userDisplayNameLower: PRESENTER.handle.toLowerCase(),
    avatar: PRESENTER.avatar,
    interests: PRESENTER.interests,
    score: PRESENTER.score,
    questsCompletedCount: 9,
    freeSwaps: 2,
    rerollTokens: 1,
    following: members.filter(m => ['maya.k', 'oscar', 'zoe.b', 'sam.t', 'nadia.r', 'priya.m', 'liam.c'].includes(m.handle)).map(m => m.uid),
    giftPointsReceived: 0,
    onboardingComplete: true,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    dailyQuests: todays,
    lastQuestAssignment: today,
  });
  for (const m of members.filter(m => fans.includes(m.handle))) {
    batch.update(db.collection('Users').doc(m.uid), { following: FieldValue.arrayUnion(presenter.uid) });
  }
  await batch.commit();

  // Remove posts from an earlier run so re-running doesn't duplicate them.
  const old = await db.collection('CommunityPosts').where('demo', '==', true).get();
  for (let i = 0; i < old.docs.length; i += 450) {
    const b = db.batch();
    old.docs.slice(i, i + 450).forEach(d => b.delete(d.ref));
    await b.commit();
  }

  const byHandle = Object.fromEntries(members.map(m => [m.handle, m]));
  const giftTotals = {};
  const everyone = [...uids, presenter.uid];

  const makePost = (author, quest, caption, imageName, hoursAgo, popularity = 1) => {
    const likers = sample(everyone.filter(id => id !== author.uid), Math.min(everyone.length - 1, Math.round(between(1, 12) * popularity)));
    const awards = {};
    const roll = rand();
    if (roll < 0.55 * popularity) {
      awards.leaf = between(1, 3);
      if (rand() < 0.5) awards.tree = between(1, 2);
      if (rand() < 0.2) awards.water = 1;
      if (rand() < 0.08) awards.planet = 1;
      giftTotals[author.uid] = (giftTotals[author.uid] || 0)
        + Object.entries(awards).reduce((t, [id, n]) => t + n * AWARD_COST[id], 0);
    }
    return {
      demo: true,
      userId: author.uid,
      userDisplayName: author.handle,
      dareTitle: quest.title,
      dareDescription: quest.description,
      dareDifficulty: quest.difficulty,
      userCaption: caption,
      imageURL: imageName ? image(imageName) : null,
      likes: likers.length,
      likedBy: likers,
      awards,
      flaggedCount: 0,
      pointsAwarded: quest.points,
      timestamp: Timestamp.fromDate(new Date(Date.now() - hoursAgo * 3600000 - between(0, 50) * 60000)),
    };
  };

  const posts = [];
  for (const [qid, img, caption, handle, hours] of PHOTO_POSTS) {
    posts.push(makePost(byHandle[handle], questById[qid], caption, img, hours, 1.4));
  }
  // Make sure every award type shows up somewhere near the top of the feed.
  const showcase = [[0, 'planet'], [3, 'water'], [1, 'tree'], [2, 'leaf'], [6, 'water'], [11, 'planet']];
  for (const [i, id] of showcase) {
    const post = posts[i];
    post.awards[id] = (post.awards[id] || 0) + 1;
    giftTotals[post.userId] = (giftTotals[post.userId] || 0) + AWARD_COST[id];
  }
  // Text-only posts: more active members post more often; skewed towards recent days.
  const weighted = members.flatMap(m => Array(1 + Math.round(m.score / 200)).fill(m));
  for (let i = 0; i < RANDOM_TEXT_POSTS; i++) {
    const author = pick(weighted);
    const quest = questById[pick(CAPTIONED_IDS)];
    const hours = Math.pow(rand(), 1.6) * DAYS_OF_POSTS * 24;
    posts.push(makePost(author, quest, rand() < 0.85 ? pick(CAPTIONS[quest.id]) : '', null, hours));
  }
  for (const [qid, img, caption, hours] of PRESENTER_POSTS) {
    posts.push(makePost(presenter, questById[qid], caption, img, hours, 1.6));
  }

  console.log(`Writing ${posts.length} posts (${posts.filter(p => p.imageURL).length} with photos)…`);
  for (let i = 0; i < posts.length; i += 20) {
    const b = db.batch();
    posts.slice(i, i + 20).forEach(p => b.set(db.collection('CommunityPosts').doc(), p));
    await b.commit();
  }

  batch = db.batch();
  for (const [uid, pts] of Object.entries(giftTotals)) {
    batch.set(db.collection('Users').doc(uid), { giftPointsReceived: pts }, { merge: true });
  }
  await batch.commit();

  console.log('\nDone.');
  console.log(`Presenter login: ${PRESENTER.email} / ${PRESENTER.password}  (handle ${PRESENTER.handle}, ${PRESENTER.score} pts)`);
  console.log(`Demo member logins (password ${DEMO_PASSWORD}):`);
  members.slice(0, 4).forEach(m => console.log(`  ${m.email}  (${m.score} pts)`));
  console.log('Remove demo data later with: node scripts/removeDemoData.mjs');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
