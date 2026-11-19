import { db } from '../src/core/services/firebase.js';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

async function main() {
  const title = process.argv[2];
  if (!title) {
    console.log('No title provided for teardown.');
    process.exit(0);
  }

  console.log(`[Teardown] Searching learning_materials for title: "${title}"...`);
  try {
    const q = query(collection(db, 'learning_materials'), where('title', '==', title));
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} documents to delete.`);
    for (const doc of snap.docs) {
      console.log('Deleting doc:', doc.id);
      await deleteDoc(doc.ref);
    }
    console.log('Teardown complete.');
  } catch (err) {
    console.warn('Teardown warning:', err.message);
  }
  process.exit(0);
}

main();
