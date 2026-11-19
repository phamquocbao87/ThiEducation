# QUY TRÌNH GIÁM SÁT 3 BỘ PHẬN: BA - DEV - QC/AUDIT
## Áp Dụng Cho Phát Triển Tính Năng Mới & Sửa Lỗi (New Features & Bug Fixes)

> **Mục tiêu tối thượng:** Chấm dứt hoàn toàn tình trạng sót case, lỗi môi trường (CORS, Domain), hoặc test giả lập qua loa trước khi deploy Production. Mỗi chức năng mới hoặc bug fix đều phải được văn bản hóa và nghiệm thu kép (DEV + PROD) với dữ liệu nhị phân thực tế.

---

### PHẦN I: MA TRẬN PHÂN QUYỀN & TRÁCH NHIỆM (RACI MATRIX)

| Bước | Hoạt động | BA (Business Analyst) | DEV (Software Engineer) | QC / Audit (Quality Control) | Người Duyệt (Sếp Bảo) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **Pha 1** | **Bóc tách nghiệp vụ & Gen Spec** | **Chủ trì (A/R)** | Phối hợp (C) | Tham vấn Test Case (C) | Phê duyệt (I) |
| **Pha 2** | **Xây dựng Ma trận Test 5 Trục** | Rà soát (C) | Hỗ trợ Mock data (I) | **Chủ trì (A/R)** | Giám sát (I) |
| **Pha 3** | **Thực thi Code / Fix Bug** | Kiểm tra UI/UX (C) | **Chủ trì (A/R)** | Sẵn sàng Test Script (C) | Xác nhận sửa (A) |
| **Pha 4** | **Kiểm thử Kép Sau Deploy (DEV & PROD)** | Nghiệm thu luồng (I) | Hỗ trợ Fix nóng nếu FAIL (R) | **Chủ trì chạy E2E (A/R)** | Nhận Biên bản QC |
| **Pha 5** | **Dọn sạch Dữ liệu Test (Teardown)** | — | — | **Bắt buộc 100% (A/R)** | Nghiệm thu 0 Data Rác |

*(A = Accountable / Chịu trách nhiệm chính; R = Responsible / Thực hiện; C = Consulted / Tham vấn; I = Informed / Nhận báo cáo)*

---

### PHẦN II: TIÊU CHUẨN TÀI LIỆU BẮT BUỘC TRƯỚC KHI CODE

Mọi task phát triển chức năng mới hoặc fix bug bắt buộc phải tạo 2 tài liệu chuẩn trước khi đụng vào code:
1. `docs/specs/SPEC_<TÊN_TASK>.md`: Do **BA** lập, mô tả User Stories, Happy Path, Edge Cases, Ranh giới Domain, Payload nhị phân và Ma trận Phân quyền 6 Roles.
2. `scripts/qc_<tên_task>_dual_env.py`: Do **Phòng QC** viết, dựa trên Spec của BA để phủ đủ Ma trận 5 trục.

---

### PHẦN III: KỶ LUẬT 5 TRỤC KIỂM THỬ THỰC TẾ (5-AXIS QC MATRIX)

1. **Trục 1: Luồng Dữ Liệu Thực (Real Binary Payload - Không Mock Giả Lập):**
   - Với các tính năng upload file (Video, PDF, Hình ảnh): Bắt buộc dùng file nhị phân thật (`.mp4`, `.pdf`), kiểm tra tiến trình 0% -> 100%, cấm test dán chuỗi URL chay.
2. **Trục 2: Ranh Giới Mạng & Tên Miền (Network & CORS Boundary):**
   - Kiểm tra trên toàn bộ các domain thực tế của người dùng:
     * `https://bk.lakeducation.edu.vn` (Live Prod Backup)
     * `https://dev.lakeducation.edu.vn` & `https://lakeducation-dev-erp.web.app` (Môi trường DEV/UAT)
     * `http://localhost:3000` (Local Dev)
3. **Trục 3: Ma Trận Phân Quyền 6 Roles (RBAC Invariant):**
   - Kiểm tra đúng vai trò người dùng (Teacher, Student, Academic, Director, Accountant, Admin). Đảm bảo học viên không thấy dữ liệu bảo mật, giáo viên không thấy học phí.
4. **Trục 4: Kiểm Thử Môi Trường Kép Sau Khi Deploy (DEV + PROD):**
   - Bắt buộc chạy script Playwright trên cả môi trường DEV và PROD. Cả 2 môi trường cùng PASS mới đủ điều kiện nghiệm thu.
5. **Trục 5: Tiêu Chuẩn Dọn Sạch Dữ Liệu Test (Zero Test-Data Residue Teardown):**
   - Script QC bắt buộc có khối `finally` để xóa 100% file vừa upload lên Google Drive và xóa document rác trong Firestore, tuyệt đối không để lại dữ liệu test trên Production của khách hàng.
