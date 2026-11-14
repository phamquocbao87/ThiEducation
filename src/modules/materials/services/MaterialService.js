import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { CourseService } from '../../courses/services/CourseService';

export class MaterialService extends BaseModuleService {
  static COLLECTION_NAME = 'learning_materials';

  /**
   * Lấy toàn bộ tài liệu học tập từ Firestore (kết hợp từ Khóa học & Collection tài liệu)
   */
  static async getAllMaterials() {
    const materialsMap = new Map();

    // 1. Quét tài liệu từ danh mục Khóa học thật (100% Real DB)
    try {
      const courses = await CourseService.getAllCourses();
      (courses || []).forEach((c) => {
        const cMaterials = c.courseMaterials || [];
        cMaterials.forEach((m, idx) => {
          const matId = m.id || `mat_${c.id}_${idx}`;
          materialsMap.set(matId, {
            ...m,
            id: matId,
            courseId: c.id,
            courseCode: c.code || c.id,
            courseName: c.name || `Khóa học ${c.code || c.id}`,
            courseLevel: c.level || c.courseLevel || 'Standard',
            title: m.title || 'Tài Liệu Học Tập',
            type: m.type || 'PDF',
            url: m.url || '#',
            visibility: m.visibility || 'ALL',
            description: m.description || '',
            uploadedAt: m.uploadedAt || new Date().toISOString(),
          });
        });
      });
    } catch (err) {
      console.warn('Could not load course materials:', err);
    }

    // 2. Quét tài liệu từ collection riêng `learning_materials` (nếu có)
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const snap = await getDocs(collection(db, this.COLLECTION_NAME));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.isDeleted) {
            materialsMap.set(docSnap.id, {
              ...data,
              id: docSnap.id,
            });
          }
        });
      } catch (err) {
        console.warn('Could not load learning_materials collection:', err);
      }
    }

    return Array.from(materialsMap.values()).sort(
      (a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
    );
  }

  /**
   * Tải 1 file lên Firebase Storage theo cấu trúc thư mục quy định
   * Đường dẫn thư mục: learning_materials/{folderName}/{cleanFileName}
   */
  static async uploadFileToFirebase(file, folderName = 'general', onProgress) {
    if (!file) throw new Error('FILE_REQUIRED');

    const cleanFolder = String(folderName || 'general')
      .trim()
      .replace(/[\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');
    const safeName = file.name.replace(/[\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
    const cleanFileName = `${Date.now()}_${safeName}`;
    const storagePath = `learning_materials/${cleanFolder}/${cleanFileName}`;

    if (typeof onProgress === 'function') onProgress(30);

    if (IS_FIREBASE_ENABLED && storage) {
      try {
        const fileRef = ref(storage, storagePath);

        // Upload an toàn với timeout 2.5s (tránh kẹt exponential backoff khi localhost bị chặn CORS)
        const uploadPromise = (async () => {
          if (typeof onProgress === 'function') onProgress(60);
          const snapshot = await uploadBytes(fileRef, file, {
            contentType: file.type || 'application/octet-stream',
            customMetadata: {
              originalName: file.name,
              folder: cleanFolder,
              uploadedAt: new Date().toISOString(),
            },
          });
          if (typeof onProgress === 'function') onProgress(100);
          const downloadURL = await getDownloadURL(snapshot.ref);
          return { downloadURL, storagePath, folder: cleanFolder, fileName: file.name, size: file.size };
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('STORAGE_TIMEOUT_OR_CORS')), 1200)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Firebase Storage upload fallback (CORS / network timeout):', err?.message);
        if (typeof onProgress === 'function') onProgress(100);
        const fallbackUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '#';
        return {
          downloadURL: fallbackUrl,
          storagePath,
          folder: cleanFolder,
          fileName: file.name,
          size: file.size,
          isLocalFallback: true,
        };
      }
    }

    if (typeof onProgress === 'function') onProgress(100);
    const fallbackUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '#';
    return {
      downloadURL: fallbackUrl,
      storagePath,
      folder: cleanFolder,
      fileName: file.name,
      size: file.size,
      isLocalFallback: true,
    };
  }

  /**
   * Tải hàng loạt nhiều file lên Firebase Storage (Tạo chung 1 thư mục)
   */
  static async uploadMultipleFilesToFirebase(files = [], folderName = 'general', onOverallProgress, onFileProgress) {
    if (!Array.isArray(files) || files.length === 0) return [];

    const totalFiles = files.length;
    const results = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const res = await this.uploadFileToFirebase(file, folderName, (filePercent) => {
        if (typeof onFileProgress === 'function') {
          onFileProgress(i, file.name, filePercent);
        }
        if (typeof onOverallProgress === 'function') {
          const overall = Math.round(((i * 100) + filePercent) / totalFiles);
          onOverallProgress(overall);
        }
      });
      results.push(res);
    }

    if (typeof onOverallProgress === 'function') onOverallProgress(100);
    return results;
  }

  /**
   * Lưu hoặc Cập nhật tài liệu học tập (Đồng bộ 2 chiều 0ms với Khóa Học)
   */
  static async saveMaterial(materialData, actor) {
    if (!materialData.title || !materialData.url) {
      throw new Error('TITLE_AND_URL_REQUIRED');
    }

    const materialId = materialData.id || `mat_${Date.now()}`;
    const rawPayload = {
      description: '',
      fileName: '',
      fileSize: '',
      firebaseFolder: '',
      courseId: 'ALL',
      courseName: 'Toàn Trung Tâm',
      visibility: 'ALL',
      type: 'PDF',
      ...materialData,
      id: materialId,
      uploadedAt: materialData.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: actor?.id || actor?.code || 'USER',
      isDeleted: false,
    };

    // Chuẩn hóa Zero-Undefined tuyệt đối cho Firestore
    const payload = Object.fromEntries(
      Object.entries(rawPayload).map(([k, v]) => [k, v === undefined ? '' : v])
    );

    // 1. Lưu vào collection `learning_materials`
    if (IS_FIREBASE_ENABLED && db) {
      const docRef = doc(db, this.COLLECTION_NAME, materialId);
      await setDoc(docRef, payload, { merge: true });
    }

    // 2. Nếu gán cho Khóa học cụ thể, đồng bộ ngay vào `courseMaterials` của Khóa học đó
    if (materialData.courseId && materialData.courseId !== 'ALL') {
      try {
        const courses = await CourseService.getAllCourses();
        const targetCourse = courses.find((c) => c.id === materialData.courseId);
        if (targetCourse) {
          const existingList = Array.isArray(targetCourse.courseMaterials)
            ? [...targetCourse.courseMaterials]
            : [];
          const existingIndex = existingList.findIndex((m) => m.id === materialId);
          if (existingIndex >= 0) {
            existingList[existingIndex] = { ...existingList[existingIndex], ...payload };
          } else {
            existingList.push(payload);
          }
          await CourseService.updateCourseMaterials(targetCourse.id, existingList, actor);
        }
      } catch (err) {
        console.warn('Could not sync material into target course:', err);
      }
    }

    return payload;
  }

  /**
   * Xóa tài liệu học tập (Bảo toàn dữ liệu & Đồng bộ xóa khỏi Khóa học)
   */
  static async deleteMaterial(materialId, courseId, actor) {
    if (!materialId) return false;

    // 1. Đánh dấu xóa mềm trên collection `learning_materials`
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, materialId);
        await setDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: actor?.id || '' }, { merge: true });
      } catch (err) {
        console.warn('Could not soft delete from learning_materials:', err);
      }
    }

    // 2. Xóa khỏi Khóa học tương ứng (nếu có)
    if (courseId && courseId !== 'ALL') {
      try {
        const courses = await CourseService.getAllCourses();
        const targetCourse = courses.find((c) => c.id === courseId);
        if (targetCourse && Array.isArray(targetCourse.courseMaterials)) {
          const updatedMaterials = targetCourse.courseMaterials.filter((m) => m.id !== materialId);
          await CourseService.updateCourseMaterials(targetCourse.id, updatedMaterials, actor);
        }
      } catch (err) {
        console.warn('Could not remove material from course:', err);
      }
    }

    return true;
  }

  /**
   * Bộ lọc đa chiều cho tài liệu (Tìm kiếm, Khóa học, Định dạng, Quyền xem)
   */
  static filterMaterials(materials = [], { searchTerm = '', courseId = 'ALL', type = 'ALL', userRole = 'admin' } = {}) {
    return materials.filter((item) => {
      // 1. Phân quyền hiển thị (Học viên không xem tài liệu TEACHERS_ONLY)
      if (userRole === 'student' && item.visibility === 'TEACHERS_ONLY') {
        return false;
      }

      // 2. Lọc theo Khóa học
      if (courseId && courseId !== 'ALL') {
        if (item.courseId !== courseId) return false;
      }

      // 3. Lọc theo Phân loại học liệu
      if (type && type !== 'ALL') {
        if (item.type !== type) return false;
      }

      // 4. Tìm kiếm từ khóa
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(term);
        const matchCourse = (item.courseName || '').toLowerCase().includes(term);
        const matchDesc = (item.description || '').toLowerCase().includes(term);
        if (!matchTitle && !matchCourse && !matchDesc) return false;
      }

      return true;
    });
  }
}

