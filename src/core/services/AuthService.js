import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, IS_FIREBASE_ENABLED } from './firebase';
import { UserAuditService } from '../../modules/users/services/UserAuditService';
import {
  USER_ROLES,
  USER_STATUS,
  AUDIT_ACTIONS,
  ROLE_LABELS,
  isGmailAddress,
  resolveAuthProvidersByEmail,
  normalizePhoneNumber,
  detectLoginIdentifierType,
} from '../../modules/users/models/user.model';
import { buildAllSystemUsersDirectory } from '../context/AuthContext';

export class AuthService {
  static USERS_COLLECTION = 'users';

  /**
   * Tra cứu thông tin người dùng đã được Đăng ký / Cấp tài khoản trước trong hệ thống:
   * Hỗ trợ tìm linh hoạt theo Email, Số điện thoại (dành cho Học viên) hoặc Mã ID.
   * -> Trả về user profile nếu đã đăng ký, hoặc null nếu người dùng CHƯA ĐƯỢC ĐĂNG KÝ.
   */
  static async findRegisteredUser(identifier, uid = null) {
    const rawInput = identifier ? String(identifier).trim() : '';
    const normalizedInput = rawInput.toLowerCase();
    const cleanPhone = normalizePhoneNumber(rawInput);
    const idType = detectLoginIdentifierType(rawInput);

    const isRootAdmin =
      normalizedInput === 'phamquocbao87@gmail.com' ||
      normalizedInput === 'vnthietbigarage@gmail.com' ||
      normalizedInput === 'admin@lakeducation.com' ||
      normalizedInput === 'admin' ||
      cleanPhone === '0898794116';

    // 1. Root IT Admin luôn hợp lệ và có toàn quyền quản trị cao nhất
    if (isRootAdmin) {
      let existingAdmin = null;
      if (IS_FIREBASE_ENABLED && db) {
        try {
          const adminRef = doc(db, this.USERS_COLLECTION, 'ADM001');
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            existingAdmin = adminSnap.data();
          }
        } catch (e) {
          console.warn('[AuthService.findRegisteredUser] Lỗi đọc ADM001:', e.message);
        }
      }
      return {
        id: 'ADM001',
        code: 'ADM001',
        name: existingAdmin?.name || 'Phạm Quốc Bảo',
        email: existingAdmin?.email || 'phamquocbao87@gmail.com',
        role: USER_ROLES.ADMIN,
        roleLabel: ROLE_LABELS.vi[USER_ROLES.ADMIN],
        status: USER_STATUS.ACTIVE,
        authProviders: ['google', 'password'],
        password: existingAdmin?.password || 'LakEducation@2026',
        avatar: existingAdmin?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaoAdmin',
        phoneNumber: existingAdmin?.phoneNumber || '0898794116',
        isRootAdmin: true,
        firestoreDocId: 'ADM001',
      };
    }

    // 2. Tra cứu trong Cloud Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.USERS_COLLECTION);

