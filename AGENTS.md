# AGENTS.md - Rule Guidelines for AI Agents & Developers in LAK EDUCATION

Chào mừng bạn đến với dự án **LAK EDUCATION** (`lakeducation.com` - Educational Management ERP System - Quy mô 520 Học viên & 68 Cán bộ/Giáo viên).

File này quy định **CẤU TRÚC VÀ QUY TẮC BẮT BUỘC** mà mọi AI Agent (Antigravity, Gemini, Copilot...) và Coder phải tuân thủ nghiêm ngặt khi đọc, sửa đổi hoặc thêm mới tính năng.

---

## 🏗️ 1. Cấu Trúc Dự Án & Design Pattern (Clean Modular Architecture)

Dự án được phân chia thành 3 tầng chính, trong đó **mỗi Phân hệ (`src/modules/<name>/`) bắt buộc tuân thủ cấu trúc 5 lớp tách biệt** (chi tiết tại [`.agents/rules/01_architecture_rules.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/01_architecture_rules.md)):

```
ThiEducation/
├── .agents/                    # Quy tắc nghiêm ngặt dành cho AI Agent
│   └── rules/                  # 01_architecture, 02_isolation, 03_coding_standards, 04_rbac
├── AGENTS.md                   # File hướng dẫn trung tâm
├── src/
│   ├── core/                   # Tầng lõi khung ứng dụng (Layout, Auth, Router, Firebase)
│   │   ├── context/            # AuthContext (6 Roles), ThemeContext
│   │   ├── layout/             # AppLayout (Header, Sidebar, Mobile Drawer)
│   │   └── services/           # PermissionService (Common RBAC Class) & Firebase Adapter
│   │
│   ├── modules/                # TẦNG PHÂN HỆ ĐỘC LẬP (Feature Modules)
│   │   └── <module_name>/      # (dashboard, contracts, schedules, attendance, tuition...)
│   │       ├── index.jsx                  # [1. Entry Point] Chỉ xuất <Module>Page
│   │       ├── <Module>Page.jsx           # [2. Layout] Khung bố cục màn hình của phân hệ
│   │       ├── components/                # [3. Sub-Feature UI] Mỗi tính năng con 1 Component riêng
│   │       ├── hooks/                     # [4. Controller Hook] Quản lý State & kết nối UI - Service
│   │       ├── services/                  # [5. Sub-Feature Classes] Mỗi tính năng con 1 Class riêng (extends BaseModuleService)
│   │       └── models/<module>.model.js   # [6. Domain Model] Enum trạng thái, hằng số, schema
│   │
│   └── shared/                 # Tầng dùng chung (Reusable Components & Helpers)
│       ├── services/           # BaseModuleService (Common Base Class: Search, Filter, Data Scoping)
│       ├── components/         # Antd DataTable Wrapper, Modals dùng chung
│       ├── utils/              # Formatters, Validation, Slug & Currency helpers
│       └── data/               # Centralized Mock Dataset
```

---

## 🚫 2. Quy Tắc Độc Lập Module & Tách Class Tính Năng Con (Zero Impact & 1 Sub-Feature = 1 Class)

1. **Không can thiệp chéo giữa các Module:**
   - Mỗi Module trong `src/modules/<module_name>/` phải có đầy đủ giao diện, logic, và trạng thái nội bộ.
   - Khi chỉnh sửa Module `contracts` (Hợp đồng & Lương), **CẤM** được thay đổi trực tiếp file hoặc logic thuộc Module `tuition` hoặc `schedules`.
2. **Mỗi Tính Năng Con Trong Phân Hệ = 1 Class & Component Riêng Biệt:**
   - Bên trong mỗi phân hệ, các tính năng con phải được tách thành các Class riêng trong `services/` (kế thừa từ `BaseModuleService`) và Component riêng trong `components/`. Tuyệt đối không gộp nhiều tính năng vào chung 1 file hay 1 Class.
3. **Xuất Module qua File Index:**
   - Mỗi Module phải có 1 file `index.jsx` duy nhất đóng vai trò **Public Entry Point** đại diện cho Module đó.
4. **Common Base & Shared Utility Layer (`src/shared/` & `src/core/services/`):**
   - Các hàm kiểm tra quyền 6 Roles đặt tại `PermissionService.js`; các hàm tìm kiếm, lọc, cô lập dữ liệu GV/HV đặt tại `BaseModuleService.js`. Nếu có hàm helper hoặc UI component được dùng ở từ 2 Module trở lên, phải đưa vào `src/shared/`, **KHÔNG** import trực tiếp file của Module này sang Module khác.

---

## 📋 3. QuyChuẩn Code React & Ant Design

1. **Thư viện UI chuẩn:** Sử dụng **Ant Design (`antd`)** làm thư viện thiết kế UI chính.
2. **Responsive First:** Mọi màn hình mới thêm vào phải đảm bảo hiển thị hoàn hảo trên màn hình **Mobile (`< 768px`)** và **Desktop (`>= 768px`)**.
3. **Phân quyền Role-based (6 Roles Chuẩn):** Mọi tính năng nhạy cảm (Cấu hình hệ thống, điều hành chung, quản lý đào tạo, chấm điểm, đối soát lương/học phí) phải được bọc kiểm tra role từ `useAuth()` theo đúng 6 vai trò trong [`.agents/rules/04_business_roles_and_rbac.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/04_business_roles_and_rbac.md):
   - `admin`: Quản trị hệ thống IT (Bảo mật, cấu hình, fix lỗi, theo dõi sức khỏe hệ thống).
   - `director`: Giám đốc điều hành (Xem toàn bộ hệ thống, hoạt động giáo vụ, khóa học, tổng học viên, thu/chi học phí, lương...).
   - `academic`: Giáo vụ (Quản lý giáo viên, học viên, thời khóa biểu, tạo khóa học/lớp học, điểm danh, đánh giá, quản lý thu học phí & lương GV).
   - `teacher`: Giáo viên (Check-in lớp học, xem TKB & danh sách lớp mình dạy, xem hồ sơ học viên, điểm danh & nhận xét từng học viên).
   - `accountant`: Kế toán (Xem và đối soát quá trình trả lương giáo viên, lương giáo vụ, đóng học phí học viên).
   - `student`: Học viên (Xem profile cá nhân, bài tập của mình, đánh giá của mình, lớp đang tham gia & thông tin đóng học phí).
4. **Cơ chế Giả lập Xem Tài khoản Thông minh chỉ dành cho IT Admin (`Admin-Only User Impersonation / View-As Any User`):**
   - Trong [`src/core/context/AuthContext.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/context/AuthContext.jsx), luôn tách biệt **`authenticatedUser`** (phiên đăng nhập gốc) và **`impersonatedUser`** (tài khoản mục tiêu đang xem hộ), với `currentUser = impersonatedUser || authenticatedUser`.
   - **Chỉ duy nhất `authenticatedUser.role === 'admin'`** (`canImpersonateUsers === true`) mới được hiển thị nút & Modal **"Giả Lập Xem Tài Khoản"** trên Header ([`src/core/layout/AppLayout.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/layout/AppLayout.jsx)) để chuyển sang **bất kỳ tài khoản cụ thể nào** trong toàn hệ thống (`ADM001`, `DIR001`, `ACA001..ACA003`, `GV001..GV007`, `ACC001`, `HV001..HV005`) và kiểm tra màn hình/dữ liệu cô lập (`teacherId` / `studentId`) của chính user đó.
   - Các vai trò khác (`director`, `academic`, `teacher`, `accountant`, `student`) khi đăng nhập thật sẽ có `canImpersonateUsers === false` và tuyệt đối không nhìn thấy chức năng chuyển đổi tài khoản này.
