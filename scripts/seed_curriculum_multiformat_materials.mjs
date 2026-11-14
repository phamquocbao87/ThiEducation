import { db } from '../src/core/services/firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

async function seedMultiFormatMaterials() {
  console.log('--- SEEDING MULTI-FORMAT MATERIALS FOR KH-7569 ---');

  // 1. Dọn dẹp các tài liệu rác mang URL blob trong collection learning_materials
  const snap = await getDocs(collection(db, 'learning_materials'));
  let deletedCount = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.url && data.url.startsWith('blob:')) {
      await deleteDoc(doc(db, 'learning_materials', docSnap.id));
      deletedCount++;
    }
  }
  console.log(`Cleaned up ${deletedCount} dead blob: records from learning_materials collection.`);

  // 2. Danh sách 6 tài liệu học tập thực tế chuẩn McGraw-Hill Wonders Grade 5
  const sampleMaterials = [
    {
      id: 'mat_wonders_g5_u1_video',
      title: 'Wonders G5 Unit 1 Interactive Read-Aloud Lesson Video',
      fileName: 'Wonders_G5_Unit1_Interactive_ReadAloud.mp4',
      type: 'VIDEO',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      firebaseFolder: 'Wonders_G5_Unit1_Videos',
      description: 'Video bài học đọc hiểu tương tác kèm phụ đề chuẩn phát âm bản ngữ cho học sinh ôn bài tại nhà.',
      visibility: 'ALL',
      fileSize: '42.8 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'mat_wonders_g5_u1_slides',
      title: 'Wonders G5 Unit 1 Vocabulary & Phonics Presentation',
      fileName: 'Wonders_G5_Unit1_Vocabulary_Phonics.pptx',
      type: 'SLIDES',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://drive.google.com/file/d/1w3s6Xjeq0SPV9qg_83igR6NCo7SbDEMh/view',
      firebaseFolder: 'Wonders_G5_Unit1_Presentations',
      description: 'Slide trình chiếu bài giảng từ vựng và ngữ âm Unit 1 (Tuần 1 - 5) tỷ lệ 16:9 sắc nét cho giáo viên chiếu lớp.',
      visibility: 'ALL',
      fileSize: '18.5 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'mat_wonders_g5_u1_audio',
      title: 'Wonders G5 Unit 1 Listening Practice Track 01',
      fileName: 'Wonders_G5_Unit1_Track01.mp3',
      type: 'AUDIO',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      firebaseFolder: 'Wonders_G5_Unit1_Audios',
      description: 'File âm thanh luyện nghe bài học Unit 1 hỗ trợ điều chỉnh tốc độ phát 0.75x, 1.0x, 1.25x.',
      visibility: 'ALL',
      fileSize: '4.2 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'mat_1794647167837_2',
      title: 'RWC Grade 5-Unit (1-2)_SE',
      fileName: 'RWC Grade 5-Unit (1-2)_SE.pdf',
      type: 'PDF',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://drive.google.com/file/d/1w3s6Xjeq0SPV9qg_83igR6NCo7SbDEMh/view',
      firebaseFolder: 'Batch_Materials_3Files_20261114',
      description: 'Sách Reading/Writing Companion Unit 1-2 chính khóa 220 trang.',
      visibility: 'ALL',
      fileSize: '54.1 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'mat_1794647166353_1',
      title: 'Practice Book Grade 5 (SE) (1)',
      fileName: 'Practice Book Grade 5 (SE) (1).pdf',
      type: 'PDF',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://drive.google.com/file/d/1w3s6Xjeq0SPV9qg_83igR6NCo7SbDEMh/view',
      firebaseFolder: 'Batch_Materials_3Files_20261114',
      description: 'Sách bài tập thực hành ngữ pháp và chính tả.',
      visibility: 'ALL',
      fileSize: '15 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'mat_1794647164688_0',
      title: 'Literature Anthology Grade 5',
      fileName: 'Literature Anthology Grade 5.pdf',
      type: 'PDF',
      courseId: 'KH-7569',
      courseCode: 'WONDERS-G5',
      courseName: 'Wonder Grade 5 (G5) - 2023',
      courseLevel: 'WONDERS-G5',
      url: 'https://drive.google.com/file/d/1w3s6Xjeq0SPV9qg_83igR6NCo7SbDEMh/view',
      firebaseFolder: 'Batch_Materials_3Files_20261114',
      description: 'Tuyển tập văn học McGraw-Hill Wonders Grade 5.',
      visibility: 'ALL',
      fileSize: '126 MB',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ];

  // 3. Cập nhật vào khóa học KH-7569
  const courseRef = doc(db, 'courses', 'KH-7569');
  const courseSnap = await getDoc(courseRef);
  if (courseSnap.exists()) {
    await updateDoc(courseRef, {
      courseMaterials: sampleMaterials,
    });
    console.log('Successfully updated course KH-7569 with 6 multi-format materials.');
  } else {
    console.warn('Course KH-7569 not found!');
  }

  // 4. Đồng bộ vào collection learning_materials
  for (const item of sampleMaterials) {
    await setDoc(doc(db, 'learning_materials', item.id), item, { merge: true });
  }
  console.log('Successfully synced all 6 materials to learning_materials collection.');
  process.exit(0);
}

seedMultiFormatMaterials().catch((err) => {
  console.error('Error seeding multi-format materials:', err);
  process.exit(1);
});
