// scripts/removeDemoData.mjs
// Removes everything seedDemoData.mjs created: demo posts, demo profiles and demo logins
// (accounts ending @example.com that start with "demo+"). Also strips demo members out of
// real users' following lists and removes demo likes from real posts.
//
// Run:  node scripts/removeDemoData.mjs
import { readFileSync } from 'node:fs';
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

async function deleteDocs(docs) {
  for (let i = 0; i < docs.length; i += 450) {
    const b = db.batch();
    docs.slice(i, i + 450).forEach(d => b.delete(d.ref));
    await b.commit();
  }
}

async function main() {
  const demoUsers = await db.collection('Users').where('demo', '==', true).get();
  const demoIds = demoUsers.docs.map(d => d.id);

  const posts = await db.collection('CommunityPosts').where('demo', '==', true).get();
  await deleteDocs(posts.docs);
  console.log(`Deleted ${posts.size} demo posts.`);

  // Clean demo traces out of real accounts and real posts.
  if (demoIds.length) {
    const realUsers = await db.collection('Users').get();
    for (const u of realUsers.docs) {
      if (u.data().demo) continue;
      const f = u.data().following || [];
      if (f.some(id => demoIds.includes(id))) {
        await u.ref.update({ following: f.filter(id => !demoIds.includes(id)) });
      }
    }
    const realPosts = await db.collection('CommunityPosts').get();
    for (const p of realPosts.docs) {
      const likedBy = p.data().likedBy || [];
      const demoLikes = likedBy.filter(id => demoIds.includes(id));
      if (demoLikes.length) {
        await p.ref.update({ likedBy: FieldValue.arrayRemove(...demoLikes), likes: FieldValue.increment(-demoLikes.length) });
      }
    }
  }

  await deleteDocs(demoUsers.docs);
  console.log(`Deleted ${demoUsers.size} demo profiles.`);

  let removed = 0;
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    const demo = page.users.filter(u => u.email && u.email.startsWith('demo+') && u.email.endsWith('@example.com')).map(u => u.uid);
    if (demo.length) {
      await auth.deleteUsers(demo);
      removed += demo.length;
    }
    pageToken = page.pageToken;
  } while (pageToken);
  console.log(`Deleted ${removed} demo logins.`);
  console.log('Note: awards the demo script gave your own posts stay, since real users may also have sent some.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