5. **Chuẩn Đa Ngôn Ngữ (`Localization / i18n` — Mặc định Tiếng Anh `en`, Thứ hai Tiếng Việt `vi`):**
   - Sử dụng `i18next` + `react-i18next` ([`src/core/i18n/i18n.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/i18n.js)) kết hợp Ant Design `ConfigProvider` (`enUS` / `viVN`) trong [`src/core/context/LanguageContext.jsx`](file:///Volumes/DATA/projects/ThiEducation/src/core/context/LanguageContext.jsx).
   - **Chế độ mặc định (`DEFAULT_LANGUAGE = 'en'`):** Tiếng Anh (`🇬🇧 EN`), chế độ thứ 2 là Tiếng Việt (`🇻🇳 VI`), lưu tại `localStorage` (`lak_app_language`).
   - **Phạm vi dịch:** Chỉ dịch **Label hiển thị của ứng dụng (`UI Labels`)** (Menu, Tiêu đề trang, Cột bảng, Thẻ thống kê, Nút bấm, Nhãn trạng thái); **dữ liệu do người dùng nhập vào (`User Input Data`)** phải giữ nguyên vẹn 100%.
   - **Quy tắc chống đơ DOM (`No MutationObserver Loop`):** Tuyệt đối không dùng `MutationObserver` gán lại `textContent` và không khai báo key-value trùng nhau trong `VI_TO_EN_UI_LABELS`; luôn kiểm tra `targetText !== rawText` trước khi cập nhật.
6. **Chuẩn Hiển Thị Footer:** Cố định dòng bản quyền ở cả 2 ngôn ngữ là: `LAK EDUCATION (lakeducation.com) ©2026`.

---

## ☁️ 4. Kiến Trúc Lưu Trữ Database, Backup, Cắt Dữ Liệu Năm & Hạ Tầng Cloud

- **Tên miền chính thức:** `lakeducation.com` (Đăng ký trên Squarespace Domains II LLC, DNS `ns-cloud-a1..a4.googledomains.com`).
- **Tài khoản Google chủ quản Firebase (Firestore + Cloud Functions + Firebase Hosting):** **`vnthietbigarage@gmail.com`** (Cấu hình tại [`src/core/services/firebase.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/firebase.js) — chi tiết chiến lược tại [`docs/DATABASE_AND_BACKEND_STRATEGY.md`](file:///Volumes/DATA/projects/ThiEducation/docs/DATABASE_AND_BACKEND_STRATEGY.md) và [`.agents/rules/06_cloud_and_storage_strategy.md`](file:///Volumes/DATA/projects/ThiEducation/.agents/rules/06_cloud_and_storage_strategy.md)).
  - **Dữ liệu Text & Nghiệp vụ (`Hot Data`):** Lưu trên **Cloud Firestore** kết hợp **Firebase Cloud Functions** (Không dựng Backend MySQL riêng). Hiện tại trên local đang đọc từ `mockData.js` chờ gắn `firebaseConfig` thật.
  - **Web Hosting:** Dùng **Google Firebase Hosting** (Miễn phí 10 GB Storage + 360 MB/ngày Data Transfer + SSL tự động).
- **Lưu trữ PDF / Image / Media & Kho Lưu Trữ Lạnh (`Cold Archive`) trên Google Drive (`hosting-store` — Đã kết nối thật 100%):**
  - **Service Class:** [`src/core/services/DriveStorageService.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/services/DriveStorageService.js)
  - **API Endpoint:** `https://hosting-store-api.phuchungvang.com/api`
  - **App ID (`x-app-id`):** `lakeducation_com`
  - **App Token (`x-app-token`):** `app_token_f667b7b4a78635606035710615d7d8db433f9c974364dafe`
  - **Thư mục gốc dự án trên Google Drive (`driveFolderId`):** `1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn` (`https://drive.google.com/drive/folders/1Qnw0V08uMBXpvbrXhrLCVqBOsPkKp3Dn`)
  - **Cây thư mục con 6 nhánh đã khởi tạo trên Drive (Tải 1 lần thư mục gốc là lấy trọn bộ):**
    1. `01_DATABASE_BACKUPS/2026` (`1umdw3PpK5js0ZHcYhqw88IZ64ODEmA5F`): Sao lưu toàn bộ Database Firestore (.json)
    2. `02_YEARLY_CUTOFF_ARCHIVES/2025` (`196qivwcZJ8LyMdS-59jSKySe7CrufYKU`): Gói dữ liệu các năm cũ đã cắt theo yêu cầu
    3. `03_TEACHER_CONTRACTS_PAYSLIPS/contracts_pdf` & `payslips_pdf`: File PDF Hợp đồng & Phiếu lương GV/Giáo vụ
    4. `04_STUDENT_HOMEWORKS_PROFILES/homeworks_2026` & `avatars`: File Bài tập học viên nộp & Ảnh đại diện
    5. `05_TUITION_BILLS_INVOICES/2026` (`1Z-yxE9LX4SKZghucVw-E2-cy_iwR1kdP`): Ảnh chụp Bill học phí & Chứng từ kế toán
    6. `06_CLASS_RECORDINGS_MATERIALS/2026` (`1X7vGrwOCGspqSatOu-Ue21rL-sRsmrsS`): Tài liệu giảng dạy & Video lớp Zoom
- **Quy tắc Cắt Dữ Liệu Năm Cũ Theo Yêu Cầu (`On-Demand Manual Year Cut-off`):**
  - Tuyệt đối **không** tự động xóa/cắt dữ liệu định kỳ. Chỉ cắt dữ liệu của năm được `admin`/`director` chọn chủ động (ví dụ năm 2027 chọn cắt dữ liệu năm 2025).
  - Khi cắt: Giữ lại Master Data (`users`, `courses`, `classes`, `students`, `contracts`), đóng gói dữ liệu giao dịch (`attendances`, `homeworks`, `payrolls`, `tuitions`) của năm đó thành file `.json` đẩy lên `02_YEARLY_CUTOFF_ARCHIVES/<year>` trên Google Drive (`SystemHealthService.cutOffYearDataToDrive`).

---

## ⚡ 5. Kiểm Tra Trước Khi Commit Code

Mọi thay đổi code bắt buộc phải chạy lệnh này để đảm bảo không bị gãy build:
```bash
npm run build
```
