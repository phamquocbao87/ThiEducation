import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, IS_FIREBASE_ENABLED } from '../../../core/services/firebase';
import { BaseModuleService } from '../../../shared/services/BaseModuleService';
import { PermissionService } from '../../../core/services/PermissionService';
import { UserAuditService } from './UserAuditService';
import {
  USER_ROLES,
  USER_STATUS,
  AUDIT_ACTIONS,
  ROLE_LABELS,
  resolveAuthProvidersByEmail,
  normalizePhoneNumber,
  toEnglishName,
  generateFamilyId,
} from '../models/user.model';
import { buildAllSystemUsersDirectory } from '../../../core/context/AuthContext';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

/**
 * Loại bỏ triệt để các trường có giá trị undefined trước khi ghi vào Firestore (hỗ trợ đệ quy)
 */
const sanitizeFirestoreData = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeFirestoreData);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = typeof val === 'object' && val !== null ? sanitizeFirestoreData(val) : val;
    }
  }
  return clean;
};

export class UserService extends BaseModuleService {
  static COLLECTION_NAME = 'users';

  /**
   * Lấy danh sách toàn bộ Users trong hệ thống (Đọc Firestore, fallback bộ nhớ)
   */
  static async getAllUsers() {
    let firestoreUsers = [];

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.COLLECTION_NAME);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const rawDocs = snap.docs.map((d) => ({ ...d.data(), firestoreDocId: d.id }));
          const seen = new Set();
          firestoreUsers = rawDocs.filter((u) => {
            if (u.isDeleted || u.isMock) return false;
            const key = u.id || u.code || u.firestoreDocId;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      } catch (err) {
        console.warn('[UserService] Lỗi đọc Firestore, dùng danh bạ hệ thống:', err.message);
      }
    }

    if (firestoreUsers.length > 0) {
      return firestoreUsers;
    }

