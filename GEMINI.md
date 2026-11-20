# GEMINI.md - KỶ LUẬT VẬN HÀNH & BẢO MẬT HỆ THỐNG LAK EDUCATION

## 🏛️ BỘ QUY TRÌNH HỘI CHẨN 3 BỘ PHẬN: BA - DEV - QC/AUDIT (MANDATORY TRI-PARTY GATEWAY)

> **Kỷ Luật Tối Thượng Của Hệ Thống (Chỉ Đạo Bất Biến Từ Sếp Bảo):**  
> 1. Mỗi chức năng mới (Function) và mỗi lỗi phát sinh (Bug) **BẮT BUỘC PHẢI GEN TÀI LIỆU ĐẶC TẢ BA & MA TRẬN TEST CASE THỰC TẾ** (`docs/specs/<feature_or_bug_id>.spec.md`) trước khi đụng vào code.  
> 2. **CẤM KIỂM THỬ HỜI HỢT / TEST GIẢ ĐỊNH:** Bắt buộc test kéo thả file nhị phân thật (`.mp4`, `.pdf`, `.xlsx` dung lượng thật), quét toàn bộ họ domain (`bk.lakeducation.edu.vn`, `dev.lakeducation.edu.vn`, `localhost`), cấm chỉ test nhập text/dán link URL.  
> 3. **NGAY SAU KHI DEPLOY:** Bắt buộc chạy kiểm thử Playwright E2E thực tế trên **CẢ HAI MÔI TRƯỜNG DEV VÀ PROD** (`scripts/qc_<task>_dual_env.py`) và **XÓA SẠCH 100% DỮ LIỆU TEST (Zero Test-Data Residue Teardown)** ngay sau khi hoàn tất.  
> 4. **CẤM BÁO CÁO "ĐÃ XONG" NẾU THIẾU BẰNG CHỨNG:** Tuyệt đối cấm báo cáo hoàn thành nếu chưa có Biên Bản Nghiệm Thu Kép đính kèm ảnh chụp màn hình chứng minh từ cả DEV và PROD.

---

### MA TRẬN KIỂM THỬ 5 TRỤC THỰC TẾ (5-AXIS REAL TEST MATRIX)
1. **Trục 1 — Nhị Phân & Tệp Thật (Binary Payload Axis):** Test tải tệp `.mp4`/`.pdf` thật, đo tiến trình `0% -> 100%`.
2. **Trục 2 — Mạng, CORS & Domain Topology (Network Axis):** Đảm bảo backend whitelist và client request khớp toàn bộ domain: `*.lakeducation.edu.vn`, `*.web.app`, `localhost`. Khi gọi Google Drive API, bắt buộc truyền header `Origin` để Google Drive trả về CORS cho client upload nhị phân.
3. **Trục 3 — Phân Quyền 6 Roles RBAC (Role Scoping Axis):** Kiểm tra tính cô lập dữ liệu (Học viên chỉ thấy lớp mình, GV bản xứ ẩn 100% học phí và link Zalo).

4. **Trục 4 — Thiết Bị Kép Responsive (Desktop & Mobile-First Axis):** Assert `Zero Overflow-X` trên cả 1366px và 390px, touch target >= 40px.
   - **Kỷ luật Playwright DOMContentLoaded:** Trên các ứng dụng có kết nối Firebase Realtime / WebSockets, TUYỆT ĐỐI CẤM dùng `wait_until='networkidle'` (gây treo timeout 40s). Bắt buộc 100% sử dụng `wait_until='domcontentloaded'` kết hợp `wait_for_timeout(...)` hoặc `wait_for_selector(...)`.
5. **Trục 5 — Dọn Rác 100% (Zero Residue Teardown):** Khối `finally` tự động xóa tệp test trên Drive và document test trên Firestore.

---

### 📚 QUY CHUẨN CẤU HÌNH LỚP HỌC ĐỘNG & TỰ CHỦ NHẬP TIẾN ĐỘ GIÁO ÁN
1. **Số Buổi Học Động (Default 12 Sessions x 2h):** Khi tạo/sửa Lớp học, `totalSessions` được nhập tự do, mặc định 12 buổi, mỗi buổi 2 giờ (`19:00 - 21:00`).
2. **Bỏ Áp Đặt Công Thức Máy Móc:** Dropdown Classroom chỉ hiển thị `Session X • DD/MM/YYYY: [Lesson Title]` (hoặc `[Unplanned]`), bỏ 100% chuỗi ép cứng `— Unit 1 Week 1 · Lesson 1`.
3. **Tự Chủ Giáo Án:** Form soạn giáo án để trống `unitWeek` và `lessonTitle` cho Giáo viên / Giáo vụ tự nhập theo tiến độ thực tế bài giảng của lớp.
4. **Cảnh Báo 24H:** Duy trì cảnh báo tự động trước 24h đối với ca dạy chưa hoàn thành giáo án (`Unplanned`).

5. **Đánh Giá 4 Kỹ Năng ELA & Tính Điểm Tự Động:** Trong bảng đánh giá buổi học và thẻ học viên, phân tách rõ Listening, Speaking, Reading, Writing (1-5 ⭐); tự động tính `stars = Math.round((L+S+R+W)/4)` và đồng bộ khi chọn nút nhanh.
6. **Bảo Toàn Trạng Thái Điểm Danh Buổi Cũ:** Không phụ thuộc state realtime của hôm nay; kiểm tra `item.presence || item.attendanceStatus || (item.stars || item.comment ? 'ONLINE' : undefined)` tránh rơi về `Unmarked`.
7. **Link Nhúng Video Google Drive > 100MB:** Chuẩn hóa 100% sang `https://drive.google.com/file/d/{fileId}/preview` chống cảnh báo virus scan.
8. **Cô Lập Video Lớp Học Riêng:** Lọc bỏ 100% `isSessionRecording: true` khỏi kho học liệu chung `/learning-materials`.
