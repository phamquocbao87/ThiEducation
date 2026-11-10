# Rule 03: Coding Standards, Common Base OOP & Sub-Feature Extensibility

## 1. Quy Chuẩn Lớp Cơ Sở Dùng Chung (`BaseModuleService` & `PermissionService`)

Để tránh lặp lại code (DRY) khi dự án mở rộng lên hàng chục phân hệ, toàn bộ hàm dùng chung phải đặt trong 2 Class nền tảng:

1. **`src/core/services/PermissionService.js` (`class PermissionService`)**:
   - Chứa toàn bộ hàm kiểm tra quyền của 6 Roles (`admin`, `director`, `academic`, `teacher`, `accountant`, `student`).
   - Các phân hệ gọi `PermissionService.canApprovePayroll(role)` hoặc `PermissionService.canManageCourses(role)` thay vì tự viết `if (role === ...)` rải rác.
2. **`src/shared/services/BaseModuleService.js` (`class BaseModuleService`)**:
   - Cung cấp các hàm static/instance chuẩn:
     - `scopeByRole(records, user, { teacherKey, studentKey })`: Tự động lọc dữ liệu riêng khi user là `teacher` hoặc `student`.
     - `searchByFields(records, keyword, fields)`: Tìm kiếm đa trường không phân biệt hoa thường.
     - `generateCode(prefix, count)`: Sinh mã tự động chuẩn ERP (`HD-2026-05`, `AT-008`, `KH-004`).

---

## 2. Quy Tắc Tách Class Riêng Cho Từng Tính Năng Con (Sub-Feature Class Rule)

1. **Nguyên tắc 1 Tính năng = 1 Class (`Single Responsibility Principle`):**
   - Mỗi tính năng con trong một phân hệ phải được viết thành một Class độc lập kế thừa từ `BaseModuleService`.
   - Ví dụ trong phân hệ `attendance`:
     - Logic **Điểm danh & Chấm điểm** nằm ở `SessionEvaluationService.js`.
     - Logic **Hồ sơ học viên** nằm ở `StudentProfileService.js`.
     - Logic **Bài tập về nhà** nằm ở `HomeworkAssignmentService.js`.
2. **Cách mở rộng tính năng mới khi dự án phình to (Open/Closed Principle):**
   - Khi cần thêm một tính năng mới vào phân hệ (ví dụ thêm tính năng *"Thi thử / Kiểm tra định kỳ"* vào `attendance`), Developer/AI Agent **chỉ cần tạo thêm 1 file `ExamAssessmentService.js` trong `services/` và `ExamAssessmentPanel.jsx` trong `components/`**, sau đó gắn vào `<Module>Page.jsx` mà **không cần sửa vào các Class tính năng cũ**.

---

## 3. Quy Chuẩn Giao Diện (`<Module>Page.jsx` & `components/*.jsx`)

1. **Giới hạn độ dài File:** Mỗi file `.jsx` hoặc `.js` không vượt quá **180 dòng**.
2. **Thư viện UI Ant Design (`antd`):** Đồng bộ hệ màu `#1890ff` (Blue), `#722ed1` (Purple), `#52c41a` (Green), `#fa8c16` (Orange).
3. **Responsive Standards:** Mọi bảng dữ liệu có `scroll={{ x: 800 }}`, mọi lưới dùng `xs={24} sm={12} lg={6/8}`.
4. **Zero JSX trong `services/` và `models/`:** Các Class trong `services/` chỉ xử lý dữ liệu thuần (Pure JS OOP), trả về dữ liệu hoặc kết quả kiểm tra cho Hook/UI.

---

## 4. Quy Chuẩn Đa Ngôn Ngữ (`i18n` — English Default & Vietnamese Secondary)

