// scripts/resetTestData.mjs
// Removes OLD test data (accounts and posts made while building the app) so the demo
// starts clean. Demo data from seedDemoData.mjs is left alone.
//
// SAFE BY DEFAULT: without --confirm it only prints what it WOULD delete.
//
//   node scripts/resetTestData.mjs --keep you@school.ca,teammate@school.ca
//   node scripts/resetTestData.mjs --keep you@school.ca,teammate@school.ca --confirm
//
// --keep     comma-separated emails to keep (their logins, profiles and posts stay)
// --backup   writes scripts/backup-<timestamp>.json of everything before deleting (on by default)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const here = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(here, 'serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const confirm = process.argv.includes('--confirm');
const keepEmails = new Set((arg('--keep') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
const isDemoEmail = (e) => !!e && e.startsWith('demo+') && e.endsWith('@example.com');

async function main() {
  // Every login, minus demo accounts and the ones to keep.
  const allAuth = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    allAuth.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const keepUids = new Set(allAuth.filter(u => keepEmails.has((u.email || '').toLowerCase())).map(u => u.uid));
  const missing = [...keepEmails].filter(e => !allAuth.some(u => (u.email || '').toLowerCase() === e));
  if (missing.length) console.warn(`⚠ No account found for: ${missing.join(', ')}. Check the spelling before using --confirm.`);

  const authToDelete = allAuth.filter(u => !keepUids.has(u.uid) && !isDemoEmail(u.email));
  const profiles = await db.collection('Users').get();
  const profilesToDelete = profiles.docs.filter(d => !keepUids.has(d.id) && !d.data().demo);
  const posts = await db.collection('CommunityPosts').get();
  const postsToDelete = posts.docs.filter(d => !keepUids.has(d.data().userId) && !d.data().demo);

  console.log(`\nKeeping ${keepUids.size} account(s): ${[...keepEmails].join(', ') || '(none)'}`);
  console.log(`\nWould delete ${authToDelete.length} login(s):`);
  authToDelete.forEach(u => console.log(`  - ${u.email || u.uid}`));
  console.log(`\nWould delete ${profilesToDelete.length} profile(s) and ${postsToDelete.length} post(s).`);

  if (!confirm) {
    console.log('\nDry run only: nothing was deleted. Add --confirm to delete.');
    return;
  }

  const file = path.join(here, `backup-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({
    logins: authToDelete.map(u => ({ uid: u.uid, email: u.email })),
    profiles: profilesToDelete.map(d => ({ id: d.id, ...d.data() })),
    posts: postsToDelete.map(d => ({ id: d.id, ...d.data() })),
  }, null, 2));
  console.log(`\nBackup written to ${file}`);

  for (const list of [postsToDelete, profilesToDelete]) {
    for (let i = 0; i < list.length; i += 450) {
      const b = db.batch();
      list.slice(i, i + 450).forEach(d => b.delete(d.ref));
      await b.commit();
    }
  }
  for (let i = 0; i < authToDelete.length; i += 1000) {
    await auth.deleteUsers(authToDelete.slice(i, i + 1000).map(u => u.uid));
  }

  // Kept accounts may follow deleted ones; tidy that up.
  const deleted = new Set(authToDelete.map(u => u.uid));
  for (const uid of keepUids) {
    const ref = db.collection('Users').doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      const f = snap.data().following || [];
      if (f.some(id => deleted.has(id))) await ref.update({ following: f.filter(id => !deleted.has(id)) });
    }
  }
  console.log('Done. Old test data removed.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
