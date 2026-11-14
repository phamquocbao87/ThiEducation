import { db } from '../src/core/services/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const backupPath = path.resolve('test-results/lh005_original_schedule.json');
  if (!fs.existsSync(backupPath)) {
    console.log('No backup file found, skipping restore.');
    process.exit(0);
  }

  const orig = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const ref = doc(db, 'classes', 'LH005');
  const updatePayload = {
    scheduleData: orig.scheduleData,
    schedule: orig.schedule,
    scheduleHistory: orig.scheduleHistory || [],
  };
  if (orig.startDate !== undefined) updatePayload.startDate = orig.startDate;
  if (orig.endDate !== undefined) updatePayload.endDate = orig.endDate;

  await updateDoc(ref, updatePayload);

  // Teardown: Clean up test notes & evaluations in classroom_live to enforce Zero Test-Data Residue
  try {
    const liveRef = doc(db, 'classroom_live', 'LH005');
    await updateDoc(liveRef, {
      quickNotes: {},
      studentEvaluations: {},
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // ignore if not exists
  }

  fs.unlinkSync(backupPath);
  console.log('SUCCESS: LH005 original schedule restored.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