1. **Ngôn ngữ mặc định:** Luôn để Tiếng Anh (`en`) làm mặc định (`DEFAULT_LANGUAGE = 'en'`), Tiếng Việt (`vi`) là tùy chọn thứ 2.
2. **Bảo toàn dữ liệu người dùng:** Chỉ dịch các `UI Labels` thông qua `useLanguage()` (`t`, `translateLabel`). Dữ liệu nghiệp vụ người dùng nhập vào (tên học viên, tên giáo viên, tên khóa học, mã lớp, email, SĐT, ghi chú, nhận xét...) giữ nguyên 100%.
3. **Chống vòng lặp render (`Anti-Infinite-Loop`):** Không dùng `MutationObserver` để sửa DOM trực tiếp và không đặt các cặp chuỗi giống hệt nhau trong từ điển `VI_TO_EN_UI_LABELS`.
4. **Footer chuẩn:** `LAK EDUCATION (lakeducation.com) ©2026`.
5. **Quy tắc Bắt Buộc Bản Địa Hóa Toàn Diện Mọi Thông Báo Lỗi & Toasts (`System Alerts & Error Messages Localization`):**
   - Mọi thông báo lỗi (Error Alert, Toast `message.error`, `message.success`, Modal Warning, Auth Error) **BẮT BUỘC PHẢI ĐỒNG BỘ 100% THEO NGÔN NGỮ ĐANG CHỌN (`language`)**:
     - Khi đang ở Tiếng Anh (`🇬🇧 EN`): 100% Alerts/Toasts/Modal errors **phải hiển thị bằng Tiếng Anh** (Ví dụ: `Incorrect email or password.`, `Please enter your password.`, `Unable to sign in with Google.`). **TUYỆT ĐỐI CẤM** để lọt chuỗi Tiếng Việt lên màn hình khi người dùng chọn Tiếng Anh.
     - Khi đang ở Tiếng Việt (`🇻🇳 VI`): Hiển thị Tiếng Việt chuẩn xác (Ví dụ: `Tài khoản hoặc mật khẩu không đúng.`).
   - Mọi lỗi từ Service/Firebase trước khi render ra `Alert` hoặc `message.error` **phải được chuẩn hóa qua hàm `localizeSystemMessage(err.message, language)`** từ `src/core/i18n/i18n.js`. Đồng thời có hook lắng nghe `useEffect` chuyển đổi ngôn ngữ thông báo ngay khi người dùng bấm đổi cờ ngôn ngữ.
6. **Quy Chuẩn Đa Ngôn Ngữ Cho Form Placeholder & DatePicker (Placeholder & Date Localization Invariant):**
   - **Ranh giới kỹ thuật (Technical Invariant):** Bộ chuyển ngữ tự động DOM Text Node (`UI_LABEL_SELECTORS`) chỉ duyệt `el.textContent` của các thẻ text (nhãn cột bảng, tiêu đề, nút bấm, tag). Các thuộc tính HTML như `placeholder="..."`, `title="..."` không nằm trong `textContent` và KHÔNG THỂ tự động dịch bằng DOM traversal.
   - **Quy tắc bắt buộc:**
     - Mọi thành phần nhập liệu (`Input`, `DatePicker`, `Select`, `AutoComplete`) có `placeholder` **TUYỆT ĐỐI CẤM** hardcode chuỗi Tiếng Việt độc lập (ví dụ cấm `placeholder="DD/MM/YYYY (Chọn lịch)"` hay `placeholder="Nhập họ tên..."`).
     - **Bắt buộc** gọi `const { isEnglish } = useLanguage();` và gán placeholder / label song ngữ:
       ```jsx
       placeholder={isEnglish ? 'MM/DD/YYYY' : 'DD/MM/YYYY'}
       ```
     - **Định dạng hiển thị DatePicker (Format Pattern):**
       - Khi `isEnglish === true`: Chuẩn hiển thị là **`MM/DD/YYYY`** (Chuẩn Mỹ, đồng bộ với giáo trình McGraw-Hill Wonders ELA) và placeholder `MM/DD/YYYY`. Hỗ trợ parse mảng `['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']`.
       - Khi `isEnglish === false`: Chuẩn hiển thị là **`DD/MM/YYYY`** (Chuẩn Việt Nam) và placeholder `DD/MM/YYYY`. Hỗ trợ parse mảng `['DD/MM/YYYY', 'YYYY-MM-DD']`.
     - **Dữ liệu lưu trữ Database/Firestore (Backend Invariant):**
       - Luôn lưu cố định một định dạng duy nhất (`DD/MM/YYYY` hoặc ISO `YYYY-MM-DD`), bất biến độc lập với ngôn ngữ của máy khách.
