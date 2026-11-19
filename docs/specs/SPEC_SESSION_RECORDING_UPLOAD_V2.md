# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ (BA SPECIFICATION)
## Phân Hệ: Upload & Quản Lý Video Ghi Hình Buổi Học (Session Recording)
**Mã tài liệu:** `SPEC-EDU-RECORDING-001`  
**Bộ phận chủ trì:** Ban Phân Tích Nghiệp Vụ (BA) & Giám Sát Kỹ Thuật (Audit)  
**Phiên bản:** `v2.0` | **Trạng thái:** `APPROVED FOR DEV & QC`

---

### 1. BỐI CẢNH & VẤN ĐỀ NGHIỆP VỤ (BUSINESS CONTEXT)
- **Người dùng chính:** Giáo viên bản xứ (Native English Teachers, ví dụ: Teacher Maj - `GV952`), Giáo vụ (`academic`), Admin.
- **Mục tiêu nghiệp vụ:** Sau mỗi ca dạy trực tuyến (ví dụ lớp `WP02` / `LH002`), giáo viên tải tệp video ghi hình buổi học (`.mp4`, dung lượng từ `50 MB` đến `1.5 GB`) lên hệ thống để học viên và phụ huynh lớp đó xem lại.
- **Sự cố thực tế ghi nhận:** Giáo viên tải tệp `WP02 - Nov 19, 2026.mp4` (`243.5 MB`) trên domain Live Production (`https://bk.lakeducation.edu.vn`) thì bị bật thông báo lỗi:
  > *"Đã có lỗi xảy ra khi tải lên: Lỗi tải lên: Lỗi tải lên: Truy cập bị chặn bởi chính sách CORS: Origin https://bk.lakeducation.edu.vn không được phép."*

---

### 2. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)
1. **Kiến trúc Zero-Egress Storage:** Frontend gọi trực tiếp đến API trung gian `https://hosting-store-api.phuchungvang.com/api/storage/upload-session` để xin link Google Drive Resumable Upload Session URL.
2. **Thiếu Whitelist Tên Miền Quốc Gia `.edu.vn`:**
   - Trong `hosting-store-api/functions/src/index.ts`, CORS chỉ cấu hình whitelist `lakeducation.com`, `*.web.app`, `localhost`.
   - Domain thực tế của trường lại sử dụng tên miền giáo dục Việt Nam:
     * `https://bk.lakeducation.edu.vn` (Domain dự phòng đang chạy Live Production)
     * `https://dev.lakeducation.edu.vn` (Domain môi trường DEV / UAT)
     * `https://erp.lakeducation.edu.vn` & `https://lakeducation.edu.vn`
   - Khi preflight request hoặc POST request gửi header `Origin: https://bk.lakeducation.edu.vn`, backend từ chối và trả về `HTTP 403 Forbidden`.

---

### 3. ĐẶC TẢ YÊU CẦU NGHIỆP VỤ & KỸ THUẬT (FUNCTIONAL & SYSTEM REQUIREMENTS)

#### 3.1. Danh Sách Tên Miền Hợp Lệ Bắt Buộc Hỗ Trợ (Domain Topology Whitelist)
Tất cả các backend endpoints xử lý Storage Upload Session bắt buộc chấp nhận CORS từ các Origin sau:
* `https://bk.lakeducation.edu.vn`
* `https://dev.lakeducation.edu.vn`
* `https://erp.lakeducation.edu.vn`
* `https://lakeducation.edu.vn`
* `https://lakeducation.com` & `https://www.lakeducation.com`
* `https://lakeducation-dev-erp.web.app` & `https://*.web.app`
* `http://localhost:*` & `http://127.0.0.1:*`
* Quy tắc regex: `origin.endsWith('lakeducation.edu.vn') || origin.endsWith('lakeducation.com')`

#### 3.2. Luồng Nghiệp Vụ Chuẩn 2 Chế Độ Tải (Dual Upload Modes)
1. **Chế độ 1: Tải tệp trực tiếp (`mode = 'FILE'` - File Upload):**
   - Hỗ trợ định dạng video: `.mp4`, `.mov`, `.mkv`, `.webm`.
   - Dung lượng tối đa: `2 GB`.
   - Cơ chế: Resumable Upload Zero-Egress vào Google Drive thư mục `06_CLASS_RECORDINGS_MATERIALS/2026` (Folder ID: `1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS`).
   - Hiển thị thanh tiến trình thực tế từ `0%` $\rightarrow$ `100%`.
   - Tự động tạo bản ghi trong collection `learning_materials` với:
     * `isSessionRecording: true`
     * `type: 'VIDEO'`
     * `classId: '<class_id>'`
     * `sharedClassIds: ['<class_id>']`
     * `shareScope: 'CUSTOM'` (Không rò rỉ sang lớp khác)
2. **Chế độ 2: Dán đường liên kết ngoài (`mode = 'URL'` - External Drive Link):**
   - Cho phép giáo viên dán trực tiếp link Google Drive / YouTube nếu đã upload sẵn.

---

### 4. MA TRẬN TEST CASE PHÒNG QC BẮT BUỘC THỰC THI (QC TEST MATRIX)

| Mã Case | Môi trường | Kịch bản kiểm thử | Hành động & Dữ liệu đầu vào | Kỳ vọng (Expected Result) |
| :---: | :---: | :--- | :--- | :--- |
| **TC-01** | **PROD** (`bk.lakeducation.edu.vn`) | Upload Video nhị phân thật (`.mp4`) từ Teacher Maj | Đăng nhập `GV952`, vào lớp `LH002`, chọn tệp `test_qc_prod_video.mp4` (2MB), bấm Upload | Trả về HTTP 200, tiến trình 0 -> 100%, tạo doc Firestore thành công |
| **TC-02** | **DEV** (`localhost:3000` / `dev`) | Upload Video nhị phân thật (`.mp4`) từ Giáo viên | Chọn tệp `test_qc_dev_video.mp4`, bấm Upload | Trả về HTTP 200, tiến trình 0 -> 100%, hiển thị video trên UI |
| **TC-03** | **CORS Probe** | Kiểm tra Preflight CORS Header | Gửi `OPTIONS` và `POST` với `Origin: https://bk.lakeducation.edu.vn` | Header có `Access-Control-Allow-Origin: https://bk.lakeducation.edu.vn` |
| **TC-04** | **RBAC Scope** | Kiểm tra cô lập lớp học (Class Isolation) | Học viên Kenji (`HV768`, lớp `LH004`) mở học liệu | **KHÔNG** nhìn thấy video của lớp `LH002` |
| **TC-05** | **Teardown** | Dọn dẹp dữ liệu kiểm thử (Zero Residue) | Khối `finally` của script QC thực thi | Tự động xóa file test trên Drive và xóa document trong Firestore |
