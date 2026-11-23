# SPEC: Màn Hình Chuyên Biệt Giám Sát Chuẩn Bị Bài Trước Giờ Học (`/pre-class-prep`) & Tinh Gọn Dashboard Preview

- **Mã tài liệu:** `SPEC-11-PRE-CLASS-PREP-MONITOR`
- **Trạng thái:** APPROVED & VERIFIED — PASS 100% PLAYWRIGHT E2E (6 ROLES + RESPONSIVE + ZERO-RESIDUE)
- **Người phê duyệt:** Sếp Bảo

## 1. Mục tiêu nghiệp vụ
1. Thu gọn thẻ **Giáo Vụ Giám Sát: Chuẩn Bị Bài Trước Giờ Học Toàn Trường** (và thẻ tương ứng trên Giáo viên / Giám đốc) ở mặt ngoài `/dashboard` xuống **tối đa 2 dòng/mục ưu tiên**, bỏ bộ lọc cồng kềnh khỏi Dashboard và gắn nút điều hướng sang màn hình chuyên sâu.
2. Xây dựng phân hệ độc lập `src/modules/pre-class-prep/` tại route `/pre-class-prep` với đầy đủ phân tích 2 góc nhìn (**Theo Học Viên** & **Theo Lớp Học**), bộ lọc đa chiều (Tìm kiếm / Lớp / Giáo viên / Trạng thái đọc), nút nhắc đọc bài cá nhân 0ms và gửi nhắc hàng loạt có xác nhận.

## 2. Ma trận 6 Roles RBAC & Bảo mật dữ liệu
- `academic`, `director`, `admin`: Toàn trường, thấy SĐT phụ huynh, có quyền gửi nhắc cá nhân & hàng loạt.
- `teacher`: Chỉ các lớp mình phụ trách (`teacherId === user.id`), **ẨN 100% SĐT Phụ huynh, Zalo và Học phí**.
- `student`, `accountant`: Ẩn khỏi Sidebar và bị chặn **403 Forbidden** khi mở trực tiếp `/pre-class-prep`.

## 3. Ma trận Test Case 5 Trục Thực Tế
1. **Trục 1 — Dữ liệu thực Firestore (`Dev` đồng bộ từ `Prod`):** Nạp đầy đủ các lớp có giáo án, `lesson_reading_logs`, `lesson_questions` và tính đúng tỷ lệ `%` đạt chuẩn.
2. **Trục 2 — Điều hướng & Deep-Link:** Từ `/dashboard` (chỉ render `<= 2` dòng ưu tiên, 0 dropdown filter inline), bấm CTA hoặc bấm dòng mở đúng `/pre-class-prep` (có hỗ trợ `?classId=&status=&tab=`).
3. **Trục 3 — Phân quyền 6 Roles RBAC:**
   - `ACA545` & `DIR505`: Thấy toàn trường, lọc Lớp/GV/Trạng thái, chuyển 2 tab mượt mà, gửi nhắc 0ms tạo notification thật.
   - `GV952`: Chỉ thấy lớp phụ trách, assert 0% chuỗi SĐT PH & Zalo trong DOM.
   - `HV253` & `ACC001`: Ẩn menu Sidebar & bị chặn truy cập `/pre-class-prep`.
4. **Trục 4 — Thiết bị kép Responsive & Scale-Proof:** Assert `Zero Overflow-X` trên `390×844` (Mobile Card List, touch target >= 40px), `1024×768` (Desktop Scale) và `1920×1080` (Desktop Full).
5. **Trục 5 — Zero-Residue Teardown:** Xóa sạch 100% document `notifications` tạo ra trong quá trình test nhắc đọc bài ngay trong khối `finally`.