7. **Quy Chuẩn Chống Kẹt Cache Ngôn Ngữ Trong Hook `useMemo` (Zero Mixed-Language Invariant):**
   - **Nguyên nhân cốt lõi:** Khi dùng `useMemo(() => [...], [t])` để sinh mảng menu hay cột bảng, tham chiếu của hàm `t` từ `react-i18next` có thể không đổi khi `language` thay đổi (`reference equality`). Do đó React không tính toán lại mảng, khiến Menu Sidebar hoặc tiêu đề bị kẹt tiếng Anh khi chuyển sang tiếng Việt (hoặc ngược lại).
   - **Quy tắc bắt buộc:**
     - Mọi `useMemo` trả về danh sách menu (`allMenuDefinitions`), danh sách cột (`columns`), hoặc UI labels phụ thuộc ngôn ngữ **BẮT BUỘC KHAI BÁO `[isEnglish]` (hoặc `[language]`) trong Dependency Array**.
     - Khuyến khích dùng toán tử rẽ nhánh trực tiếp:
       ```javascript
       label: isEnglish ? 'Courses & Classes' : 'Khóa Học & Lớp Học'
       ```
       để loại bỏ 100% độ trễ hay sai lệch chuỗi.
8. **Quy Chuẩn Làm Sạch Dữ Liệu Lưu Trữ Firestore (Zero-Undefined Invariant):**
   - **Nguyên nhân cốt lõi:** Các hàm `setDoc()` và `updateDoc()` của Firebase Firestore sẽ throw Exception nghiêm trọng: `Function setDoc() called with invalid data. Unsupported field value: undefined`.
   - **Quy tắc bắt buộc:**
     - Trước khi gửi payload lên Firestore, mọi object payload **BẮT BUỘC** phải được làm sạch giá trị `undefined` (loại bỏ key hoặc chuyển sang rỗng `''` / `null` phù hợp).
     - Khi cập nhật các trường tùy chọn (ví dụ: đổi mật khẩu `newPassword`), chỉ gán trường đó nếu có giá trị nhập thật (`newPassword ? { password: ... } : {}`), và **BẢO TOÀN NGUYÊN VẸN** trạng thái tài khoản hiện tại (`status: user?.status || USER_STATUS.ACTIVE`), tuyệt đối không để trạng thái tự động bị reset về disabled/off.