    // Fallback nếu chưa seed lên Firestore
    const defaultDirectory = buildAllSystemUsersDirectory();
    return defaultDirectory.map((u) => ({
      ...u,
      status: u.status || USER_STATUS.ACTIVE,
      authProviders: u.authProviders || ['google', 'password'],
      createdAt: u.createdAt || '2026-11-05T00:00:00.000Z',
    }));
  }

  /**
   * Lấy chi tiết thông tin của một người dùng theo ID / Mã Code
   */
  static async getUserById(userId) {
    if (!userId) return null;
    const cleanId = String(userId).trim();

    // 1. Tìm trong Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const defaultDirectory = buildAllSystemUsersDirectory();
        const matchedDefault = defaultDirectory.find(
          (u) =>
            u.id?.toLowerCase() === cleanId.toLowerCase() ||
            u.code?.toLowerCase() === cleanId.toLowerCase()
        );

        const docRef = doc(db, this.COLLECTION_NAME, cleanId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          return {
            ...(matchedDefault || {}),
            ...data,
            avatar: DriveStorageService.formatAvatarUrl(data.avatar || matchedDefault?.avatar, 400),
            firestoreDocId: snap.id,
            authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email || matchedDefault?.email),
          };
        }

        // Query tìm theo field 'code' hoặc 'id' nếu doc ID khác
        const colRef = collection(db, this.COLLECTION_NAME);
        const qCode = query(colRef, where('code', '==', cleanId));
        const snapCode = await getDocs(qCode);
        if (!snapCode.empty) {
          const data = snapCode.docs[0].data();
          return {
            ...(matchedDefault || {}),
            ...data,
            avatar: DriveStorageService.formatAvatarUrl(data.avatar || matchedDefault?.avatar, 400),
            firestoreDocId: snapCode.docs[0].id,
            authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email || matchedDefault?.email),
          };
        }
      } catch (err) {
        console.warn('[UserService.getUserById] Lỗi đọc Firestore:', err.message);
      }
    }

    // 2. Fallback tìm trong danh bạ hệ thống
    const defaultDirectory = buildAllSystemUsersDirectory();
    const matched = defaultDirectory.find(
      (u) =>
        u.id?.toLowerCase() === cleanId.toLowerCase() ||
        u.code?.toLowerCase() === cleanId.toLowerCase()
    );
    if (matched) {
      return {
        ...matched,
        authProviders: resolveAuthProvidersByEmail(matched.email),
      };
    }

    return null;
  }

  /**
   * Kiểm tra trùng lặp Email và Số điện thoại (SĐT chính & SĐT phụ) giữa các tài khoản:
   * - Staff / Teacher: SĐT và Email bắt buộc duy nhất 100%.
   * - Student: Được phép chia sẻ SĐT phụ huynh với anh/chị/em trong cùng 1 gia đình (cùng familyId).
   * - SĐT chính và SĐT phụ trên cùng 1 tài khoản không được trùng nhau.
   */
  static async checkDuplicateContact({
    email,
    phoneNumber,
    secondaryPhone = '',
    familyId = null,
    targetRole = null,
    excludeUserId = null,
    actorUser = null,
  }) {
    if (!IS_FIREBASE_ENABLED || !db) return;

    try {
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';
      const cleanPhone = normalizePhoneNumber(phoneNumber);
      const cleanSecondary = normalizePhoneNumber(secondaryPhone);
      const exclude = excludeUserId ? String(excludeUserId).trim().toUpperCase() : null;

      // 1. Không cho trùng SĐT chính và SĐT phụ trên cùng 1 tài khoản
      if (cleanPhone && cleanSecondary && cleanPhone === cleanSecondary) {
        throw new Error('Số điện thoại phụ không được trùng với số điện thoại chính.');
      }

      const colRef = collection(db, this.COLLECTION_NAME);
      const snap = await getDocs(colRef);
      if (snap.empty) return;

      for (const d of snap.docs) {
        const u = d.data();
        if (u.isDeleted || u.isMock) continue;
        const uId = (u.id || u.code || d.id || '').toUpperCase();
        if (exclude && uId === exclude) continue;

        // 2. Kiểm tra trùng Email: Email là duy nhất 100% trên toàn hệ thống
        if (cleanEmail && u.email && String(u.email).trim().toLowerCase() === cleanEmail) {
          throw new Error(
            `Địa chỉ email '${cleanEmail}' đã được đăng ký cho tài khoản ${u.name} (${u.code || u.id} - ${u.roleLabel || u.role}). Mỗi tài khoản phải có một email duy nhất.`
          );
        }

        const existingPhone = normalizePhoneNumber(u.phoneNumber);

        // 3. Kiểm tra trùng Số điện thoại CHÍNH (SĐT phụ không dùng đăng nhập nên không chặn)
        if (cleanPhone) {
          const isMatchPrimary = existingPhone && existingPhone === cleanPhone;

          if (isMatchPrimary) {
            // Trường hợp A: Cả 2 đều là Học Viên -> Cho phép chia sẻ SĐT phụ huynh (anh chị em ruột trong gia đình)
            const targetIsStudent = String(targetRole || '').toLowerCase() === USER_ROLES.STUDENT.toLowerCase();
            const existingIsStudent = String(u.role || '').toLowerCase() === USER_ROLES.STUDENT.toLowerCase();
            if (targetIsStudent && existingIsStudent) {
              continue;
            }

            // Trường hợp B: Tài khoản hiện tại `u` là Cán bộ / Lãnh đạo (Admin, Director, Academic, Accountant, Teacher)
            if (u.role !== USER_ROLES.STUDENT) {
              const actorId = (actorUser?.id || actorUser?.code || '').toUpperCase();
              const targetStaffId = (u.id || u.code || '').toUpperCase();
              const isActorTheStaffMember = Boolean(actorId && actorId === targetStaffId);
              const isActorAdmin = actorUser?.role === 'admin' || actorId === 'ADM001';

              // [CHỐT CHẶN BẢO MẬT]: Chỉ DUY NHẤT chính Cán bộ đó hoặc IT Admin tối cao mới được phép khai báo con dùng SĐT của Cán bộ!
              // Giáo vụ (academic) hoặc người khác cố tình dùng SĐT của Cán bộ lãnh đạo sẽ bị CHẶN ĐỨNG NGAY!
              if (!isActorTheStaffMember && !isActorAdmin) {
                UserAuditService.logAction({
                  actor: actorUser || { id: 'ANONYMOUS', name: 'Unknown', role: 'unknown' },
                  action: AUDIT_ACTIONS.SECURITY_ALERT || 'SECURITY_ALERT',
                  target: u,
                  description: `CẢNH BÁO BẢO MẬT: Người dùng '${actorUser?.name || 'Unknown'}' (${actorUser?.role || 'unknown'}) cố tình dùng Số điện thoại của Cán bộ '${u.name}' (${u.roleLabel || u.role}) để tạo/sửa tài khoản. Hệ thống đã chặn đứng.`,
                }).catch(() => {});

                throw new Error(
                  `CẢNH BÁO BẢO MẬT: Số điện thoại '${cleanPhone}' thuộc về Cán bộ/Lãnh đạo ${u.name} (${u.roleLabel || u.role}). Bạn không có quyền sử dụng số điện thoại của Cán bộ khác để đăng ký tài khoản.`
                );
              }

              // Được phép nếu chính Cán bộ hoặc Admin tối cao tạo con
              continue;
            }

            throw new Error(
              `Số điện thoại chính '${cleanPhone}' đã được đăng ký cho tài khoản ${u.name} (${u.code || u.id} - ${u.roleLabel || u.role}). Mỗi tài khoản cán bộ/giáo viên phải có số điện thoại riêng biệt.`
            );
          }
        }
      }
    } catch (err) {
      if (
        err.message &&
        (err.message.includes('đã được đăng ký') ||
          err.message.includes('Số điện thoại phụ không được trùng') ||
          err.message.includes('CẢNH BÁO BẢO MẬT'))
      ) {
        throw err;
      }
      console.warn('[UserService.checkDuplicateContact] Lỗi kiểm tra trùng:', err.message);
    }
  }

  /**
   * Lấy danh sách thành viên cùng một Cụm Gia Đình (Family Cluster)
   */
  static async getFamilyMembers(familyId) {
    if (!familyId || !IS_FIREBASE_ENABLED || !db) return [];
    try {
      const colRef = collection(db, this.COLLECTION_NAME);
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => !u.isDeleted && !u.isMock && u.familyId === familyId);
    } catch (err) {
      console.error('[UserService.getFamilyMembers Error]:', err);
      return [];
    }
  }

  /**
   * Tìm kiếm tất cả học viên liên kết với SĐT của phụ huynh (tìm trên cả SĐT chính & SĐT phụ)
   */
  static async findStudentsByParentPhone(phone) {
    const clean = normalizePhoneNumber(phone);
    if (!clean || !IS_FIREBASE_ENABLED || !db) return [];
    try {
      const colRef = collection(db, this.COLLECTION_NAME);
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => {
          if (u.isDeleted || u.isMock || u.role !== USER_ROLES.STUDENT) return false;
          const p1 = normalizePhoneNumber(u.phoneNumber);
          const p2 = normalizePhoneNumber(u.secondaryPhone);
          return p1 === clean || p2 === clean;
        });
    } catch (err) {
      console.error('[UserService.findStudentsByParentPhone Error]:', err);
      return [];
    }
  }

  /**
   * Đồng bộ danh sách học viên ghi danh vào bộ lưu trữ Lớp học
   */
  static syncStudentClasses(studentId, enrolledClassIds = []) {
    if (typeof window === 'undefined' || !studentId) return;
    try {
      const rawClasses = localStorage.getItem('lak_erp_classes');
      if (!rawClasses) return;
      const classes = JSON.parse(rawClasses);
      if (!Array.isArray(classes)) return;

      const targetId = String(studentId).trim();
      const targetClassIds = Array.isArray(enrolledClassIds) ? enrolledClassIds : [];

      const updated = classes.map((cls) => {
        const studentSet = new Set(Array.isArray(cls.studentIds) ? cls.studentIds : []);
        if (targetClassIds.includes(cls.id) || targetClassIds.includes(cls.classId)) {
          studentSet.add(targetId);
        } else {
          studentSet.delete(targetId);
        }
        return {
          ...cls,
          studentIds: Array.from(studentSet),
          totalStudents: studentSet.size,
        };
      });

      localStorage.setItem('lak_erp_classes', JSON.stringify(updated));
    } catch (e) {
      console.warn('[UserService.syncStudentClasses] Error:', e.message);
    }
  }

  /**
   * Tạo / Đăng ký Người dùng mới với kiểm tra RBAC nghiêm ngặt:
   * - Admin: Toàn quyền tạo Giám đốc, Admin, Giáo vụ, Giáo viên, Kế toán, Học viên
   * - Giáo vụ: CHỈ được tạo Giáo vụ, Giáo viên, Học viên (CẤM tạo Admin hoặc Giám đốc)
   *
   * QUY TẮC NGHIỆP VỤ BẮT BUỘC:
   * 1. Director, Admin, Academic, Teacher, Accountant: Bắt buộc có Email
   * 2. Student: Cho phép không có Email nhưng bắt buộc phải có Số điện thoại (1 trong 2 trường)
   * 3. Số điện thoại và Email không được trùng giữa các tài khoản
   */
  static async createUser(actorUser, userData) {
    if (!actorUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const targetRole = userData.role || USER_ROLES.STUDENT;
    const allowedRoles = PermissionService.getAllowedCreatableRoles(actorUser.role);

    if (!allowedRoles.includes(targetRole)) {
      throw new Error(
        `Vai trò '${actorUser.role}' không được phép tạo tài khoản có vai trò '${targetRole}'.`
      );
    }

    const cleanEmail = userData.email ? String(userData.email).trim().toLowerCase() : '';
    const cleanPhone = normalizePhoneNumber(userData.phoneNumber);
    const cleanSecondaryPhone = normalizePhoneNumber(userData.secondaryPhone);
    const cleanEnglishName = userData.englishName?.trim() || toEnglishName(userData.name) || '';
    
    // Tự động tìm cụm gia đình của anh/chị/em đã có sẵn trong hệ thống qua SĐT chính hoặc SĐT phụ
    let targetFamilyId = userData.familyId;
    if (targetRole === USER_ROLES.STUDENT && !targetFamilyId) {
      const existingSiblings = [
        ...(await this.findStudentsByParentPhone(cleanPhone)),
        ...(cleanSecondaryPhone ? await this.findStudentsByParentPhone(cleanSecondaryPhone) : []),
      ];
      const matchedWithFamily = existingSiblings.find((s) => s.familyId);
      if (matchedWithFamily && matchedWithFamily.familyId) {
        targetFamilyId = matchedWithFamily.familyId;
      } else if (existingSiblings.length > 0) {
        targetFamilyId = generateFamilyId(existingSiblings[0].phoneNumber || cleanPhone);
      } else {
        targetFamilyId = generateFamilyId(cleanPhone);
      }
    } else if (!targetFamilyId && targetRole === USER_ROLES.STUDENT) {
      targetFamilyId = generateFamilyId(cleanPhone);
    }
    const parentUserId = userData.parentUserId || '';

    // 1. Số điện thoại là BẮT BUỘC cho tất cả các tài khoản
    if (!cleanPhone) {
      throw new Error('Số điện thoại là thông tin bắt buộc đối với tất cả các tài khoản.');
    }

    // 2. Tên Tiếng Anh (English Name) là BẮT BUỘC cho tất cả các tài khoản
    if (!cleanEnglishName) {
      throw new Error('Tên tiếng Anh (English Name) là thông tin bắt buộc.');
    }

    // 3. Kiểm tra điều kiện bắt buộc Email theo vai trò (Cán bộ/GV bắt buộc có email, Học viên không bắt buộc)
    if (targetRole !== USER_ROLES.STUDENT) {
      if (!cleanEmail) {
        throw new Error(
          `Tài khoản vai trò '${ROLE_LABELS.vi[targetRole] || targetRole}' bắt buộc phải có địa chỉ Email để vận hành công vụ.`
        );
      }
    }

    // 4. Kiểm tra tính duy nhất (cho phép dùng chung SĐT trong cùng cụm gia đình)
    await this.checkDuplicateContact({
      email: cleanEmail,
      phoneNumber: cleanPhone,
      secondaryPhone: cleanSecondaryPhone,
      familyId: targetFamilyId,
      targetRole,
      actorUser,
    });

    // Sinh mã tự động nếu chưa có
    const userCode = userData.code || userData.id || this.generateUserCode(targetRole);
    const userId = userCode;

    const newUser = {
      ...userData,
      id: userId,
      code: userCode,
      name: userData.name?.trim(),
      englishName: cleanEnglishName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      secondaryPhone: cleanSecondaryPhone || '',
      parentPhone: userData.parentPhone || cleanPhone,
      tuitionStatus: userData.tuitionStatus || 'Chờ đối soát',
      enrolledClassIds: userData.enrolledClassIds || [],
      familyId: targetFamilyId || '',
      parentUserId: parentUserId || '',
      role: targetRole,
      roleLabel: ROLE_LABELS.vi[targetRole] || targetRole,
      status: userData.status || USER_STATUS.ACTIVE,
      authProviders: resolveAuthProvidersByEmail(cleanEmail),
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userCode)}`,
      extraInfo: userData.extraInfo || '',
      createdBy: actorUser.id || actorUser.code || 'SYSTEM',
      createdByName: actorUser.name || 'Quản trị viên',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Lưu vào Cloud Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, userId);
        await setDoc(docRef, sanitizeFirestoreData(newUser));

        // Đồng bộ familyId cho các anh chị em cùng cụm nếu chưa có hoặc khác mã
        if (targetRole === USER_ROLES.STUDENT && targetFamilyId) {
          try {
            const siblingsToSync = [
              ...(await this.findStudentsByParentPhone(cleanPhone)),
              ...(cleanSecondaryPhone ? await this.findStudentsByParentPhone(cleanSecondaryPhone) : []),
            ];
            for (const s of siblingsToSync) {
              const sDocId = s.firestoreDocId || s.id || s.code;
              if (sDocId && sDocId !== userId && s.familyId !== targetFamilyId) {
                await setDoc(doc(db, this.COLLECTION_NAME, sDocId), { familyId: targetFamilyId }, { merge: true });
              }
            }
          } catch (syncErr) {
            console.warn('[UserService.createUser] Lỗi đồng bộ familyId anh chị em:', syncErr.message);
          }
        }
      } catch (err) {
        console.error('[UserService] Lỗi lưu Firestore:', err.message);
        throw new Error(`Lỗi lưu vào Cloud Firestore: ${err.message}`);
      }
    }

    // 4. Tự động ghi nhật ký Audit Log
    await UserAuditService.logAction({
      actor: actorUser,
      action: AUDIT_ACTIONS.CREATE_USER,
      target: newUser,
      description: `${actorUser.name} (${actorUser.role}) đã tạo tài khoản mới: ${newUser.name} (${newUser.code} - ${newUser.roleLabel})`,
      changes: { newRecord: newUser },
    });

    // 5. Đồng bộ ghi danh vào các lớp học thực tế
    if (targetRole === USER_ROLES.STUDENT && Array.isArray(userData.enrolledClassIds)) {
      this.syncStudentClasses(userId, userData.enrolledClassIds);
    }

    return newUser;
  }

  /**
   * Kích hoạt hoặc Vô hiệu hóa (Disable) tài khoản theo ma trận RBAC:
   * - Admin: Đổi trạng thái mọi tài khoản ngoại trừ chính mình & Root Admin
   * - Giám đốc: Đổi trạng thái Giáo vụ & Học viên
   * - Giáo vụ: Chỉ đổi trạng thái Học viên
   */
  static async toggleUserStatus(actorUser, targetUser, newStatus) {
    if (!actorUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    if (!PermissionService.canChangeUserStatus(actorUser, targetUser)) {
      throw new Error('Bạn không có quyền thay đổi trạng thái hoạt động của tài khoản này.');
    }

    const targetDocId = targetUser.firestoreDocId || targetUser.id || targetUser.code;
    const previousStatus = targetUser.status || USER_STATUS.ACTIVE;
    const action =
      newStatus === USER_STATUS.ACTIVE
        ? AUDIT_ACTIONS.ACTIVATE_USER
        : AUDIT_ACTIONS.DISABLE_USER;

    // 1. Cập nhật Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, targetDocId);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: actorUser.name || actorUser.id,
        });
      } catch (err) {
        console.warn('[UserService] Lỗi cập nhật Firestore, ghi nhận thay đổi local:', err.message);
      }
    }

    // 2. Tự động ghi nhật ký Audit Log
    await UserAuditService.logAction({
      actor: actorUser,
      action,
      target: targetUser,
      description: `${actorUser.name} (${actorUser.role}) đã ${newStatus === USER_STATUS.ACTIVE ? 'KÍCH HOẠT' : 'KHÓA / VÔ HIỆU HÓA'} tài khoản ${targetUser.name} (${targetUser.code || targetUser.id})`,
      changes: { previousStatus, newStatus },
    });

    return { ...targetUser, status: newStatus };
  }

  /**
   * Xóa MỀM (Soft-Delete) tài khoản người dùng:
   * - KHÔNG XÓA DỮ LIỆU KHỎI DATABASE: Đặt cờ isDeleted = true, lưu thời gian, người xóa và lý do xóa.
   * - Bắt buộc nhập lý do xóa để đảm bảo tính minh bạch & kiểm toán nghiệp vụ.
   * - Tuân thủ ma trận RBAC: Admin (trừ chính mình & Root Admin), Director (xóa Academic, Student), Academic (xóa Student).
   */
  static async deleteUser(actorUser, targetUser, deleteReason = '') {
    if (!actorUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    if (!PermissionService.canDeleteUser(actorUser, targetUser)) {
      throw new Error('Bạn không có quyền xóa tài khoản này.');
    }

    const cleanReason = String(deleteReason || '').trim();
    if (!cleanReason) {
      throw new Error('Vui lòng nhập lý do xóa tài khoản để lưu vết kiểm toán.');
    }

    const targetDocId = targetUser.firestoreDocId || targetUser.id || targetUser.code;
    const now = new Date().toISOString();

    const softDeletePayload = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: actorUser.name || actorUser.id,
      deletedByRole: actorUser.role,
      deletedByEmail: actorUser.email || '',
      deleteReason: cleanReason,
      status: USER_STATUS.DELETED,
      updatedAt: now,
    };

    // 1. Cập nhật cờ xóa mềm (Soft-delete flag) trên Cloud Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, targetDocId);
        await updateDoc(docRef, softDeletePayload);
      } catch (err) {
        console.error('[UserService.deleteUser] Lỗi cập nhật cờ xóa Firestore:', err.message);
        throw new Error(`Lỗi cập nhật Firestore: ${err.message}`);
      }
    }

    // 2. Ghi nhật ký kiểm toán Audit Log chi tiết kèm lý do
    await UserAuditService.logAction({
      actor: actorUser,
      action: AUDIT_ACTIONS.DELETE_USER,
      target: targetUser,
      description: `${actorUser.name} (${actorUser.role}) đã XÓA (Soft-Delete) tài khoản ${targetUser.name} (${targetUser.code || targetUser.id}). Lý do: "${cleanReason}"`,
      changes: {
        isDeleted: true,
        deleteReason: cleanReason,
        previousStatus: targetUser.status,
      },
    });

    return {
      success: true,
      id: targetUser.id,
      code: targetUser.code,
      isDeleted: true,
      deleteReason: cleanReason,
    };
  }

  /**
   * Cập nhật thông tin chi tiết hồ sơ tài khoản (Edit User Profile):
   * - Admin: Sửa được mọi tài khoản (họ tên, email, sđt, role, avatar, ghi chú...)
   * - Giám đốc: Sửa được Giáo vụ và Học sinh
   * - Giáo vụ: Sửa được Học sinh
   * - Người dùng: Sửa được thông tin cá nhân của chính mình
   */
  static async updateUserProfile(actorUser, targetUser, updateData) {
    if (!actorUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    if (!PermissionService.canEditUser(actorUser, targetUser)) {
      throw new Error('Bạn không có quyền chỉnh sửa tài khoản này.');
    }

    const targetDocId = targetUser.firestoreDocId || targetUser.id || targetUser.code;

    const rawEmail = updateData.email !== undefined ? updateData.email : targetUser.email;
    const cleanEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';
    const rawPhone = updateData.phoneNumber !== undefined ? updateData.phoneNumber : targetUser.phoneNumber;
    const cleanPhone = normalizePhoneNumber(rawPhone);
    const rawSecondary = updateData.secondaryPhone !== undefined ? updateData.secondaryPhone : targetUser.secondaryPhone;
    const cleanSecondaryPhone = normalizePhoneNumber(rawSecondary);
    const rawEnglishName = updateData.englishName !== undefined ? updateData.englishName : (targetUser.englishName || toEnglishName(updateData.name || targetUser.name));
    const cleanEnglishName = rawEnglishName?.trim() || toEnglishName(updateData.name || targetUser.name);
    const targetRole = updateData.role || targetUser.role;
    const targetFamilyId = updateData.familyId !== undefined ? updateData.familyId : (targetUser.familyId || (targetRole === USER_ROLES.STUDENT ? generateFamilyId(cleanPhone) : ''));
    const parentUserId = updateData.parentUserId !== undefined ? updateData.parentUserId : (targetUser.parentUserId || '');

    // 1. Số điện thoại là BẮT BUỘC cho tất cả các tài khoản khi cập nhật
    if (!cleanPhone) {
      throw new Error('Số điện thoại là thông tin bắt buộc đối với tất cả các tài khoản.');
    }

    // 2. Tên Tiếng Anh (English Name) là BẮT BUỘC cho tất cả các tài khoản
    if (!cleanEnglishName) {
      throw new Error('Tên tiếng Anh (English Name) là thông tin bắt buộc.');
    }

    // 3. Kiểm tra điều kiện bắt buộc Email theo vai trò (Cán bộ/GV bắt buộc có email, Học viên không bắt buộc)
    if (targetRole !== USER_ROLES.STUDENT) {
      if (!cleanEmail) {
        throw new Error(
          `Tài khoản vai trò '${ROLE_LABELS.vi[targetRole] || targetRole}' bắt buộc phải có địa chỉ Email để vận hành công vụ.`
        );
      }
    }

    // 4. Kiểm tra trùng lặp với tài khoản khác (cho phép chung familyId)
    await this.checkDuplicateContact({
      email: cleanEmail,
      phoneNumber: cleanPhone,
      secondaryPhone: cleanSecondaryPhone,
      familyId: targetFamilyId,
      targetRole,
      excludeUserId: targetUser.id || targetUser.code,
      actorUser,
    });

    const updatedUser = {
      ...targetUser,
      ...updateData,
      name: updateData.name?.trim() || targetUser.name,
      englishName: cleanEnglishName,
      email: cleanEmail,
      authProviders: resolveAuthProvidersByEmail(cleanEmail),
      phoneNumber: cleanPhone,
      secondaryPhone: cleanSecondaryPhone || '',
      familyId: targetFamilyId || '',
      parentUserId: parentUserId || '',
      extraInfo: updateData.extraInfo !== undefined ? updateData.extraInfo : (targetUser.extraInfo || ''),
      avatar: updateData.avatar || targetUser.avatar,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUser.name || actorUser.id,
    };

    // Chỉ Admin mới được phép thay đổi Role
    if (actorUser.role === USER_ROLES.ADMIN && updateData.role && updateData.role !== targetUser.role) {
      updatedUser.role = updateData.role;
      updatedUser.roleLabel = ROLE_LABELS.vi[updateData.role] || updateData.role;
    }

    // Cho phép đổi trạng thái nếu có quyền
    if (updateData.status && updateData.status !== targetUser.status) {
      if (PermissionService.canChangeUserStatus(actorUser, targetUser)) {
        updatedUser.status = updateData.status;
      }
    }

    // Đồng bộ mật khẩu mới nếu có cập nhật
    if (updateData.password && String(updateData.password).trim()) {
      updatedUser.password = String(updateData.password).trim();
    } else if (updateData.newPassword && String(updateData.newPassword).trim()) {
      updatedUser.password = String(updateData.newPassword).trim();
    }
    delete updatedUser.newPassword;

    // 1. Cập nhật Firestore (loại bỏ triệt để các trường undefined)
    const cleanPayload = sanitizeFirestoreData(updatedUser);
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, targetDocId);
        await setDoc(docRef, cleanPayload, { merge: true });
      } catch (err) {
        console.error('[UserService.updateUserProfile] Lỗi cập nhật Firestore:', err.message);
        throw new Error(`Lỗi lưu Firestore: ${err.message}`);
      }
    }

    // 2. Ghi nhật ký kiểm toán Audit Log
    await UserAuditService.logAction({
      actor: actorUser,
      action: AUDIT_ACTIONS.UPDATE_USER,
      target: updatedUser,
      description: `${actorUser.name} (${actorUser.role}) đã CẬP NHẬT HỒ SƠ của ${updatedUser.name} (${updatedUser.code || updatedUser.id})`,
      changes: updateData,
    });

    // 3. Đồng bộ danh sách học viên ghi danh vào các lớp học thực tế
    if (targetRole === USER_ROLES.STUDENT && Array.isArray(updateData.enrolledClassIds)) {
      this.syncStudentClasses(targetUser.id || targetUser.code, updateData.enrolledClassIds);
    }

    return updatedUser;
  }

  /**
   * Cập nhật ảnh đại diện người dùng sau khi đã upload lên Google Drive:
   * - Chỉ Giáo vụ, Giám đốc và Admin mới có quyền thực hiện
   * - Lưu URL ảnh và fileId của Google Drive vào Firestore lakeducationdb
   * - Tự động ghi nhật ký Audit Log
   */
  static async updateAvatar(actorUser, targetUser, avatarUrl, fileMetadata = {}) {
    if (!actorUser) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    if (!PermissionService.canUploadAvatar(actorUser.role)) {
      throw new Error('Chỉ có Giáo vụ, Giám đốc và Admin mới có quyền cập nhật ảnh đại diện.');
    }

    const targetDocId = targetUser.firestoreDocId || targetUser.id || targetUser.code;
    const now = new Date().toISOString();
    const cleanAvatarUrl = DriveStorageService.formatAvatarUrl(avatarUrl, 400);
    const cleanOriginalUrl = fileMetadata.avatarOriginal || targetUser.avatarOriginal || cleanAvatarUrl;

    const updatedUser = {
      ...targetUser,
      avatar: cleanAvatarUrl, // Hình đã crop chuẩn khung tròn để hiển thị trên toàn hệ thống
      avatarOriginal: cleanOriginalUrl, // Hình đầy đủ nguyên vẹn (Full Original)
      avatarCropData: fileMetadata.avatarCropData || targetUser.avatarCropData || null, // Metadata crop (zoom, pan, rotation)
      avatarDriveFileId: fileMetadata.id || fileMetadata.cropFileId || targetUser.avatarDriveFileId || '',
      avatarOriginalDriveFileId: fileMetadata.originalFileId || targetUser.avatarOriginalDriveFileId || '',
      updatedAt: now,
      updatedBy: actorUser.name || actorUser.id,
    };

    // 1. Cập nhật Firestore
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const docRef = doc(db, this.COLLECTION_NAME, targetDocId);
        await setDoc(docRef, sanitizeFirestoreData(updatedUser), { merge: true });
      } catch (err) {
        console.error('[UserService.updateAvatar] Lỗi lưu Firestore:', err.message);
        throw new Error(`Lỗi cập nhật ảnh vào Firestore: ${err.message}`);
      }
    }

    // 2. Ghi nhật ký kiểm toán Audit Log
    await UserAuditService.logAction({
      actor: actorUser,
      action: AUDIT_ACTIONS.UPDATE_USER,
      target: updatedUser,
      description: `${actorUser.name} (${actorUser.role}) đã CẬP NHẬT ẢNH ĐẠI DIỆN cho ${updatedUser.name} (${updatedUser.code || updatedUser.id}) [Đầy đủ & Đã crop]`,
      changes: {
        avatar: cleanAvatarUrl,
        avatarOriginal: cleanOriginalUrl,
        driveFileId: fileMetadata.id || '',
      },
    });

    return updatedUser;
  }

  /**
   * Tự động sinh mã nhân sự / học viên theo Role
   */
  static generateUserCode(role) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    switch (role) {
      case USER_ROLES.ADMIN:
        return `ADM${randomNum}`;
      case USER_ROLES.DIRECTOR:
        return `DIR${randomNum}`;
      case USER_ROLES.ACADEMIC:
        return `ACA${randomNum}`;
      case USER_ROLES.TEACHER:
        return `GV${randomNum}`;
      case USER_ROLES.ACCOUNTANT:
        return `ACC${randomNum}`;
      case USER_ROLES.STUDENT:
      default:
        return `HV${randomNum}`;
    }
  }

  /**
   * Đồng bộ toàn bộ tài khoản mẫu (với Admin mặc định phamquocbao87@gmail.com) lên Firestore
   */
  static async seedInitialUsersToFirestore(actorUser) {
    if (!IS_FIREBASE_ENABLED || !db) return { success: false, count: 0 };

    const initialUsers = buildAllSystemUsersDirectory();
    let seededCount = 0;

    for (const u of initialUsers) {
      const docRef = doc(db, this.COLLECTION_NAME, u.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const payload = {
          ...u,
          status: USER_STATUS.ACTIVE,
          authProviders: ['google', 'password'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, payload);
        seededCount++;
      }
    }

    if (seededCount > 0 && actorUser) {
      await UserAuditService.logAction({
        actor: actorUser,
        action: AUDIT_ACTIONS.UPDATE_USER,
        target: { code: 'ALL', name: 'Database Seed', role: 'admin' },
        description: `${actorUser.name} đã đồng bộ ${seededCount} tài khoản mẫu lên Cloud Firestore lakeducationdb`,
      });
    }

    return { success: true, count: seededCount };
  }
}

