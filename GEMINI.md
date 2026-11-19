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
5. **Trục 5 — Dọn Rác 100% (Zero Residue Teardown):** Khối `finally` tự động xóa tệp test trên Drive và document test trên Firestore.