9. **Quy Chuẩn Bất Biến Về Độ Sạch Giao Diện & Tuyệt Đối Không Hiển Thị Thông Tin Kỹ Thuật Dự Án Cho Người Dùng (Zero Technical Jargon & Complete UI Information Purity Invariant):**
   - **Nguyên tắc cốt lõi:** Người dùng cuối (Giám đốc, Giáo vụ, Giáo viên bản xứ, Kế toán, Học viên, Phụ huynh) chỉ tương tác với ngôn ngữ nghiệp vụ sư phạm & quản trị giáo dục thuần túy. Mọi thông tin kỹ thuật, tên thư viện, chi tiết cài đặt bên dưới phải được che giấu 100% trên toàn bộ giao diện người dùng.
   - **Phạm vi áp dụng toàn diện:**
     - Nhãn trường Form (`Form.Item label`), văn bản hướng dẫn phụ (`extra`, `help`), placeholder, gợi ý (hints, tooltips).
     - Tiêu đề cột bảng (`Table columns title`), bộ lọc (Filters), trạng thái rỗng (`Empty description`).
     - Tiêu đề trang, Modal, Drawer, Breadcrumb, Tabs, Thẻ thống kê (Cards, Stat metrics).
     - Thông báo hệ thống: Toasts (`message.info/success/warning/error`), Hộp thông báo (`<Alert>`), Modal xác nhận (`Modal.confirm`).
     - Tên nút bấm, nhãn tag, danh sách chọn (`Select.Option`).
   - **Bảng Tra Cứu Các Nhóm Thông Tin Kỹ Thuật Bị CẤM Tuyệt Đối Trên Giao Diện:**
     | Nhóm Thông Tin | Các Từ Khóa Kỹ Thuật CẤM Hiển Thị | Thay Bằng Ngôn Ngữ Nghiệp Vụ Chuẩn |
     | :--- | :--- | :--- |
     | **Tên Thư Viện / Công Nghệ** | `Rich Text Editor`, `TipTap`, `Antd / Ant Design`, `React`, `Vite`, `Firebase`, `Firestore`, `Google Drive API`, `OAuth`, `Node`, `Axios` | Dùng ngôn ngữ hành động người dùng: *Mục Tiêu Đào Tạo*, *Nội Dung Soạn Thảo*, *Lưu Trữ Đám Mây* |
     | **Cấu Trúc / Thuật Ngữ Code** | `JSON`, `Array`, `Object`, `Schema`, `Regex / Biểu thức chính quy`, `State`, `Hook`, `Props`, `Payload`, `CRUD`, `Mutation`, `Query` | *Danh sách*, *Thông tin chi tiết*, *Định dạng hợp lệ*, *Dữ liệu đã lưu* |
     | **Tên Biến Kỹ Thuật / Key DB** | `student_id`, `teacher_id`, `created_at`, `status_code`, `token`, `uid`, `user_id`, `course_id` | *Mã học viên*, *Mã giáo viên*, *Ngày tạo*, *Trạng thái*, *Mã khóa học* |
     | **Ký Hiệu Thẻ HTML / Code** | `(H1)`, `(H2)`, `(H3)`, `(Rich Text)`, `(Input Text)`, `(Select Box)`, `(Enum)`, `(Boolean)` | *Tiêu đề mục lớn*, *Tiêu đề mục nhỏ*, *Ghi chú*, *Lựa chọn* |
     | **Lỗi Raw / Stack Traces** | `TypeError: Cannot read...`, `NetworkError 500`, `PERMISSION_DENIED`, `undefined`, `null`, `NaN` | Bọc qua `localizeSystemMessage`: *Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối và thử lại.* |
   - **Khu Vực Ngoại Lệ Duy Nhất:** Chỉ có duy nhất bảng điều khiển **"Sức Khỏe Hệ Thống IT" (`AdminSystemHealthPanel.jsx`)** khi người dùng đăng nhập bằng vai trò **`IT Admin (`role === 'admin'`)`** mới được hiển thị các thông số hạ tầng (Firebase cluster status, API latency ms, Dung lượng sao lưu Drive).
10. **Quy Chuẩn Trình Soạn Thảo Rich Text Cho Nội Dung Đào Tạo React 19 (`@tiptap/react`):**
    - Sử dụng `@tiptap/react` kết hợp `@tiptap/starter-kit` (trong TipTap v3 đã tích hợp sẵn `Underline`, không khai báo thêm `@tiptap/extension-underline` độc lập để tránh xung đột `Duplicate extension names found: ['underline']`).
    - **Hiển thị & xem trước (Preview):** Khi hiển thị tóm tắt ngoài thẻ Card hoặc cột bảng, **bắt buộc dùng hàm bóc tách HTML `stripHtml()`** để hiển thị text thuần 2 dòng tinh tế, tuyệt đối không lộ thẻ HTML thô ra ngoài. Khi xem chi tiết, dùng Popover hoặc Modal render toàn vẹn định dạng HTML.
11. **Quy Chuẩn Bộ Chọn Vùng Độ Tuổi & Phạm Vi Trực Quan (Interactive Range Selector Pattern):**
    - Thiết kế 2 tầng: Tầng 1 gồm các thẻ bấm chọn nhanh các mốc tuổi tiêu chuẩn (Preset Pills: 3-5, 4-6, 6-7, 7-8, 8-9, 9-10, 10-11, 11-15, 12-16+) cho thao tác 1 chạm; Tầng 2 là thanh trượt 2 đầu Range Slider (3-18+) để tùy biến linh hoạt dải tuổi. Dữ liệu hiển thị tự động song ngữ (`9 - 10 tuổi` / `9 - 10 years old`).
