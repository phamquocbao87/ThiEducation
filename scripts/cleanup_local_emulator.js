import { deleteDoc, doc, terminate } from 'firebase/firestore';
import { localDb, requireLocalEmulator, TEST_DOCUMENTS } from './local_emulator_fixture.js';

requireLocalEmulator();

for (const [collectionName, ids] of Object.entries(TEST_DOCUMENTS)) {
  for (const id of ids) {
    await deleteDoc(doc(localDb, collectionName, id));
  }
}

console.log('Removed the fixed local test fixture documents.');
await terminate(localDb);
