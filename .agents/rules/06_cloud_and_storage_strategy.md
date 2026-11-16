# Rule 06: Chiến Lược Lưu Trữ Cloud Firestore, Cắt Dữ Liệu Theo Yêu Cầu & Cây Thư Mục Google Drive (`hosting-store`)

## 1. Phân Tách Lưu Trữ: Dữ Liệu Text vs. Tệp PDF / Image / Media

1. **Dữ liệu Text & Cấu trúc Nghiệp vụ (Lưu trên Cloud Firestore + Firebase Hosting):**
   - Toàn bộ dữ liệu chữ (Hồ sơ GV/HV, Thời khóa biểu, Điểm danh, Nhận xét của GV, Đề bài tập, Hợp đồng, Bảng lương, Học phí) và Web Hosting được đặt trên **Google Firebase** thuộc tài khoản **`vnthietbigarage@gmail.com`** ([`src/core/services/firebase.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/firebase.js)).
   - Sử dụng kiến trúc **Hybrid Serverless** (`Firestore` + `Cloud Functions` + `Firebase Hosting`).

2. **Cơ chế Cắt Dữ Liệu Năm Cũ Theo Yêu Cầu Chủ Động (`On-Demand Manual Year Cut-off`):**
   - **KHÔNG** tự động cắt dữ liệu định kỳ bằng cronjob.
   - Việc cắt dữ liệu lịch sử (ví dụ đang ở năm `2027` mới chọn cắt dữ liệu năm `2025`) được thực hiện **hoàn toàn theo lệnh chủ động của người quản trị (`admin` / `director`)**.
   - Khi bấm cắt dữ liệu một năm cụ thể (`targetYear`), hệ thống sẽ xuất toàn bộ dữ liệu giao dịch của năm đó (`attendances`, `homeworks`, `payrolls`, `tuitions`) thành file JSON lưu vào thư mục `02_YEARLY_CUTOFF_ARCHIVES/<targetYear>` trên Google Drive, xác nhận lưu thành công rồi mới giải phóng dữ liệu năm đó khỏi Firestore.

---

## 2. Cây Thư Mục Chuẩn Của Dự Án Trên Google Drive (`hosting-store`)

Toàn bộ dữ liệu file và các bản Backup/Archive của dự án nằm gọn trong **1 thư mục gốc duy nhất** trên Google Drive để chủ dự án có thể bấm **Download 1 lần lấy trọn bộ toàn dự án**:

- **API Base URL:** `https://hosting-store-api.phuchungvang.com/api`
- **App ID (`x-app-id`):** `lakeducation_com`
- **App Token (`x-app-token`):** `app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe`
- **Thư mục gốc dự án (`driveFolderId`):** `1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn`  
  *(Link mở nhanh: `https://drive.google.com/drive/folders/1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn`)*

```text
📁 lakeducation_com (ID: 1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn)
├── 📁 01_DATABASE_BACKUPS/                 # Bản sao lưu toàn bộ Database Firestore (.json)
│   └── 📁 2026/                            (ID: 1umdw3PpK5js0ZHcYhqw88IZ64ODEmA5F)
├── 📁 02_YEARLY_CUTOFF_ARCHIVES/           # Dữ liệu các năm cũ đã cắt theo yêu cầu (VD: năm 2027 cắt data 2025)
│   └── 📁 2025/                            (ID: 196qivwcZJ8LyMdS-59jSKySe7CrufYKU)
├── 📁 03_TEACHER_CONTRACTS_PAYSLIPS/       # Hồ sơ pháp lý & tài chính của Giáo viên / Giáo vụ
│   ├── 📁 contracts_pdf/                   (ID: 19EsJcPR8q9hZ05iRpeaAK7Vuzhfh4R0Y)
│   └── 📁 payslips_pdf/                    (ID: 12tnmymoId6nDJx952n1YCrbiq63KE6Wm)
├── 📁 04_STUDENT_HOMEWORKS_PROFILES/       # Bài tập học viên nộp & Ảnh đại diện
│   ├── 📁 homeworks_2026/                  (ID: 1-3kkrYMZau2utg7TJ4E38YTCbRIwcJFU)
│   └── 📁 avatars/                         (ID: 1HjcFshw6rqfKf978HzcOf8oAlVaFlanV)
├── 📁 05_TUITION_BILLS_INVOICES/           # Ảnh chụp Bill chuyển khoản học phí & Chứng từ kế toán
│   └── 📁 2026/                            (ID: 1Z-yxE9LX4SKZghucVw-E2-cy_iwR1kdP)
└── 📁 06_CLASS_RECORDINGS_MATERIALS/       # Giáo trình PDF, Tài liệu giảng dạy & Video lớp Zoom
    └── 📁 2026/                            (ID: 1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS)
```


---

## 3. Phân Định 3 Dự Án Firebase Hosting & Cơ Chế Kết Nối Firestore Cách Ly Tuyệt Đối

> **Kỷ luật bất biến:** Ứng dụng đã phát hành cho 520 học viên và 68 cán bộ/giáo viên thật. Tuyệt đối không để xảy ra trường hợp dữ liệu thử nghiệm trên máy lập trình viên (Localhost) hoặc Dev Hosting ghi nhầm vào Database Thật của Production!

### 1. Bản Đồ Phân Tầng 3 Môi Trường:

| Môi Trường | Tên Miền / Cổng Truy Cập | Database Firestore Kết Nối | Dấu Hiệu Nhận Diện Giao Diện | Mật Khẩu Chuẩn | Lệnh Deploy Độc Lập |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **💻 Localhost (Dev)** | `http://localhost:3000`<br>`http://127.0.0.1:3000` | 🟡 **`lakeducation-dev`**<br>(Sandbox Thử Nghiệm) | 🟢 Banner xanh lá cây trên cùng:<br>`MÔI TRƯỜNG PHÁT TRIỂN • DỮ LIỆU DEV` | `@Bcd1234`<br>*(100% 55 tài khoản)* | *Không deploy (chạy local)* |
| **🧪 Cloud Dev (Dev)** | `https://dev.lakeducation.edu.vn`<br>`https://lakeducation-dev-erp.web.app` | 🟡 **`lakeducation-dev`**<br>(Sandbox Thử Nghiệm) | 🟢 Banner xanh lá cây trên cùng:<br>`MÔI TRƯỜNG PHÁT TRIỂN • DỮ LIỆU DEV` | `@Bcd1234`<br>*(100% 55 tài khoản)* | `npm run deploy:dev` |
| **🛡️ Backup (Dự Phòng)** | `https://bk.lakeducation.edu.vn`<br>`https://lakeducation-backup-erp.web.app` | 🟢 **`lakeducationdb`**<br>(Database Thật 100%) | ⚪ Không có banner dev<br>(Giao diện Production) | Mật khẩu Thật<br>(`LakEducation@2026` HV) | `npm run deploy:backup` |
| **🚀 Production (Chính)** | `https://erp.lakeducation.edu.vn`<br>`https://lakeducation.edu.vn` | 🟢 **`lakeducationdb`**<br>(Database Thật 100%) | ⚪ Không có banner dev<br>(Giao diện Production) | Mật khẩu Thật<br>(`LakEducation@2026` HV) | `npm run deploy:prod` |

### 2. Kỷ Luật Cách Ly Tuyệt Đối Localhost/Dev (`Strict Localhost/Dev Isolation Invariant`):
1. **Localhost & Dev Domain:** Mặc định 100% kết nối vào sandbox `lakeducation-dev`. Mọi thao tác thêm/sửa/xóa chỉ tác động lên database thử nghiệm, hoàn toàn cách ly với Database Thật.
2. **Quy chuẩn Mật khẩu Dev:** 100% (55/55 tài khoản) trên `lakeducation-dev` sử dụng mật khẩu chuẩn DEV **`@Bcd1234`**.
3. **Quy chuẩn Mật khẩu Thật:** Trên Production và Backup, học viên sử dụng mật khẩu thật `LakEducation@2026`, cán bộ/giáo viên sử dụng mật khẩu cá nhân thật.

### 3. Chốt Chặn Kiểm Toán Tự Động Fail-Closed Trước Khi Đóng Gói (`scripts/verify_deployment_safety.mjs`):
- Tích hợp trực tiếp vào lệnh `npm run build`:
  ```json
  "build": "node scripts/bump_build_version.js && node scripts/verify_deployment_safety.mjs && vite build ..."
  ```
- Tự động kiểm tra 10 kịch bản giả lập runtime, assert mapping `.firebaserc` và scripts trong `package.json`.
- Bất kỳ sai lệch cấu hình nào giữa 3 môi trường sẽ kích hoạt dừng khẩn cấp (Fail-Closed, Exit code 1) ngay tại bước 1, ngăn chặn triệt để mọi rủi ro deploy nhầm.