12. **Hệ Thống Base Layouts (`src/shared/components/layout/`) & 8 Base Controls (`src/shared/components/controls/`):**
    - **Bắt buộc kế thừa:** Mọi trang tạo mới/chỉnh sửa form trong toàn dự án **BẮT BUỘC KẾ THỪA** từ bộ khung chuẩn hóa:
      - `BaseFormPageLayout`: Quản lý Breadcrumbs, Nút quay lại, Tiêu đề trang, Banner và container lưới responsive.
      - `FormSectionCard`: Quản lý thống nhất thẻ khối thông tin (tiêu đề, icon màu sắc, mô tả, bo góc 14px, đổ bóng mềm).
      - `FormActionBar`: Thanh hành động thông minh (Desktop static, Mobile tự động biến thành **Sticky Floating Action Bar** cố định đáy màn hình, touch target $\ge 44\text{px}$).
    - **Bộ 8 Base Controls dùng chung:**
      1. `BaseRichTextEditor`: Soạn thảo đào tạo TipTap v3 chuẩn sư phạm.
      2. `BaseDatePicker`: Chọn ngày song ngữ chuẩn Mỹ `MM/DD/YYYY` (EN) và `DD/MM/YYYY` (VI).
      3. `BaseCurrencyInput`: Nhập học phí/lương tự format dấu chấm hàng nghìn, chặn số âm.
      4. `BaseRangeSelector`: Chọn dải tuổi / sĩ số 2 tầng (Preset tags + Dual slider).
      5. `BaseSearchInput`: Tìm kiếm thông minh có debounce 300ms, clearable.
      6. `BaseStatusTag`: Huy hiệu trạng thái có chấm tròn phát sáng (Active 🟢, Paused 🔴, Pending 🟡).
      7. `BaseUserSelect`: Dropdown chọn GV Bản Xứ / Học Viên kèm Avatar tròn, Quốc tịch, Mã định danh.
      8. `BaseFileUpload`: Kéo thả file tải trực tiếp lên Google Drive Storage qua `DriveStorageService`.
13. **Quy Chuẩn Bất Biến Về Thứ Tự Đọc & Xếp Chồng Trên Mobile (Mobile Reading Flow Invariant):**
    - **Nguyên nhân gốc rễ:** Khi layout Desktop có 2 cột (Cột trái: Nội dung, Cột phải: Cấu hình), trên Mobile 2 cột sẽ xếp chồng dọc. Nếu đặt nút Lưu ở đáy Cột trái, nút Lưu sẽ xuất hiện TRƯỚC các trường cấu hình ở Cột phải!
    - **Quy tắc cưỡng chế:**
      - Nút Submit/Lưu **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** xuất hiện trước bất kỳ trường nhập liệu nào trên Mobile.
      - Nút Lưu phải luôn nằm ở: **Điểm cuối cùng sau tất cả các trường** HOẶC **Thanh Sticky Bottom Bar cố định ở đáy màn hình điện thoại** (`FormActionBar`).
      - Thứ tự đọc logic chuẩn trên Mobile: `1. Định danh -> 2. Khung tuổi/thời lượng -> 3. Nội dung mục tiêu -> 4. Kỹ năng/Trạng thái -> 5. Nút Lưu`.
14. **Quy Trình Kiểm Toán UI/UX Chuyên Gia 4 Bước (UI/UX Review Gate):**
    - Trước khi hoàn tất bất kỳ giao diện nào, Agent bắt buộc phải kiểm tra:
      1. *Base Inheritance:* Trang có kế thừa `BaseFormPageLayout`, `FormSectionCard`, `FormActionBar` và `BaseControls` không?
      2. *Mobile Check (< 768px):* Thứ tự xếp chồng có tự nhiên không? Nút bấm có bị che hay lơ lửng không? Kích thước nút có đạt $\ge 44\text{px}$ không?
      3. *Ergonomics:* Thao tác có thuận tiện, nhanh chóng, không phải tìm kiếm nút không?
      4. *Information Purity:* Đã lọc sạch 100% từ ngữ kỹ thuật lập trình (Rule 9) chưa?
