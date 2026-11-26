import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, IS_FIREBASE_ENABLED, IS_DEVELOPMENT_FIREBASE } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { CourseService } from '../../courses/services/CourseService';
import { ClassService } from '../../courses/services/ClassService';
import { DriveStorageService } from '../../../core/services/DriveStorageService';
import { NotificationService, NOTIFICATION_TYPES } from '../../../core/services/NotificationService';
import { normalizeMaterialShares, SHARE_SCOPES, TARGET_TYPES } from '../models/material.model';

export class MaterialService extends BaseModuleService {
  static COLLECTION_NAME = 'learning_materials';

  /**
   * Lấy toàn bộ tài liệu học tập từ Firestore (kết hợp từ Khóa học & Collection tài liệu)
   * Đồng thời chuẩn hóa 100% đối tượng chia sẻ (normalizeMaterialShares)
   */
  static async getAllMaterials() {
    const materialsMap = new Map();

    // 1. Quét tài liệu từ danh mục Khóa học thật (100% Real DB — loại trừ bản đã xóa & Session Recording lớp lẻ)
    try {
      const courses = await CourseService.getAllCourses();
      (courses || []).forEach((c) => {
        const cMaterials = c.courseMaterials || [];
        cMaterials.forEach((m, idx) => {
          if (!m || m.isDeleted || m.isSessionRecording) return;
          const matId = m.id || `mat_${c.id}_${idx}`;
          const normalized = normalizeMaterialShares({
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
          materialsMap.set(matId, normalized);
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
            const normalized = normalizeMaterialShares({
              ...data,
              id: docSnap.id,
            });
            materialsMap.set(docSnap.id, normalized);
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
   * Tải 1 file lên Google Drive lưu trữ chính thức của trường (Zero-Egress via Hosting-Store API)
   * Tuyệt đối không fallback ra blob: URL để tránh mất liên kết khi làm mới trang.
   */
  static async uploadFileToFirebase(file, folderName = 'general', onProgress) {
    if (!file) throw new Error('FILE_REQUIRED');

    try {
      if (typeof onProgress === 'function') onProgress(15);
      const uploadResult = await DriveStorageService.uploadFile(file, {
        folderPath: DriveStorageService.FOLDERS.CLASS_RECORDINGS('2026'),
        tag: 'curriculum_material',
        title: file.name,
        notes: `Tài liệu thư mục: ${folderName}`,
        purpose: 'learning_material',
        key: folderName || 'general',
        onProgress: (percent) => {
          if (typeof onProgress === 'function') onProgress(percent);
        },
      });

      const effectiveUrl = uploadResult.driveUrl || uploadResult.webViewLink || uploadResult.downloadUrl || '';
      return {
        downloadURL: effectiveUrl,
        storagePath: uploadResult.folderPath || `06_CLASS_RECORDINGS_MATERIALS/2026`,
        folder: folderName,
        fileName: file.name,
        size: file.size,
        driveFileId: uploadResult.id || uploadResult.fileId || '',
        cdnUrl: uploadResult.cdnUrl || uploadResult.displayUrl || '',
        downloadUrl: uploadResult.downloadUrl || effectiveUrl,
        isGoogleDrive: true,
      };
    } catch (err) {
      console.error('Google Drive upload error:', err);
      throw new Error(`Tải tệp lên Google Drive thất bại: ${err.message || 'Lỗi kết nối'}`);
    }
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
   * Lưu hoặc Cập nhật tài liệu học tập (Đồng bộ 2 chiều 0ms với Khóa Học & Phân quyền chia sẻ)
   */
  static async saveMaterial(materialData, actor) {
    if (!materialData.title || !materialData.url) {
      throw new Error('TITLE_AND_URL_REQUIRED');
    }

    if (typeof materialData.url === 'string' && materialData.url.startsWith('blob:')) {
      throw new Error('BLOB_URL_NOT_ALLOWED: Không thể lưu URL tạm thời vào cơ sở dữ liệu. Vui lòng tải lại tệp hoặc dán liên kết Google Drive chính thức.');
    }

    const materialId = materialData.id || `mat_${Date.now()}`;
    const normalized = normalizeMaterialShares(materialData);

    const rawPayload = {
      description: '',
      fileName: '',
      fileSize: '',
      firebaseFolder: '',
      courseId: 'ALL',
      courseName: 'Toàn Trung Tâm',
      visibility: 'ALL',
      type: 'PDF',
      ...normalized,
      id: materialId,
      uploadedAt: materialData.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: actor?.id || actor?.code || 'USER',
      lastUpdatedByName: actor?.name || 'User',
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

    // 2. Nếu gán cho Khóa học cụ thể (VÀ KHÔNG PHẢI Session Recording / tài liệu riêng của lớp lẻ),
    //    đồng bộ ngay vào `courseMaterials` (Course Program Vault) của Khóa học đó
    const isClassOnlyMaterial =
      Boolean(payload.isSessionRecording) ||
      payload.targetType === 'class' ||
      Boolean(payload.classId) ||
      (Array.isArray(payload.sharedClassIds) &&
        payload.sharedClassIds.length > 0 &&
        (!Array.isArray(payload.sharedCourseIds) || payload.sharedCourseIds.length === 0));

    if (materialData.courseId && materialData.courseId !== 'ALL' && !isClassOnlyMaterial) {
      try {
        const courses = await CourseService.getAllCourses();
        const targetCourse = courses.find((c) => c.id === materialData.courseId);
        if (targetCourse) {
          const existingList = (Array.isArray(targetCourse.courseMaterials)
            ? [...targetCourse.courseMaterials]
            : []
          ).filter((m) => m && !m.isDeleted && !m.isSessionRecording);
          const existingIndex = existingList.findIndex((m) => m.id === materialId);
          if (existingIndex >= 0) {
            existingList[existingIndex] = { ...existingList[existingIndex], ...payload };
          } else {
            existingList.unshift(payload);
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
   * Chia sẻ tài liệu tới các đối tượng chỉ định (Học viên, Lớp học, Khóa học)
   * Kèm gửi thông báo Realtime Notification tới chuông của người nhận
   */
  static async shareMaterialToTargets(materialId, newTargets = [], actor, { sendNotification = true } = {}) {
    if (!materialId || !Array.isArray(newTargets) || newTargets.length === 0) return null;

    let targetDoc = null;
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, materialId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          targetDoc = { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('[MaterialService.shareMaterialToTargets] Error fetching doc:', err.message);
      }
    }

    if (!targetDoc) {
      const all = await this.getAllMaterials();
      targetDoc = all.find((m) => m.id === materialId);
    }

    if (!targetDoc) throw new Error('MATERIAL_NOT_FOUND');

    const normalized = normalizeMaterialShares(targetDoc);
    const existingShares = [...normalized.shares];
    const sharedCourseIds = new Set(normalized.sharedCourseIds || []);
    const sharedClassIds = new Set(normalized.sharedClassIds || []);
    const sharedStudentIds = new Set(normalized.sharedStudentIds || []);

    const now = new Date().toISOString();
    const addedShares = [];

    newTargets.forEach((t) => {
      const { targetType, targetId, targetName } = t;
      if (!targetType || !targetId) return;

      const cleanId = String(targetId).trim();
      const shareKey = `share_${targetType}_${cleanId}`;
      const existingIdx = existingShares.findIndex(
        (s) => s.targetType === targetType && String(s.targetId).trim() === cleanId
      );

      const shareEntry = {
        id: shareKey,
        targetType,
        targetId: cleanId,
        targetName: targetName || cleanId,
        sharedAt: now,
        sharedBy: actor?.id || actor?.code || 'USER',
        sharedByName: actor?.name || 'Academic Coordinator',
      };

      if (existingIdx >= 0) {
        existingShares[existingIdx] = shareEntry;
      } else {
        existingShares.push(shareEntry);
        addedShares.push(shareEntry);
      }

      if (targetType === 'student') sharedStudentIds.add(cleanId);
      if (targetType === 'class') sharedClassIds.add(cleanId);
      if (targetType === 'course') sharedCourseIds.add(cleanId);
    });

    const updatedPayload = {
      ...targetDoc,
      shareScope: SHARE_SCOPES.CUSTOM.key,
      sharedCourseIds: Array.from(sharedCourseIds),
      sharedClassIds: Array.from(sharedClassIds),
      sharedStudentIds: Array.from(sharedStudentIds),
      shares: existingShares,
      updatedAt: now,
      lastUpdatedBy: actor?.id || actor?.code || 'USER',
      lastUpdatedByName: actor?.name || 'User',
    };

    if (IS_FIREBASE_ENABLED && db) {
      const docRef = doc(db, this.COLLECTION_NAME, materialId);
      await setDoc(docRef, updatedPayload, { merge: true });
    }

    // Gửi thông báo Realtime đến người nhận
    if (sendNotification && addedShares.length > 0) {
      try {
        await this._dispatchShareNotifications(updatedPayload, addedShares, actor);
      } catch (notiErr) {
        console.warn('[MaterialService] Error dispatching notifications:', notiErr);
      }
    }

    return updatedPayload;
  }

  /**
   * Xóa quyền truy cập (Revoke Access) của 1 đối tượng cụ thể khỏi tài liệu
   * Cập nhật tức thì 0ms trên Firestore và bộ nhớ
   */
  static async revokeMaterialAccess(materialId, targetType, targetId, actor) {
    if (!materialId || !targetType || !targetId) return null;

    const cleanTargetId = String(targetId).trim();
    let targetDoc = null;

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, materialId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          targetDoc = { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('[MaterialService.revokeMaterialAccess] Error fetching doc:', err.message);
      }
    }

    if (!targetDoc) {
      const all = await this.getAllMaterials();
      targetDoc = all.find((m) => m.id === materialId);
    }

    if (!targetDoc) throw new Error('MATERIAL_NOT_FOUND');

    const normalized = normalizeMaterialShares(targetDoc);
    const updatedShares = normalized.shares.filter(
      (s) => !(s.targetType === targetType && String(s.targetId).trim() === cleanTargetId)
    );

    const updatedCourses = normalized.sharedCourseIds.filter((cid) => cid !== cleanTargetId);
    const updatedClasses = normalized.sharedClassIds.filter((cid) => cid !== cleanTargetId);
    const updatedStudents = normalized.sharedStudentIds.filter((sid) => sid !== cleanTargetId);

    const now = new Date().toISOString();
    const updatedPayload = {
      ...targetDoc,
      shares: updatedShares,
      sharedCourseIds: updatedCourses,
      sharedClassIds: updatedClasses,
      sharedStudentIds: updatedStudents,
      updatedAt: now,
      lastUpdatedBy: actor?.id || actor?.code || 'USER',
      lastUpdatedByName: actor?.name || 'User',
    };

    if (IS_FIREBASE_ENABLED && db) {
      const docRef = doc(db, this.COLLECTION_NAME, materialId);
      await setDoc(docRef, updatedPayload, { merge: true });
    }

    return updatedPayload;
  }

  /**
   * Helper phát thông báo chuông Realtime khi chia sẻ tài liệu
   */
  static async _dispatchShareNotifications(material, addedShares = [], actor) {
    const allRecipientUserIds = new Set();
    let allClasses = [];
    try {
      allClasses = await ClassService.getAllClasses();
    } catch {
      allClasses = [];
    }

    for (const share of addedShares) {
      if (share.targetType === 'student') {
        allRecipientUserIds.add(share.targetId);
      } else if (share.targetType === 'class') {
        const matchedClass = allClasses.find((c) => c.id === share.targetId);
        if (matchedClass) {
          if (Array.isArray(matchedClass.studentIds)) {
            matchedClass.studentIds.forEach((sid) => allRecipientUserIds.add(sid));
          }
          if (matchedClass.teacherId) {
            allRecipientUserIds.add(matchedClass.teacherId);
          }
        }
      } else if (share.targetType === 'course') {
        const courseClasses = allClasses.filter((c) => c.courseId === share.targetId);
        courseClasses.forEach((cls) => {
          if (Array.isArray(cls.studentIds)) {
            cls.studentIds.forEach((sid) => allRecipientUserIds.add(sid));
          }
        });
      }
    }

    // Gửi thông báo đến từng người dùng
    for (const recipientId of allRecipientUserIds) {
      try {
        const noti = await NotificationService.sendNotification({
          recipientId,
          type: NOTIFICATION_TYPES.MATERIAL_SHARED || 'MATERIAL_SHARED',
          title: `Tài liệu mới: ${material.title}`,
          message: `Bạn vừa được chia sẻ tài liệu học tập "${material.title}". Nhấn để xem ngay.`,
          actionUrl: `/learning-materials?materialId=${material.id}`,
          metadata: {
            materialId: material.id,
            materialTitle: material.title,
            shareScope: material.shareScope,
          },
          createdBy: actor?.id || 'ACADEMIC',
          createdByName: actor?.name || 'Giáo Vụ LAK',
          createdByRole: actor?.role || 'academic',
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lak_notification_dispatched', { detail: noti }));
        }
      } catch (err) {
        console.warn(`[Notification] Failed to send material noti to ${recipientId}:`, err.message);
      }
    }
  }

  /**
   * Lọc và phân quyền tài liệu theo đúng Role và Phân quyền của Người Dùng (Access Invariant)
   */
  static getMaterialsForUser(allMaterials = [], user = null, userClasses = []) {
    if (!Array.isArray(allMaterials)) return [];
    if (!user) {
      return allMaterials.filter((m) => {
        const norm = normalizeMaterialShares(m);
        return norm.shareScope === SHARE_SCOPES.ALL.key;
      });
    }

    const userRole = user.role || 'student';
    const userId = String(user.id || user.code || '').trim();

    // 1. Admin, Director, Academic: Xem toàn bộ kho tài liệu
    if (['admin', 'director', 'academic'].includes(userRole)) {
      return allMaterials.map(normalizeMaterialShares);
    }

    // 2. Teacher (Giáo viên bản xứ)
    if (userRole === 'teacher') {
      const myTeachingClassIds = new Set(
        (userClasses || [])
          .filter((c) => c.teacherId === userId || c.teacherName === user.name)
          .map((c) => c.id)
      );
      const myCourseIds = new Set(
        (userClasses || [])
          .filter((c) => c.teacherId === userId)
          .map((c) => c.courseId)
          .filter(Boolean)
      );

      return allMaterials.map(normalizeMaterialShares).filter((item) => {
        if (item.isDeleted) return false;
        // Xem tài liệu toàn trường hoặc nội bộ giáo viên
        if (item.shareScope === SHARE_SCOPES.ALL.key || item.shareScope === SHARE_SCOPES.STAFF_ONLY.key) return true;
        if (item.visibility === 'TEACHERS_ONLY' || item.visibility === 'ALL') {
          if (!item.sharedClassIds?.length && !item.sharedStudentIds?.length && !item.sharedCourseIds?.length) return true;
        }
        // Xem tài liệu gán cho lớp mình dạy
        if (item.sharedClassIds && item.sharedClassIds.some((cid) => myTeachingClassIds.has(cid))) return true;
        // Xem tài liệu gán cho khóa mình dạy (chỉ áp dụng nếu không bị giới hạn riêng theo lớp)
        const isClassRestrictedTeacher =
          Boolean(item.isSessionRecording) ||
          item.targetType === 'class' ||
          (Array.isArray(item.sharedClassIds) && item.sharedClassIds.length > 0);
        if (!isClassRestrictedTeacher && item.sharedCourseIds && item.sharedCourseIds.some((cid) => myCourseIds.has(cid))) return true;
        // Xem tài liệu do chính mình tải lên
        if (item.lastUpdatedBy === userId) return true;
        return false;
      });
    }

    // 3. Student (Học viên)
    if (userRole === 'student') {
      const enrolledSet = new Set([
        ...(Array.isArray(user.enrolledClassIds) ? user.enrolledClassIds : (user.classId ? [user.classId] : [])),
      ]);
      const myStudentClasses = (userClasses || []).filter(
        (c) => enrolledSet.has(c.id) || (Array.isArray(c.studentIds) && c.studentIds.includes(userId))
      );
      const studentEnrolledClassIds = new Set([
        ...enrolledSet,
        ...myStudentClasses.map((c) => c.id),
      ]);
      const studentCourseIds = new Set([
        ...(user.courseId ? [user.courseId] : []),
        ...myStudentClasses.map((c) => c.courseId).filter(Boolean),
      ]);

      return allMaterials.map(normalizeMaterialShares).filter((item) => {
        if (item.isDeleted) return false;
        // Chặn tuyệt đối tài liệu nội bộ giáo viên
        if (item.shareScope === SHARE_SCOPES.STAFF_ONLY.key || item.visibility === 'TEACHERS_ONLY') {
          return false;
        }
        // 1. Tài liệu chia sẻ đích danh cho học viên này
        if (item.sharedStudentIds && item.sharedStudentIds.includes(userId)) {
          return true;
        }
        // 2. Tài liệu chia sẻ cho lớp học viên đang tham gia
        if (item.sharedClassIds && item.sharedClassIds.some((cid) => studentEnrolledClassIds.has(cid))) {
          return true;
        }
        // 3. Tài liệu chia sẻ cho khóa học viên đang học (CHỈ áp dụng cho tài liệu cấp khóa học, KHÔNG áp dụng cho tài liệu đã giới hạn theo lớp hoặc video buổi học)
        const isClassRestrictedStudent =
          Boolean(item.isSessionRecording) ||
          item.targetType === 'class' ||
          (Array.isArray(item.sharedClassIds) && item.sharedClassIds.length > 0);
        if (!isClassRestrictedStudent && item.sharedCourseIds && item.sharedCourseIds.some((cid) => studentCourseIds.has(cid))) {
          return true;
        }
        // 4. Tài liệu công khai toàn trường không giới hạn lớp/học viên
        if (
          item.shareScope === SHARE_SCOPES.ALL.key &&
          (!item.sharedClassIds || item.sharedClassIds.length === 0) &&
          (!item.sharedStudentIds || item.sharedStudentIds.length === 0)
        ) {
          return true;
        }
        return false;
      });
    }

    return [];
  }

  /**
   * Xóa tài liệu học tập / video ghi hình:
   * 1. Xóa mềm trên `learning_materials` & gỡ khỏi `courses.courseMaterials` (F5 không bao giờ sống lại).
   * 2. Nếu tệp được upload lên Google Drive thông qua dự án này (và không còn bản ghi hoạt động nào khác dùng chung `driveFileId`),
   *    tự động chuyển tệp vào Thùng rác Google Drive (`trashed: true`) để Google Drive giữ an toàn 30 ngày rồi tự xoá vĩnh viễn.
   */
  static async deleteMaterial(materialId, courseId, actor) {
    if (!materialId) return false;

    let targetDriveFileId = '';
    const deletedAtIso = new Date().toISOString();

    // 1. Đọc thông tin tệp trước khi đánh dấu xóa mềm trên collection `learning_materials`
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, materialId);
        const existingSnap = await getDoc(docRef);
        if (existingSnap.exists()) {
          targetDriveFileId = DriveStorageService.extractDriveFileId(existingSnap.data());
        }
        await setDoc(
          docRef,
          {
            isDeleted: true,
            driveTrashed: Boolean(targetDriveFileId),
            deletedAt: deletedAtIso,
            deletedBy: actor?.id || actor?.code || '',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not soft delete from learning_materials:', err);
      }
    }

    // 2. Xóa khỏi Khóa học tương ứng (Course Program Vault) để F5 không bao giờ sống lại
    try {
      const courses = await CourseService.getAllCourses();
      const candidateCourses =
        courseId && courseId !== 'ALL'
          ? (courses || []).filter((c) => c.id === courseId)
          : (courses || []).filter(
              (c) =>
                Array.isArray(c.courseMaterials) &&
                c.courseMaterials.some((m) => m && m.id === materialId)
            );

      for (const targetCourse of candidateCourses) {
        const currentRaw = Array.isArray(targetCourse.courseMaterials)
          ? targetCourse.courseMaterials
          : [];
        if (!targetDriveFileId) {
          const matchedInCourse = currentRaw.find((m) => m && m.id === materialId);
          if (matchedInCourse) {
            targetDriveFileId = DriveStorageService.extractDriveFileId(matchedInCourse);
          }
        }
        const updatedMaterials = currentRaw.filter(
          (m) => m && m.id !== materialId && !m.isDeleted && !m.isSessionRecording
        );
        if (updatedMaterials.length !== currentRaw.length) {
          await CourseService.updateCourseMaterials(targetCourse.id, updatedMaterials, actor);
        }
      }
    } catch (err) {
      console.warn('Could not remove material from course:', err);
    }

    // 3. Chuyển tệp vật lý trên Google Drive vào Thùng rác (30 ngày tự xoá) nếu không còn bản ghi active nào tham chiếu
    // CHỐT BẢO VỆ SHARED-DRIVE (PROD + DEV): Trên môi trường DEV, tuyệt đối KHÔNG xóa vật lý file trên Google Drive
    // để bảo vệ an toàn 100% đường dẫn file đang dùng chung với Production!
    if (targetDriveFileId && !IS_DEVELOPMENT_FIREBASE) {
      try {
        let stillReferenced = false;
        if (IS_FIREBASE_ENABLED && db) {
          const allSnap = await getDocs(collection(db, this.COLLECTION_NAME));
          allSnap.forEach((d) => {
            if (stillReferenced || d.id === materialId) return;
            const data = d.data();
            if (data && !data.isDeleted) {
              const otherDriveId = DriveStorageService.extractDriveFileId(data);
              if (otherDriveId && otherDriveId === targetDriveFileId) {
                stillReferenced = true;
              }
            }
          });
        }

        if (!stillReferenced) {
          await DriveStorageService.moveFileToTrash(targetDriveFileId);
        }
      } catch (trashErr) {
        console.warn('[MaterialService] Could not move Drive file to Trash:', trashErr);
      }
    }

    return true;
  }

  /**
   * Lọc danh sách học liệu ĐÃ ĐƯỢC CHIA SẺ cho một lớp học cụ thể (dùng cho ô Autocomplete Soạn Giáo Án)
   * - Ưu tiên 1: Tài liệu chia sẻ trực tiếp cho lớp (`sharedClassIds` chứa `cls.id`)
   * - Ưu tiên 2: Tài liệu chia sẻ theo khóa học của lớp (`sharedCourseIds` chứa `cls.courseId`, không bị giới hạn lớp khác)
   * - Ưu tiên 3: Tài liệu công khai toàn trường (`shareScope === 'ALL'`, không giới hạn lớp/học viên)
   * - Loại trừ: Tài liệu đã xóa, video ghi hình buổi học cũ (`isSessionRecording`), và tài liệu nội bộ chỉ dành cho GV (`STAFF_ONLY` / `TEACHERS_ONLY`)
   */
  static getMaterialsSharedForClass(allMaterials = [], cls = null) {
    if (!Array.isArray(allMaterials) || !cls) return [];
    const classId = String(cls.id || cls.code || '').trim();
    const courseId = String(cls.courseId || '').trim();
    if (!classId) return [];

    const matched = [];
    const seenIds = new Set();

    allMaterials.forEach((raw) => {
      if (!raw || raw.isDeleted || raw.isSessionRecording) return;
      const item = normalizeMaterialShares(raw);
      if (item.shareScope === SHARE_SCOPES.STAFF_ONLY.key || item.visibility === 'TEACHERS_ONLY') {
        return;
      }

      const id = String(item.id || '');
      if (!id || seenIds.has(id)) return;

      const sharedClasses = (item.sharedClassIds || []).map((x) => String(x).trim());
      const sharedCourses = (item.sharedCourseIds || []).map((x) => String(x).trim());
      const sharedStudents = (item.sharedStudentIds || []).map((x) => String(x).trim());

      const isDirectClassShare = sharedClasses.includes(classId);
      const isRestrictedToOtherClasses = sharedClasses.length > 0 && !isDirectClassShare;
      const isRestrictedToSpecificStudents = sharedStudents.length > 0 && !isDirectClassShare;

      if (isRestrictedToOtherClasses || isRestrictedToSpecificStudents) return;

      const isCourseShare =
        Boolean(courseId) &&
        (sharedCourses.includes(courseId) || String(item.courseId || '').trim() === courseId);
      const isGlobalPublic =
        item.shareScope === SHARE_SCOPES.ALL.key &&
        sharedClasses.length === 0 &&
        sharedStudents.length === 0;

      if (isDirectClassShare || isCourseShare || isGlobalPublic) {
        seenIds.add(id);
        matched.push({
          ...item,
          matchScope: isDirectClassShare ? 'CLASS' : isCourseShare ? 'COURSE' : 'ALL',
          matchPriority: isDirectClassShare ? 0 : isCourseShare ? 1 : 2,
        });
      }
    });

    return matched.sort((a, b) => {
      if (a.matchPriority !== b.matchPriority) return a.matchPriority - b.matchPriority;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  /**
   * Bộ lọc đa chiều cho tài liệu (Tìm kiếm, Khóa học, Định dạng, Quyền xem)
   */
  static filterMaterials(materials = [], { searchTerm = '', courseId = 'ALL', type = 'ALL', user = null, userRole = 'admin', userClasses = [] } = {}) {
    const userScoped = this.getMaterialsForUser(materials, user || { role: userRole }, userClasses);

    return userScoped.filter((item) => {
      // 1. Lọc theo Khóa học
      if (courseId && courseId !== 'ALL') {
        if (item.courseId !== courseId && (!item.sharedCourseIds || !item.sharedCourseIds.includes(courseId))) {
          return false;
        }
      }

      // 2. Lọc theo Phân loại học liệu
      if (type && type !== 'ALL') {
        if (item.type !== type) return false;
      }

      // 3. Tìm kiếm từ khóa
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(term);
        const matchCourse = (item.courseName || '').toLowerCase().includes(term);
        const matchDesc = (item.description || '').toLowerCase().includes(term);
        const matchShare = (item.shares || []).some((s) => (s.targetName || '').toLowerCase().includes(term));
        if (!matchTitle && !matchCourse && !matchDesc && !matchShare) return false;
      }

      return true;
    });
  }
}
