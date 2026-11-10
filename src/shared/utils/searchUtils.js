/**
 * Vietnamese Diacritics and Multi-Token %like% Search Utility for LAK EDUCATION
 * - Hỗ trợ tìm kiếm tiếng Việt có dấu và không dấu hoàn toàn linh hoạt (2 chiều).
 * - Hỗ trợ tìm kiếm theo chuẩn SQL %like% (wildcard %, nhiều từ khóa tách rời, tìm chuỗi con bất kể vị trí).
 */

/**
 * Loại bỏ dấu tiếng Việt chuẩn quốc tế (NFD normalization)
 * Ví dụ: "Khóa Học Wonders" -> "Khoa Hoc Wonders", "Phạm Quốc Bảo" -> "Pham Quoc Bao"
 */
export const removeVietnameseTones = (str) => {
  if (str === null || str === undefined) return '';
  let text = String(str);
  // Phân rã ký tự có dấu thành ký tự gốc + combining mark và loại bỏ combining marks
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Xử lý ký tự đặc biệt đ/Đ trong tiếng Việt
  text = text.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return text;
};

/**
 * Chuẩn hóa chuỗi tìm kiếm: chuyển chữ thường, bỏ dấu tiếng Việt và trim khoảng trắng thừa
 */
export const normalizeSearchText = (str) => {
  if (str === null || str === undefined) return '';
  return removeVietnameseTones(String(str)).toLowerCase().trim();
};

/**
 * Escape các ký tự đặc biệt trong biểu thức chính quy (Regex) ngoại trừ ký tự %
 */
const escapeRegExp = (string) => {
  return String(string).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Kiểm tra xem targetStr có khớp với queryStr theo cơ chế %like% và song song Có Dấu / Không Dấu hay không
 * @param {string|number} targetStr - Chuỗi văn bản nguồn (trong database/item)
 * @param {string} queryStr - Từ khóa người dùng gõ vào ô tìm kiếm
 * @returns {boolean}
 */
export const matchLikeSearch = (targetStr, queryStr) => {
  if (queryStr === null || queryStr === undefined) return true;
  const rawQuery = String(queryStr).trim();
  if (!rawQuery) return true;

  if (targetStr === null || targetStr === undefined) return false;
  const rawTarget = String(targetStr);

  const lowerTarget = rawTarget.toLowerCase();
  const lowerQuery = rawQuery.toLowerCase();

  // 1. Kiểm tra khớp trực tiếp có dấu (case-insensitive substring)
  if (lowerTarget.includes(lowerQuery)) return true;

  // 2. Kiểm tra khớp không dấu (bỏ dấu cả hai vế: gõ có dấu tìm không dấu hoặc gõ không dấu tìm có dấu)
  const normTarget = normalizeSearchText(rawTarget);
  const normQuery = normalizeSearchText(rawQuery);
  if (normTarget.includes(normQuery)) return true;

  // 3. Cơ chế %LIKE% Wildcard:
  // Nếu query có chứa ký tự '%' (ví dụ: "%khoa%", "giao%vien", "wonders%g1")
  // hoặc người dùng gõ nhiều từ cách nhau bởi khoảng trắng/dấu cộng ("le anh khoa", "g1 wonders")
  const tokens = normQuery
    .split(/[%+\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return true;

  // 3.1. Phù hợp tất cả các token (AND search — mọi từ khóa con đều xuất hiện trong nội dung)
  const allTokensMatch = tokens.every(
    (tok) => normTarget.includes(tok) || lowerTarget.includes(tok)
  );
  if (allTokensMatch) return true;

  // 3.2. Kiểm tra Regex Wildcard tuần tự theo thứ tự (cho cú pháp 'A%B%C')
  try {
    const regexPattern = tokens.map(escapeRegExp).join('.*');
    const rx = new RegExp(regexPattern, 'i');
    if (rx.test(normTarget) || rx.test(lowerTarget)) {
      return true;
    }
  } catch {
    // Fallback an toàn nếu regex không hợp lệ
  }

  return false;
};

/**
 * Kiểm tra xem một đối tượng (item) có chứa trường nào thỏa mãn query theo %like% (có dấu/không dấu)
 * @param {object} item - Đối tượng cần tìm kiếm (VD: course, user, class, schedule, student...)
 * @param {string} query - Từ khóa tìm kiếm
 * @param {string[]} fields - Danh sách các trường cần kiểm tra (VD: ['name', 'id', 'email', 'teacherName'])
 * @returns {boolean}
 */
export const matchesMultiFields = (item, query, fields = []) => {
  if (!query || !String(query).trim()) return true;
  if (!item || typeof item !== 'object') return false;

  const targetFields =
    fields && fields.length > 0
      ? fields
      : Object.keys(item).filter((k) => typeof item[k] === 'string' || typeof item[k] === 'number');

  return targetFields.some((field) => {
    const val = item[field];
    if (val === null || val === undefined) return false;
    return matchLikeSearch(val, query);
  });
};

