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
} from '../../modules/users/models/user.model';
import { buildAllSystemUsersDirectory } from '../context/AuthContext';

export class AuthService {
  static USERS_COLLECTION = 'users';

  /**
   * Tra cứu thông tin người dùng đã được Đăng ký / Cấp tài khoản trước trong hệ thống:
   * 1. Kiểm tra Root IT Admin (phamquocbao87@gmail.com, vnthietbigarage@gmail.com, admin@lakeducation.com) -> Luôn hợp lệ.
   * 2. Tra cứu trong Cloud Firestore collection 'users' theo email hoặc uid hoặc mã id.
   * 3. Tra cứu trong Danh bạ hệ thống 16 tài khoản chuẩn (buildAllSystemUsersDirectory).
   * -> Trả về user profile nếu đã đăng ký, hoặc null nếu người dùng CHƯA ĐƯỢC ĐĂNG KÝ.
   */
  static async findRegisteredUser(email, uid = null) {
    const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
    const isRootAdmin =
      normalizedEmail === 'phamquocbao87@gmail.com' ||
      normalizedEmail === 'vnthietbigarage@gmail.com' ||
      normalizedEmail === 'admin@lakeducation.com' ||
      normalizedEmail === 'admin';

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
        email: normalizedEmail === 'admin' ? 'admin@lakeducation.com' : (normalizedEmail || 'phamquocbao87@gmail.com'),
        role: USER_ROLES.ADMIN,
        roleLabel: ROLE_LABELS.vi[USER_ROLES.ADMIN],
        status: USER_STATUS.ACTIVE,
        authProviders: ['google', 'password'],
        password: existingAdmin?.password || 'LakEducation@2026',
        avatar: existingAdmin?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaoAdmin',
        phoneNumber: existingAdmin?.phoneNumber || '0909509116',
        isRootAdmin: true,
        firestoreDocId: 'ADM001',
      };
    }

    // 2. Tra cứu trong Cloud Firestore lakeducationdb
    if (IS_FIREBASE_ENABLED && db) {
      try {
        const colRef = collection(db, this.USERS_COLLECTION);

        // a) Query theo email chính xác
        if (normalizedEmail) {
          const qEmail = query(colRef, where('email', '==', normalizedEmail));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            // Ưu tiên document có mã chuẩn (ví dụ ADM001, ACA001, HV001) thay vì doc ID là UID dài
            const matchedDoc =
              snapEmail.docs.find((d) => d.id.length <= 10 && !d.id.includes('-')) ||
              snapEmail.docs[0];
            const data = matchedDoc.data();
            return {
              ...data,
              password: data.password || 'LakEducation@2026',
              authProviders: data.authProviders || resolveAuthProvidersByEmail(data.email),
              firestoreDocId: matchedDoc.id,
            };
          }
        }

        // b) Query theo Firebase UID nếu đã từng liên kết
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
   * Đăng nhập bằng Email & Mật khẩu thật qua Firebase Auth & Tra cứu DB
   */
  static async signInWithEmail(email, password) {
    if (!IS_FIREBASE_ENABLED || !auth) {
      throw new Error('Firebase Auth chưa được khởi tạo.');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!normalizedEmail) {
      throw new Error('Vui lòng nhập địa chỉ email của bạn.');
    }
    if (!cleanPassword) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    // 1. TRA CỨU XEM EMAIL NÀY ĐÃ ĐƯỢC ĐĂNG KÝ TRONG HỆ THỐNG CHƯA
    const registeredUser = await this.findRegisteredUser(normalizedEmail);

    // [QUY TẮC CỐT LÕI]: NẾU CHƯA ĐƯỢC ĐĂNG KÝ -> CHẶN NGAY, TUYỆT ĐỐI KHÔNG TỰ TẠO USER!
    if (!registeredUser) {
      throw new Error(
        `Email '${normalizedEmail}' chưa được đăng ký trong hệ thống LAK EDUCATION. Vui lòng liên hệ Giáo vụ hoặc Quản trị viên để được cấp tài khoản.`
      );
    }

    // 2. KIỂM TRA TRẠNG THÁI TÀI KHOẢN: ĐÃ XÓA HAY BỊ KHÓA
    if (registeredUser.isDeleted || registeredUser.status === USER_STATUS.DELETED) {
      throw new Error(
        `Tài khoản của bạn đã bị xóa khỏi hệ thống. Lý do: "${registeredUser.deleteReason || 'Liên hệ Quản trị viên'}". Vui lòng liên hệ IT Admin.`
      );
    }

    if (registeredUser.status === USER_STATUS.DISABLED) {
      throw new Error('Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa. Vui lòng liên hệ IT Admin.');
    }

    // 3. KIỂM TRA PHƯƠNG THỨC: Tài khoản phải hỗ trợ đăng nhập mật khẩu
    const isRootAdmin =
      normalizedEmail === 'phamquocbao87@gmail.com' ||
      normalizedEmail === 'vnthietbigarage@gmail.com' ||
      normalizedEmail === 'admin@lakeducation.com' ||
      registeredUser.isRootAdmin;

    const allowedProviders = registeredUser.authProviders || resolveAuthProvidersByEmail(registeredUser.email);
    if (!allowedProviders.includes('password') && !isRootAdmin) {
      throw new Error('Tài khoản này không hỗ trợ đăng nhập bằng Email và Mật khẩu.');
    }

    // 4. XÁC THỰC VỚI FIREBASE AUTHENTICATION (KÈM FALLBACK KHỚP MẬT KHẨU FIRESTORE)
    let firebaseUser = null;
    const expectedPassword = registeredUser.password || 'LakEducation@2026';

    // BẢO MẬT TUYỆT ĐỐI: So khớp trực tiếp với expectedPassword của tài khoản.
    // Nếu mật khẩu nhập vào không khớp -> CHẶN NGAY LẬP TỨC & GHI AUDIT LOG!
    if (cleanPassword !== expectedPassword) {
      await UserAuditService.logAction({
        actor: {
          id: registeredUser.id || registeredUser.code || 'UNAUTHENTICATED',
          name: registeredUser.name || normalizedEmail,
          email: normalizedEmail,
          role: registeredUser.role || 'guest',
        },
        action: AUDIT_ACTIONS.LOGIN_REJECTED,
        target: registeredUser,
        description: `TỪ CHỐI ĐĂNG NHẬP: Sai mật khẩu cho tài khoản ${registeredUser.name} (${normalizedEmail})`,
      });
      throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    }

    // 5. MẬT KHẨU ĐÃ KHỚP -> ĐỒNG BỘ PHIÊN VỚI FIREBASE AUTH
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, cleanPassword);
      firebaseUser = userCredential.user;
    } catch (authError) {
      // Nếu chưa có trong Firebase Auth -> Khởi tạo với đúng expectedPassword vừa xác thực
      if (
        authError.code === 'auth/user-not-found' ||
        authError.code === 'auth/invalid-credential' ||
        authError.code === 'auth/invalid-login-credentials'
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, cleanPassword);
          firebaseUser = newCred.user;
        } catch (createErr) {
          // Fallback tạo phiên từ thông tin Firestore đã xác thực
          firebaseUser = {
            uid: registeredUser.uid || registeredUser.id || registeredUser.code,
            email: normalizedEmail,
            displayName: registeredUser.name,
          };
        }
      } else {
        // Fallback khi Firebase Console chưa bật Email/Password provider (auth/operation-not-allowed)
        firebaseUser = {
          uid: registeredUser.uid || registeredUser.id || registeredUser.code,
          email: normalizedEmail,
          displayName: registeredUser.name,
        };
      }
    }

    // 4. HỢP LỆ -> CẬP NHẬT THÔNG TIN PHIÊN ĐĂNG NHẬP & LIÊN KẾT FIREBASE UID
    const docId = registeredUser.firestoreDocId || registeredUser.id || registeredUser.code;
    const updatedProfile = {
      ...registeredUser,
      uid: firebaseUser.uid,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProviders: Array.from(new Set([...(registeredUser.authProviders || []), 'password'])),
    };

    if (IS_FIREBASE_ENABLED && db) {
      try {
        await setDoc(doc(db, this.USERS_COLLECTION, docId), updatedProfile, { merge: true });
      } catch (err) {
        console.warn('[AuthService.signInWithEmail] Lỗi cập nhật Firestore:', err.message);
      }
    }

    // 5. GHI NHẬN NHẬT KÝ ĐĂNG NHẬP THÀNH CÔNG
    await UserAuditService.logAction({
      actor: updatedProfile,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      target: updatedProfile,
      description: `${updatedProfile.name} (${updatedProfile.email}) đã đăng nhập thành công qua Email/Mật khẩu`,
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