15. **Quy Chuẩn Đồng Nhất Trục Lưới Cột & Chiều Rộng Controls (Grid Harmonization & 100% Control Width Invariant):**
    - **Đồng nhất tỷ lệ cột trong từng Form Section Card:**
      - Nếu một khối chia 2 cột: Mọi dòng bên trong card **BẮT BUỘC PHẢI DÙNG CHUNG TỶ LỆ `Col xs={24} sm={12}` (50% / 50%)**.
      - **TUYỆT ĐỐI CẤM** tình trạng dòng trên chia `sm={10} / sm={14}` còn dòng dưới chia `sm={12} / sm={12}`. Việc này làm lệch trục dọc mép các ô nhập liệu, tạo cảm giác giật cục, thiếu chuyên nghiệp.
      - Nếu chia 3 cột: Dùng đều `Col xs={24} sm={8} md={8}` (33.3% / 33.3% / 33.3%).
      - Nếu là trường toàn phần (Tags, RichText, Textarea): Dùng `Col span={24}` (100%).
    - **Quy chuẩn Chiều Rộng và Chiều Cao Control (100% Width & 40px Height):**
      - Mọi control (`Input`, `Select`, `DatePicker`, `InputNumber`) bên trong `Form.Item` **BẮT BUỘC có `style={{ width: '100%', height: 40, borderRadius: 8 }}`** để mọi control lấp đầy 100% chiều rộng của cột, tạo thành các đường gióng dọc thẳng tắp từ trên xuống dưới.
      - Gợi ý bổ sung (`hint`): Không dùng `extra` ở một bên mà bên kia để trống gây lệch chiều cao hàng; hãy đưa gợi ý vào placeholder hoặc dấu ngoặc đơn nhạt ngay cạnh tiêu đề label.
16. **Quy Chuẩn Tự Động Quy Đổi Múi Giờ Ngầm & Bảo Toàn Lịch Sử Thời Khóa Biểu (`Silent Auto-Timezone Conversion & Schedule Version History Invariant`):**
    - **Zero Timezone UI Clutter:** Khi hệ thống đã tự động xử lý được nghiệp vụ bên dưới (như quy đổi múi giờ theo thiết bị người xem qua `formatScheduleForViewer` / `getViewerUtcOffset`), **TUYỆT ĐỐI KHÔNG** hiển thị các câu giải thích kỹ thuật hay bảng liệt kê múi giờ nhiều quốc gia (`🇻🇳 GMT+7`, `🇵🇭 GMT+8`, `🇬🇧 GMT+0`, `🇦🇺 GMT+10`) hoặc chú thích `(Giờ VN GMT+7 — Gõ/chọn VD: 07:20)` lên màn hình. Nhãn chỉ để ngắn gọn, sạch sẽ: `Giờ vào lớp` (`Start Time`) và `Giờ tan lớp` (`End Time`).
    - **Exact-Minute TimePicker:** Mọi bộ chọn giờ học dùng `<TimePicker format="HH:mm" minuteStep={1} />` để chọn/gõ được từng phút lẻ (`07:20`, `19:10`).
    - **Effective-Dated Schedule History (`buildUpdatedScheduleHistory`):** Mọi thay đổi thời khóa biểu của lớp học đều phải lưu vết theo giai đoạn (`effectiveFrom` $\rightarrow$ `effectiveTo`) trong mảng `scheduleHistory`, tuyệt đối không ghi đè làm mất lịch sử thời khóa biểu cũ của lớp.
17. **Quy Chuẩn Bất Biến Về Tìm Kiếm Tiếng Việt Có Dấu / Không Dấu 2 Chiều & Chuẩn Wildcard SQL `%like%` (`Universal Diacritics-Insensitive & %like% Search Invariant`):**
    - **Bộ tiện ích trung tâm bắt buộc:** Mọi chức năng tìm kiếm trong toàn bộ ứng dụng BẮT BUỘC sử dụng các hàm chuẩn hóa từ `src/shared/utils/searchUtils.js`:
      * `matchLikeSearch(targetStr, queryStr)`: Kiểm tra chuỗi khớp có dấu, không dấu 2 chiều, cú pháp wildcard `%` (như `pham%bao`, `wonders%g1`) và tách token nhiều từ khóa đảo vị trí.
      * `matchesMultiFields(item, query, fields)`: Quét khớp trên mảng các trường dữ liệu của đối tượng (như `name`, `id`, `code`, `email`, `roleLabel`, `teacherName`, `schedule`...).
    - **Cấm viết tìm kiếm thô sơ:** TUYỆT ĐỐI CẤM dùng `target.toLowerCase().includes(kw.toLowerCase())` mà không qua chuẩn hóa bỏ dấu tiếng Việt `removeVietnameseTones`.
    - **Tích hợp đồng bộ:**
      * Tầng Service: Kế thừa `BaseModuleService.searchByKeyword(records, keyword, fields)` và `searchByFields`.
      * Tầng Autocomplete Select (`BaseStudentMultiAutocomplete`, `BaseTeacherAutocomplete`): Thuộc tính `filterOption={(input, option) => matchLikeSearch(option?.searchText || '', input)}`.
