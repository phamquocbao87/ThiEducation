import { db } from '../src/core/services/firebase.js';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

async function seedContractsAndPayrolls() {
  // 1. Kiểm tra collection 'contracts'
  const contractsSnap = await getDocs(collection(db, 'contracts'));
  console.log(`Current contracts in Firestore: ${contractsSnap.size}`);

  if (contractsSnap.size === 0) {
    const defaultContract = {
      id: 'HD-2026-001',
      teacherId: 'GV791',
      teacherName: 'Hellen (GV791)',
      teacherEmail: 'vnthietbigarage@gmail.com',
      type: 'Full-time Native',
      ratePerSession: 450000,
      minSessionsPerMonth: 40,
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'contracts', defaultContract.id), defaultContract);
    console.log(`  ✅ Added contract ${defaultContract.id} for teacher GV791.`);
  }

  // 2. Kiểm tra collection 'payrolls'
  const payrollsSnap = await getDocs(collection(db, 'payrolls'));
  console.log(`Current payrolls in Firestore: ${payrollsSnap.size}`);

  if (payrollsSnap.size === 0) {
    const defaultPayroll = {
      id: 'PR-2026-11-001',
      recipientType: 'TEACHER',
      teacherId: 'GV791',
      teacherName: 'Hellen (GV791)',
      month: '11/2026',
      totalSessions: 40,
      ratePerSession: 450000,
      bonus: 2000000,
      deduction: 0,
      totalSalary: 40 * 450000 + 2000000, // 20.000.000 đ
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'payrolls', defaultPayroll.id), defaultPayroll);
    console.log(`  ✅ Added payroll ${defaultPayroll.id} for teacher GV791.`);
  }

  console.log('Done seeding contracts and payrolls to Firestore.');
  process.exit(0);
}

seedContractsAndPayrolls();

