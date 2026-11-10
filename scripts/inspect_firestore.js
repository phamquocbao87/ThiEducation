import { db } from '../src/core/services/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkCollections() {
  const collectionNames = [
    'users',
    'courses',
    'classes',
    'schedules',
    'curriculum',
    'curriculum_levels',
    'attendances',
    'contracts',
    'tuition',
    'payrolls'
  ];

  for (const colName of collectionNames) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\n📁 Collection '${colName}': ${snap.size} documents`);
      snap.forEach((doc) => {
        const data = doc.data();
        console.log(`  - [${doc.id}]:`, JSON.stringify(data).substring(0, 150));
      });
    } catch (e) {
      console.error(`  ❌ Error reading '${colName}':`, e.message);
    }
  }
  process.exit(0);
}

checkCollections();