18. **Quy Chuẩn Xác Thực Trường Email Tùy Chọn & Bố Cục Form Thu Gọn (Safe Optional Email Validator & Compact Form Layout Invariant):**
    - **Bẫy Kỹ Thuật Xác Thực Email Tùy Chọn Trên Ant Design (`Safe Optional Email Validator Pattern`):**
      * Khi trường Email là tùy chọn (`required: false`) như đối với Học viên (`student`), nếu lập trình viên khai báo trực tiếp quy tắc `{ type: 'email' }` của Ant Design, thư viện `async-validator` bên dưới sẽ coi chuỗi rỗng `""` (khi load form từ DB hoặc người dùng xóa text) là chuỗi không hợp lệ, dẫn đến lỗi chặn submit form và báo *"Vui lòng nhập email"*.
      * **Quy tắc bất biến:** Đối với mọi trường email không bắt buộc, **TUYỆT ĐỐI CẤM** dùng `{ type: 'email' }` đơn thuần. **BẮT BUỘC** sử dụng hàm validator tùy biến kiểm tra chuỗi rỗng:
        ```javascript
        rules={[
          ...(isStudent ? [] : [{ required: true, message: isEnglish ? 'Please enter email' : 'Vui lòng nhập email công vụ' }]),
          {
            validator: (_, value) => {
              if (!value || !value.trim()) return Promise.resolve(); // Bỏ qua kiểm tra nếu rỗng
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value.trim())) {
                return Promise.reject(new Error(isEnglish ? 'Invalid email format' : 'Email không hợp lệ'));
              }
              return Promise.resolve();
            },
          },
        ]}
        ```
    - **Quy Chuẩn Công Thái Học Bố Cục Form Thu Gọn (`Compact Form Layout Invariant`):**
      * **Khoảng cách dọc:** Mọi `Form.Item` trong các trang chi tiết / đăng ký người dùng phải đặt `style={{ marginBottom: 14 }}` (hoặc tối đa `16px`), loại bỏ hoàn toàn khoảng hở thừa `24px` gây loãng giao diện trên màn hình Desktop.
      * **Chiều cao controls:** Các ô nhập liệu (`Input`, `Select`, `InputNumber`, `DatePicker`) cố định chuẩn Enterprise: `height: 38px - 40px`, `borderRadius: 8px`.
      * **Trục lưới cân xứng 50/50:** Mọi dòng 2 trường dữ liệu bắt buộc chia đều `Col xs={24} sm={12}` (50% / 50%) và lấp đầy 100% bề rộng cột để mép phải và mép trái thẳng hàng tuyệt đối.