        // a) Query theo Firebase UID nếu đã từng liên kết
        if (uid) {
          const qUid = query(colRef, where('uid', '==', uid));
          const snapUid = await getDocs(qUid);
          if (!snapUid.empty) {
            const matchedDoc =
              snapUid.docs.find((d) => d.id.length <= 10 && !d.id.includes('-')) ||
              snapUid.docs[0];
            const data = matchedDoc.data();
            return {
              ...data,
              password: data.password || 'LakEducation@2026',
              authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email),
              firestoreDocId: matchedDoc.id,
            };
          }
        }

        // b) Nếu là Số điện thoại -> Tra cứu DUY NHẤT theo Số điện thoại chính (phoneNumber)
        // [QUY TẮC BẮT BUỘC]: SĐT phụ (secondaryPhone) tuyệt đối không dùng để đăng nhập
        if (idType === 'phone' || cleanPhone.length >= 9) {
          const qPhone = query(colRef, where('phoneNumber', '==', cleanPhone));
          const snapPhone = await getDocs(qPhone);
          let matchedDoc = null;
          if (!snapPhone.empty) {
            const activeDocs = snapPhone.docs.filter((d) => !d.data().isDeleted && !d.data().isMock);
            if (activeDocs.length > 0) matchedDoc = activeDocs[0];
          }
          if (matchedDoc) {
            const data = matchedDoc.data();
            return {
              ...data,
              password: data.password || 'LakEducation@2026',
              authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email),
              firestoreDocId: matchedDoc.id,
            };
          }
        }

        // c) Nếu là Email -> Tra cứu theo email chính xác
        if (idType === 'email' || normalizedInput.includes('@')) {
          const qEmail = query(colRef, where('email', '==', normalizedInput));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const activeDocs = snapEmail.docs.filter((d) => !d.data().isDeleted && !d.data().isMock);
            if (activeDocs.length > 0) {
              const matchedDoc = activeDocs[0];
              const data = matchedDoc.data();
              return {
                ...data,
                password: data.password || 'LakEducation@2026',
                authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email),
                firestoreDocId: matchedDoc.id,
              };
            }
          }
        }

        // d) Nếu là Mã ID / Mã Code -> Tra cứu trực tiếp document ID hoặc field code
        if (idType === 'code' || rawInput.length <= 10) {
          const docRef = doc(db, this.USERS_COLLECTION, rawInput.toUpperCase());
          const snapCode = await getDoc(docRef);
          if (snapCode.exists()) {
            const data = snapCode.data();
            if (!data.isDeleted && !data.isMock) {
              return {
                ...data,
                password: data.password || 'LakEducation@2026',
                authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email),
                firestoreDocId: snapCode.id,
              };
            }
          }
        }

        // e) Quét fallback trong trường hợp định dạng SĐT lưu có khoảng trắng
        const snapAll = await getDocs(colRef);
        if (!snapAll.empty) {
          for (const d of snapAll.docs) {
            const u = d.data();
            if (u.isDeleted || u.isMock) continue;
            const uPhone = normalizePhoneNumber(u.phoneNumber);
            const uEmail = (u.email || '').trim().toLowerCase();
            const uCode = (u.code || u.id || d.id || '').toUpperCase();

            if (
              (cleanPhone && cleanPhone.length >= 9 && uPhone === cleanPhone) ||
              (normalizedInput && uEmail === normalizedInput) ||
              (rawInput && uCode === rawInput.toUpperCase())
            ) {
              return {
                ...u,
                password: u.password || 'LakEducation@2026',
                authProviders: u.authProviders || resolveAuthProvidersByEmail(u.email),
                firestoreDocId: d.id,
              };
            }
          }
        }
      } catch (err) {
        console.warn('[AuthService.findRegisteredUser] Lỗi query Firestore:', err.message);
      }
    }

    // 3. Tra cứu trong Danh bạ hệ thống 16 tài khoản mẫu chuẩn
    try {
      const directory = buildAllSystemUsersDirectory();
      const matched = directory.find((u) => {
        const uEmail = u.email?.trim().toLowerCase();
        const uId = u.id?.trim().toLowerCase();
        return (
          (normalizedEmail && (uEmail === normalizedEmail || uId === normalizedEmail.split('@')[0])) ||
          (uid && u.uid === uid)
        );
      });

      if (matched) {
        return {
          ...matched,
          password: matched.password || 'LakEducation@2026',
          code: matched.code || matched.id,
          status: matched.status || USER_STATUS.ACTIVE,
          authProviders: resolveAuthProvidersByEmail(matched.email),
          firestoreDocId: matched.id,
        };
      }
    } catch (e) {
      console.warn('[AuthService.findRegisteredUser] Lỗi tra cứu danh bạ hệ thống:', e.message);
    }

    // KHÔNG TÌM THẤY -> Người dùng này chưa được cấp tài khoản
    return null;
  }

  /**
   * Tra cứu toàn bộ các tài khoản liên kết với định danh đăng nhập (Email, SĐT chính, SĐT phụ, Mã ID)
   * Trả về mảng danh sách người dùng phù hợp (phục vụ trường hợp Phụ huynh có nhiều con hoặc Staff có con học).
   */
  static async findRegisteredUsers(identifier) {
    const rawInput = identifier ? String(identifier).trim() : '';
    const normalizedInput = rawInput.toLowerCase();
    const cleanPhone = normalizePhoneNumber(rawInput);
    const results = [];
    const seenIds = new Set();

    const addProfile = (profile) => {
      const idKey = (profile.id || profile.code || profile.firestoreDocId || '').toUpperCase();
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        results.push({
          ...profile,
          password: profile.password || 'LakEducation@2026',
          authProviders: profile.authProviders || resolveAuthProvidersByEmail(profile.email),
        });
      }
    };

    const isRootAdmin =
      normalizedInput === 'phamquocbao87@gmail.com' ||
      normalizedInput === 'vnthietbigarage@gmail.com' ||
      normalizedInput === 'admin@lakeducation.com' ||
      normalizedInput === 'admin' ||
      cleanPhone === '0898794116';

    if (isRootAdmin) {
      const adminUser = await this.findRegisteredUser('ADM001');
      if (adminUser) addProfile(adminUser);
    }

    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.USERS_COLLECTION);
        const snapAll = await getDocs(colRef);
        if (!snapAll.empty) {
          // Vòng 1: Tìm các tài khoản khớp trực tiếp theo SĐT CHÍNH (phoneNumber), Email hoặc Mã ID
          // [QUY TẮC BẮT BUỘC]: SĐT phụ (secondaryPhone) TUYỆT ĐỐI KHÔNG dùng để đăng nhập
          for (const d of snapAll.docs) {
            const u = d.data();
            if (u.isDeleted || u.status === USER_STATUS.DELETED) continue;
            const uPhone1 = normalizePhoneNumber(u.phoneNumber);
            const uEmail = (u.email || '').trim().toLowerCase();
            const uCode = (u.code || u.id || d.id || '').toUpperCase();

            const isMatch =
              (cleanPhone && cleanPhone.length >= 9 && uPhone1 === cleanPhone) ||
              (normalizedInput && uEmail === normalizedInput) ||
              (rawInput && uCode === rawInput.toUpperCase());

            if (isMatch) {
              addProfile({ ...u, id: u.id || d.id, code: u.code || d.id, firestoreDocId: d.id });
            }
          }

          // Vòng 2: Mở rộng cụm gia đình (familyId) hoặc con cái liên kết với Cán bộ / Giáo viên
          // [NGUYÊN TẮC BẢO MẬT]: Chỉ mở rộng Cụm gia đình khi đăng nhập bằng SỐ ĐIỆN THOẠI (cleanPhone).
          // TUYỆT ĐỐI KHÔNG mở rộng khi đăng nhập bằng Email cá nhân/công vụ (tránh leak hồ sơ con cái vào email của cha mẹ).
          const isLoggingInWithPhone = Boolean(cleanPhone && cleanPhone.length >= 9 && !rawInput.includes('@'));

          if (isLoggingInWithPhone) {
            const familyIds = new Set();
            const parentUserIds = new Set();
            const parentPhones = new Set();
            for (const r of results) {
              if (r.familyId) familyIds.add(r.familyId);
              if (r.role !== USER_ROLES.STUDENT) {
                parentUserIds.add((r.id || r.code).toUpperCase());
                if (r.phoneNumber) parentPhones.add(normalizePhoneNumber(r.phoneNumber));
              }
            }

            for (const d of snapAll.docs) {
              const u = d.data();
              if (u.isDeleted || u.status === USER_STATUS.DELETED) continue;
              const uFamily = u.familyId;
              const uParent = (u.parentUserId || '').toUpperCase();
              const uParentPhone = normalizePhoneNumber(u.parentPhone);
              const uPhone = normalizePhoneNumber(u.phoneNumber);

              if (
                (uFamily && familyIds.has(uFamily)) ||
                (uParent && parentUserIds.has(uParent)) ||
                (uParentPhone && parentPhones.has(uParentPhone)) ||
                (uPhone && parentPhones.has(uPhone) && u.role === USER_ROLES.STUDENT)
              ) {
                addProfile({ ...u, id: u.id || d.id, code: u.code || d.id, firestoreDocId: d.id });
              }
            }
          }
        }
      } catch (err) {
        console.warn('[AuthService.findRegisteredUsers] Lỗi query Firestore:', err.message);
      }
    }

    // Fallback nếu rỗng: tra cứu findRegisteredUser đơn lẻ
    if (results.length === 0) {
      const single = await this.findRegisteredUser(rawInput);
      if (single) addProfile(single);
    }

    return results;
  }

  /**
   * Đăng nhập 1 chạm bằng Google Account thật qua Firebase Auth & Kiểm tra Whitelist người dùng đã đăng ký
   */
  static async signInWithGoogle() {
    if (!IS_FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase Auth chưa được khởi tạo.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // 1. Mở cửa sổ Popup Google Sign-In chính chủ của Google
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    const email = firebaseUser.email?.trim().toLowerCase();
    const uid = firebaseUser.uid;

    if (!email) {
      await signOut(auth);
      throw new Error('Không thể lấy được địa chỉ email từ tài khoản Google của bạn.');
    }

    // 2. TRA CỨU XEM TÀI KHOẢN ĐÃ ĐƯỢC ĐĂNG KÝ TRONG HỆ THỐNG CHƯA
    const registeredUser = await this.findRegisteredUser(email, uid);

    // [QUY TẮC CỐT LÕI]: NẾU CHƯA ĐƯỢC ĐĂNG KÝ -> CHẶN ĐỨNG & THOÁT PHIÊN NGAY LẬP TỨC!
    if (!registeredUser) {
      await signOut(auth);

      // Ghi nhận nhật ký từ chối truy cập trái phép
      await UserAuditService.logAction({
        actor: {
          id: 'UNREGISTERED',
          name: firebaseUser.displayName || email,
          email,
          role: 'guest',
        },
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: {
          id: 'UNREGISTERED',
          name: firebaseUser.displayName || email,
          email,
          role: 'guest',
        },
        description: `TỪ CHỐI TRUY CẬP: Tài khoản Google (${email}) chưa được Quản trị viên hoặc Giáo vụ cấp tài khoản trong hệ thống LAK EDUCATION.`,
      });

      throw new Error(
        `Tài khoản Google (${email}) chưa được đăng ký trong hệ thống LAK EDUCATION. Vui lòng liên hệ Giáo vụ hoặc Quản trị viên để được cấp tài khoản.`
      );
    }

    // 3. KIỂM TRA TRẠNG THÁI TÀI KHOẢN: ĐÃ XÓA HAY BỊ KHÓA
    if (registeredUser.isDeleted || registeredUser.status === USER_STATUS.DELETED) {
      await signOut(auth);
      await UserAuditService.logAction({
        actor: registeredUser,
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: registeredUser,
        description: `TỪ CHỐI ĐĂNG NHẬP: Tài khoản ${registeredUser.name} (${registeredUser.email}) đã bị XÓA (Soft-deleted). Lý do: "${registeredUser.deleteReason || 'Không có'}"`,
      });
      throw new Error(
        `Tài khoản của bạn đã bị xóa khỏi hệ thống. Lý do: "${registeredUser.deleteReason || 'Liên hệ Quản trị viên'}". Vui lòng liên hệ IT Admin.`
      );
    }

    if (registeredUser.status === USER_STATUS.DISABLED) {
      await signOut(auth);

      await UserAuditService.logAction({
        actor: registeredUser,
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: registeredUser,
        description: `TỪ CHỐI ĐĂNG NHẬP: Tài khoản ${registeredUser.name} (${registeredUser.email}) đang ở trạng thái BỊ KHÓA / VÔ HIỆU HÓA.`,
      });

      throw new Error('Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa. Vui lòng liên hệ IT Admin.');
    }

    // 3.5 KIỂM TRA PHƯƠNG THỨC: Chỉ tài khoản Gmail (@gmail.com) mới được đăng nhập bằng Google
    const isRootAdmin =
      email === 'phamquocbao87@gmail.com' ||
      email === 'vnthietbigarage@gmail.com' ||
      email === 'admin@lakeducation.com' ||
      registeredUser.isRootAdmin;

    const allowedProviders = registeredUser.authProviders || resolveAuthProvidersByEmail(registeredUser.email);
    if (!allowedProviders.includes('google') && !isRootAdmin) {
      await signOut(auth);
      await UserAuditService.logAction({
        actor: registeredUser,
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: registeredUser,
        description: `TỪ CHỐI ĐĂNG NHẬP: Tài khoản ${registeredUser.name} (${registeredUser.email}) không phải Gmail cá nhân, chỉ được phép đăng nhập bằng Email/Mật khẩu.`,
      });
      throw new Error(
        `Tài khoản (${registeredUser.email}) là email công vụ, không hỗ trợ đăng nhập qua Google. Vui lòng đăng nhập bằng Email và Mật khẩu.`
      );
    }

    // 4. HỢP LỆ -> CẬP NHẬT THÔNG TIN PHIÊN ĐĂNG NHẬP & LIÊN KẾT FIREBASE UID
    const docId = registeredUser.firestoreDocId || registeredUser.id || registeredUser.code;
    const updatedProfile = {
      ...registeredUser,
      uid,
      avatar:
        firebaseUser.photoURL ||
        registeredUser.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(docId)}`,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProviders: Array.from(new Set([...(registeredUser.authProviders || []), 'google'])),
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.USERS_COLLECTION, docId), updatedProfile, { merge: true });
      } catch (err) {
        console.warn('[AuthService.signInWithGoogle] Lỗi cập nhật Firestore:', err.message);
      }
    }

    // 5. GHI NHẬN NHẬT KÝ ĐĂNG NHẬP THÀNH CÔNG
    await UserAuditService.logAction({
      actor: updatedProfile,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      target: updatedProfile,
      description: `${updatedProfile.name} (${updatedProfile.email}) đã đăng nhập thành công qua Google Account`,
    });

    return updatedProfile;
  }

  /**
   * Đăng nhập đa năng bằng Email hoặc Số điện thoại (dành cho Học viên) kèm Mật khẩu
   * Hỗ trợ chọn hồ sơ khi phụ huynh có nhiều con hoặc Staff có con học cùng trung tâm
   */
  static async signInWithEmail(identifier, password, targetUserId = null) {
    const rawInput = String(identifier || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!rawInput) {
      throw new Error('Vui lòng nhập Email hoặc Số điện thoại đăng nhập của bạn.');
    }
    if (!cleanPassword) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    // 1. TRA CỨU TẤT CẢ TÀI KHOẢN KHỚP VỚI ĐỊNH DANH (SĐT 1, SĐT 2, Email, Mã ID)
    const matchedProfiles = await this.findRegisteredUsers(rawInput);

    if (!matchedProfiles || matchedProfiles.length === 0) {
      throw new Error(
        `Tài khoản '${rawInput}' chưa được đăng ký trong hệ thống LAK EDUCATION. Vui lòng liên hệ Giáo vụ hoặc Quản trị viên để được cấp tài khoản.`
      );
    }

    // 2. [NGUYÊN TẮC BẢO MẬT BẤT KHẢ XÂM PHẠM — ROLE-STRICT CREDENTIAL ISOLATION]:
    // CHỈ LỌC RA NHỮNG HỒ SƠ CÓ MẬT KHẨU KHỚP 100% VỚI MẬT KHẨU NGƯỜI DÙNG VỪA NHẬP!
    // Tuyệt đối không dùng some(): Mật khẩu của tài khoản Học viên KHÔNG BAO GIỜ được mở tài khoản Cán bộ/Giám đốc!
    const verifiedProfiles = matchedProfiles.filter((p) => {
      const expected = p.password || 'LakEducation@2026';
      return cleanPassword === expected;
    });

    if (verifiedProfiles.length === 0) {
      await UserAuditService.logAction({
        actor: {
          id: 'UNAUTHENTICATED',
          name: rawInput,
          email: rawInput,
          role: 'guest',
        },
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: { id: rawInput, name: rawInput },
        description: `TỪ CHỐI ĐĂNG NHẬP: Sai mật khẩu cho định danh '${rawInput}'`,
      });
      throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    }

    // 2.1. NẾU CÓ NHIỀU HỒ SƠ CÙNG MẬT KHẨU HỢP LỆ (ví dụ anh em ruột được phụ huynh cấp chung mật khẩu)
    // Và người dùng chưa bấm chọn 1 hồ sơ cụ thể
    // Lưu ý: Nếu định danh là Email công vụ/cá nhân trực tiếp, ưu tiên đăng nhập thẳng vào tài khoản đó!
    const isDirectEmail = rawInput.includes('@');
    const exactEmailAccount = isDirectEmail
      ? verifiedProfiles.find((p) => p.email && p.email.trim().toLowerCase() === rawInput.toLowerCase())
      : null;

    if (!targetUserId && verifiedProfiles.length > 1 && !exactEmailAccount) {
      return {
        requireProfileSelection: true,
        matchedProfiles: verifiedProfiles.map((p) => ({
          ...p,
          linkedProfiles: verifiedProfiles,
        })),
        identifier: rawInput,
        password: cleanPassword,
      };
    }

    // 3. XÁC ĐỊNH HỒ SƠ ĐƯỢC CHỌN (TỪ DANH SÁCH ĐÃ XÁC THỰC MẬT KHẨU)
    let registeredUser = exactEmailAccount || verifiedProfiles[0];
    if (targetUserId) {
      const chosen = verifiedProfiles.find((p) => (p.id || p.code) === targetUserId);
      if (!chosen) {
        throw new Error('Mật khẩu không khớp với tài khoản được chọn.');
      }
      registeredUser = chosen;
    }

    // 4. KIỂM TRA TRẠNG THÁI TÀI KHOẢN: ĐÃ XÓA HAY BỊ KHÓA
    if (registeredUser.isDeleted || registeredUser.status === USER_STATUS.DELETED) {
      throw new Error(
        `Tài khoản của bạn đã bị xóa khỏi hệ thống. Lý do: "${registeredUser.deleteReason || 'Liên hệ Quản trị viên'}". Vui lòng liên hệ IT Admin.`
      );
    }

    if (registeredUser.status === USER_STATUS.DISABLED) {
      throw new Error('Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa. Vui lòng liên hệ IT Admin.');
    }

    // 5. XÁC THỰC CHÉO MẬT KHẨU CỦA TÀI KHOẢN ĐÍCH
    const expectedPassword = registeredUser.password || 'LakEducation@2026';
    if (cleanPassword !== expectedPassword) {
      await UserAuditService.logAction({
        actor: {
          id: registeredUser.id || registeredUser.code || 'UNAUTHENTICATED',
          name: registeredUser.name || rawInput,
          email: registeredUser.email || rawInput,
          role: registeredUser.role || 'guest',
        },
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: registeredUser,
        description: `TỪ CHỐI ĐĂNG NHẬP: Sai mật khẩu cho tài khoản ${registeredUser.name} (${rawInput})`,
      });
      throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    }

    registeredUser.linkedProfiles = verifiedProfiles;

    // 4. MẬT KHẨU KHỚP -> ĐỒNG BỘ PHIÊN FIREBASE AUTH NẾU USER CÓ EMAIL
    let firebaseUser = null;
    const userEmail = registeredUser.email?.trim().toLowerCase();

    if (IS_FIREBASE_ENABLED && auth && userEmail) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, cleanPassword);
        firebaseUser = userCredential.user;
      } catch (authError) {
        if (
          authError.code === 'auth/user-not-found' ||
          authError.code === 'auth/invalid-credential' ||
          authError.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, userEmail, cleanPassword);
            firebaseUser = newCred.user;
          } catch (createErr) {
            firebaseUser = {
              uid: registeredUser.uid || registeredUser.id || registeredUser.code,
              email: userEmail,
              displayName: registeredUser.name,
            };
          }
        } else {
          firebaseUser = {
            uid: registeredUser.uid || registeredUser.id || registeredUser.code,
            email: userEmail,
            displayName: registeredUser.name,
          };
        }
      }
    }

    // 5. CẬP NHẬT THÔNG TIN PHIÊN ĐĂNG NHẬP
    const docId = registeredUser.firestoreDocId || registeredUser.id || registeredUser.code;
    const updatedProfile = {
      ...registeredUser,
      uid: firebaseUser?.uid || registeredUser.uid || docId,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.USERS_COLLECTION, docId), { lastLoginAt: updatedProfile.lastLoginAt }, { merge: true });
      } catch (err) {
        console.warn('[AuthService.signInWithEmail] Lỗi cập nhật lastLoginAt:', err.message);
      }
    }

    // 6. GHI NHẬN AUDIT LOG THÀNH CÔNG
    const idType = detectLoginIdentifierType(rawInput);
    const loginMethodText = idType === 'phone' ? 'Số điện thoại' : (idType === 'code' ? 'Mã tài khoản' : 'Email/Mật khẩu');

    await UserAuditService.logAction({
      actor: updatedProfile,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      target: updatedProfile,
      description: `${updatedProfile.name} (${updatedProfile.code || updatedProfile.id}) đã đăng nhập thành công bằng ${loginMethodText}`,
    });

    return updatedProfile;
  }

  /**
   * Đăng xuất khỏi Firebase Auth
   */
  static async signOut() {
    if (auth) {
      await signOut(auth);
    }
  }

  /**
   * Lắng nghe trạng thái Auth thay đổi
   */
  static onAuthStateChanged(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  }

  static mapAuthErrorMessage(code) {
    switch (code) {
      case 'auth/invalid-email':
        return 'Địa chỉ email không hợp lệ.';
      case 'auth/user-disabled':
        return 'Tài khoản này đã bị vô hiệu hóa.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Tài khoản hoặc mật khẩu không đúng.';
      case 'auth/popup-closed-by-user':
        return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
      case 'auth/cancelled-popup-request':
        return 'Yêu cầu đăng nhập đã bị hủy.';
      case 'auth/operation-not-allowed':
        return 'Phương thức đăng nhập Email/Mật khẩu chưa được bật trên Firebase Console (Authentication > Sign-in method).';
      case 'auth/network-request-failed':
        return 'Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền.';
      default:
        return null;
    }
  }
}
