import { db } from '../src/core/services/firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const ref = doc(db, 'classes', 'LH005');
  const snap = await getDoc(ref);
  const data = snap.data();
  const orig = {
    scheduleData: data.scheduleData,
    schedule: data.schedule,
    startDate: data.startDate,
    endDate: data.endDate,
    scheduleHistory: data.scheduleHistory || [],
  };

  const backupPath = path.resolve('test-results/lh005_original_schedule.json');
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(orig, null, 2), 'utf-8');

  // Set session active right now (all days 0-6, 00:01 - 23:59)
  await updateDoc(ref, {
    'scheduleData.days': [0, 1, 2, 3, 4, 5, 6],
    'scheduleData.startTime': '00:01',
    'scheduleData.endTime': '23:59',
    'scheduleData.formatted': 'Daily (00:01 - 23:59)',
    'schedule': 'Daily (00:01 - 23:59)',
    'scheduleHistory': [],
    'startDate': '01/01/2026',
    'endDate': '31/12/2026',
  });

  console.log('SUCCESS: LH005 temporary active session enabled. Backup saved.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