19. **Kỷ Luật Bất Biến Về Phạm Vi Task & Đánh Giá Tác Động Bắt Buộc (Strict Scope Integrity & Mandatory Impact Assessment Invariant):**
    - **Nguyên tắc "Đang sửa A tuyệt đối không chạm B":**
      * Khi nhận yêu cầu sửa chữa, tối ưu hoặc làm mới chức năng A: AI Agent & Developer **CHỈ ĐƯỢC PHÉP THAO TÁC TRONG PHẠM VI CHỨC NĂNG A**.
      * Tuyệt đối **CẤM** tiện tay sửa đổi, refactor lại mã nguồn, đổi logic nghiệp vụ, xóa bỏ hoặc làm mới bất kỳ chức năng B nào khác nếu chưa có yêu cầu rõ ràng từ Sếp Bảo hoặc chưa thông báo xin phép trước.
    - **Quy trình 3 bước Đánh giá Tác động (Mandatory Impact Assessment Protocol) trước khi code:**
      * **Bước 1 — Phân tích phạm vi ảnh hưởng (Impact Scope Analysis):** Xác định rõ các file component, hook, service, model dữ liệu hoặc route nào sẽ bị tác động trực tiếp/gián tiếp.
      * **Bước 2 — Đánh giá rủi ro hồi quy (Regression Risk & Breaking Change Check):** Phân tích xem thay đổi ở chức năng A có nguy cơ làm gãy (break), lỗi ngầm hoặc thay đổi hành vi các chức năng khác (B, C...) đang dùng chung component/service/state hay không.
      * **Bước 3 — Báo cáo & Xin phép trước khi can thiệp (Notify & Approval Before Modifying Cross-cutting Code):** Nếu phát hiện chức năng B có lỗi hoặc việc sửa chức năng A buộc phải thay đổi component/service dùng chung (`src/shared/`, `src/core/`), Agent **BẮT BUỘC PHẢI DỪNG LẠI, BÁO CÁO RÕ VỀ IMPACT VÀ XIN Ý KIẾN SẾP BẢO**, chỉ khi Sếp đồng ý mới được đụng vào, tuyệt đối không được tự ý sửa ngầm.
    - **Báo cáo minh bạch phạm vi thay đổi:** Sau khi hoàn thành, báo cáo phải nêu rõ danh sách file đã thay đổi, khẳng định các chức năng khác được bảo toàn nguyên vẹn 100% không bị ảnh hưởng.
20. **Quy Chuẩn Bất Biến Về Tập Trung Hóa 100% UI Labels Vào 2 File Từ Điển Ngôn Ngữ (`Centralized i18n Locales Invariant`):**
    - **Định vị 2 File Từ Điển Trung Tâm:**
      * 🇬🇧 **Tiếng Anh (Mặc định):** [`src/core/i18n/locales/en.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/locales/en.js)
      * 🇻🇳 **Tiếng Việt:** [`src/core/i18n/locales/vi.js`](file:///Volumes/DATA/projects/ThiEducation/src/core/i18n/locales/vi.js)
    - **Quy tắc bảo trì Single Source of Truth:**
      * Khi Sếp Bảo hoặc lập trình viên cần chỉnh sửa, thay đổi bất kỳ câu chữ, nhãn menu, tiêu đề cột, nút bấm hoặc thông báo nào trên toàn bộ hệ thống, **CHỈ CẦN VÀO CẬP NHẬT TRỰC TIẾP 2 FILE NÀY**.
      * Cấu trúc cây đối tượng (`namespaces`) giữa 2 file `en.js` và `vi.js` bắt buộc phải đối xứng 100% (`common`, `menus`, `roles`, `banners`, `pages`, `dashboard`, `users`, `userDetail`, `curriculum`, `courses`, `schedules`, `attendance`, `contracts`, `tuition`).
      * Các component giao diện gọi chuỗi thông qua `t('<namespace>.<key>')` từ `useLanguage()`.
      * **Bảo tồn Dữ liệu Nhập của Người Dùng (`User Input Data Integrity`):** Tên học viên, tên giáo viên, email, số điện thoại, ghi chú, nội dung mô tả khóa học do người dùng nhập vào **BẢO TOÀN NGUYÊN VẸN 100%**, tuyệt đối không chạy qua bộ dịch tự động làm biến dạng dữ liệu gốc.

---

## 5. Kỷ Luật Git & Kiểm Tra Build (`No Unsolicited Git Commit / Push`)

1. **Tuyệt đối không tự ý `git commit` hoặc `git push`** khi Sếp Bảo chưa yêu cầu rõ ràng.
2. Sau mỗi lần chỉnh sửa code, chỉ chạy `npm run build` để kiểm tra tính toàn vẹn của cả 2 bản build (`dist/landing` và `dist/erp`), báo cáo kết quả và chờ Sếp Bảo kiểm tra trước khi commit/push.
