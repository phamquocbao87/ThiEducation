import bcrypt from 'bcryptjs';

/**
 * Password Hashing & Verification Service — LAK EDUCATION (lakeducation.com)
 *
 * 🛡️ Chuẩn mã hoá mật khẩu công nghiệp:
 * - Thuật toán: Bcrypt Salted Hash ($2a$ / $2b$)
 * - Salt rounds: 10
 * - Hỗ trợ Dual-Verification: Tự động phân biệt Bcrypt Hash và Plaintext cũ để đảm bảo Zero-Downtime Migration.
 */
export class PasswordHashService {
  static SALT_ROUNDS = 10;

  /**
   * Kiểm tra một chuỗi có phải là chuỗi hash Bcrypt hợp lệ hay không
   */
  static isBcryptHash(value) {
    if (!value || typeof value !== 'string') return false;
    return value.startsWith('$2a$') || value.startsWith('$2b$');
  }

  /**
   * Băm mật khẩu dạng văn bản thuần sang chuỗi Bcrypt Hash an toàn
   */
  static hashPassword(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
      return '';
    }
    const clean = plainPassword.trim();
    if (!clean) return '';
    // Nếu chuỗi đã là Bcrypt hash rồi thì bảo toàn, không băm đè 2 lần
    if (this.isBcryptHash(clean)) {
      return clean;
    }
    return bcrypt.hashSync(clean, this.SALT_ROUNDS);
  }

  /**
   * Đối soát mật khẩu người dùng nhập vào với mật khẩu lưu trong cơ sở dữ liệu
   * - Nếu mật khẩu trong DB đã là Bcrypt Hash: Dùng bcrypt.compareSync
   * - Nếu mật khẩu trong DB là Plaintext cũ: So sánh chuỗi trực tiếp (cho phép đăng nhập chuyển tiếp)
   */
  static comparePassword(plainPassword, storedHashOrPlain) {
    if (!plainPassword || !storedHashOrPlain) return false;
    const cleanInput = String(plainPassword).trim();
    const cleanStored = String(storedHashOrPlain).trim();

    if (this.isBcryptHash(cleanStored)) {
      try {
        return bcrypt.compareSync(cleanInput, cleanStored);
      } catch (err) {
        console.warn('[PasswordHashService.comparePassword] Lỗi compare bcrypt:', err.message);
        return false;
      }
    }

    // Dự phòng cho tài khoản chưa migrate sang Bcrypt
    return cleanInput === cleanStored;
  }
}
