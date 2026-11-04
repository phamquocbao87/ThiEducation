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
