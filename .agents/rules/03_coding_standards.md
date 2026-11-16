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
9. **Quy Chuẩn Bất Biến Về Độ Sạch Giao Diện: Chỉ Hướng Dẫn Quy Trình Cho User & Tuyệt Đối Không Mô Tả Cơ Chế Hạ Tầng Kỹ Thuật Nội Bộ (Zero Technical Jargon & Pure User-Centric Workflow Invariant):**
   - **Chỉ Nói Quy Trình Thao Tác Cho Người Dùng (User-Centric Operational Workflow):**
     * Mọi văn bản hiển thị trên UI (nhãn form, gợi ý dropzone, placeholder, tooltip, modal title, helper text, banner subtitle) **CHỈ ĐƯỢC PHÉP HƯỚNG DẪN HÀNH ĐỘNG NGHIỆP VỤ CỦA NGƯỜI DÙNG** (Người dùng cần làm gì: *Kéo thả tài liệu, chọn khóa học, nhập thông tin, lưu trữ học liệu*).
     * **TUYỆT ĐỐI CẤM** mô tả cơ chế hạ tầng kỹ thuật bên trong hệ thống (như: *"hệ thống tự động tạo thư mục trên Firebase Storage và mở hộp thoại..."*, *"gọi API lưu dữ liệu..."*, *"chạy cronjob ngầm..."*). Người dùng không quan tâm và không bao giờ được phép thấy các chi tiết kỹ thuật này.
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
     | **Tên Thư Viện / Công Nghệ** | `Rich Text Editor`, `TipTap`, `Antd / Ant Design`, `React`, `Vite`, `Firebase`, `Firestore`, `Google Drive API`, `OAuth`, `Node`, `Axios` | Dùng ngôn ngữ hành động người dùng: *Mục Tiêu Đào Tạo*, *Nội Dung Soạn Thảo*, *Lưu Trữ Đám Mây*, *Hệ Thống* |
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
19. **Kỷ Luật Bất Biến Về Phạm Vi Task, Quy Trình 6 Bước Fix Bug Toàn Diện & Đánh Giá Tác Động (Strict 6-Step Bug-Fixing Protocol & Cross-Screen Audit Invariant):**
    - **🚨 QUY TRÌNH 6 BƯỚC BẮT BUỘC KHI SẾP BẢO NÊU BUG HOẶC YÊU CẦU FIX LỖI (SẾP BẢO DIRECTIVE):**
      * **Bước 1 — Tái hiện lỗi (Reproduce Bug):** Bắt buộc tái hiện chính xác lỗi trên môi trường thực tế (ghi nhận luồng thao tác, ảnh chụp màn hình, log lỗi hoặc viết script Playwright tái hiện), tuyệt đối không suy đoán mò mẫm.
      * **Bước 2 — Quét & Rà soát Lỗi Tương Tự Trên Toàn Bộ Màn Hình Còn Lại (Cross-Screen Pattern-Wide Scan & Report):**
        > **CHỈ ĐẠO CỐT LÕI CỦA SẾP BẢO:** Ngay sau khi tái hiện thành công lỗi tại màn hình A, Agent **BẮT BUỘC PHẢI QUÉT TOÀN DIỆN TẤT CẢ CÁC MÀN HÌNH, PHÂN HỆ VÀ 6 ROLES CÒN LẠI** (`Director`, `Academic`, `Teacher`, `Student`, `Accountant`, `Admin`) xem có xuất hiện pattern lỗi tương tự hay không (ví dụ: hardcode tiếng Việt khi ở giao diện tiếng Anh, lỗi ngữ pháp số nhiều `class/classes`, nút bấm thiếu `whiteSpace: nowrap`, layout flex bị co ép rớt chữ dọc...).
        > Agent phải tổng hợp thành Báo cáo Rà Soát Lỗi Tương Tự (Cross-Screen Audit Report) trình Sếp Bảo, tuyệt đối không fix chắp vá riêng lẻ từng chỗ.
      * **Bước 3 — Phân tích nguyên nhân gốc rễ (Root Cause Analysis):** Truy vết chính xác dòng code, component, state, service hoặc cấu trúc Firestore gây ra bug, chỉ rõ tại sao lỗi lại xảy ra trên toàn bộ các điểm tìm thấy.
      * **Bước 4 — Đề xuất phương án sửa chữa đồng bộ (Proposed Synchronous Fix Solution):** Trình bày chi tiết cách fix sạch sẽ, tận gốc cho cả điểm chính lẫn các điểm tương tự phát hiện ở Bước 2; nêu rõ giải pháp kiến trúc thay vì vá tạm bợ.
      * **Bước 5 — Đánh giá tác động & rủi ro hồi quy (Impact Assessment):** Liệt kê danh sách các module, component dùng chung, hooks, services và routes có khả năng bị ảnh hưởng; khẳng định rủi ro hồi quy (regression risk).
      * **Bước 6 — Trình duyệt & Chờ Sếp Bảo xác nhận trước khi sửa (Mandatory Confirmation Gate):**
        > **CẤM TỰ Ý SỬA CODE TRƯỚC KHI CÓ SỰ ĐỒNG Ý CỦA SẾP BẢO.**  
        > Agent phải dừng lại, xuất trình rõ 5 bước trên trong câu trả lời hoặc Artifact, xin ý kiến xác nhận của Sếp Bảo. **CHỈ KHI SẾP BẢO CONFIRM / XÁC NHẬN** thì mới bắt đầu tiến hành sửa đổi code!
    - **Nguyên tắc "Đang sửa A tuyệt đối không chạm B":**
      * Khi nhận yêu cầu sửa chữa, tối ưu hoặc làm mới chức năng A: AI Agent & Developer **CHỈ ĐƯỢC PHÉP THAO TÁC TRONG PHẠM VI CHỨC NĂNG A**.
      * Tuyệt đối **CẤM** tiện tay sửa đổi, refactor lại mã nguồn, đổi logic nghiệp vụ, xóa bỏ hoặc làm mới bất kỳ chức năng B nào khác nếu chưa có yêu cầu rõ ràng từ Sếp Bảo hoặc chưa thông báo xin phép trước.
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
21. **Quy Chuẩn Kiểm Thử 3 Tầng Bắt Buộc Trước Khi Nghiệm Thu (Mandatory 3-Tier Testing Protocol: Unit • Integrated • Stress):**
    - Mọi tính năng phân quyền RBAC, lọc dữ liệu hoặc can thiệp logic nghiệp vụ cốt lõi bắt buộc phải vượt qua đầy đủ 3 tầng kiểm thử trước khi bàn giao nghiệm thu cho Sếp Bảo:
      * **Tầng 1 — Unit Test:** Kiểm tra độc lập thuật toán xử lý dữ liệu, kiểm tra các tập dữ liệu biên (Edge cases, Deleted records, Pending requests).
      * **Tầng 2 — Integrated Test (Playwright E2E Headless):** Chạy kiểm thử tự động trên trình duyệt Chromium thật kết nối database Cloud Firestore thật, kiểm chứng góc nhìn thực tế của từng Role (`student`, `teacher`, `admin`, `academic`).
      * **Tầng 3 — Stress Test:** 
        1. *Chịu tải thuật toán (Data Scalability):* Chạy trên tập dữ liệu lớn ($500+$ items qua $1.000$ lượt gọi liên tục, benchmark $< 0.5\text{ms}$/lượt, zero memory leak).
        2. *Cách ly đa phiên liên tục (Cross-Role Session Isolation):* Chuyển đổi tài khoản qua lại liên tục giữa các role để chứng minh state và cache không bị rò rỉ chéo.
        3. *Kiểm toán tràn ngang giao diện (Zero Overflow-X Mobile 390px):* Assert `scrollWidth <= innerWidth` trên cả màn hình Desktop (1366px) và Mobile (390px).

---

## 5. Kỷ Luật Git & Kiểm Tra Build (`No Unsolicited Git Commit / Push`)

1. **Tuyệt đối không tự ý `git commit` hoặc `git push`** khi Sếp Bảo chưa yêu cầu rõ ràng.
2. Sau mỗi lần chỉnh sửa code, chỉ chạy `npm run build` để kiểm tra tính toàn vẹn của cả 2 bản build (`dist/landing` và `dist/erp`), báo cáo kết quả và chờ Sếp Bảo kiểm tra trước khi commit/push.

---

## 6. Kỷ Luật Vận Hành 100% Dữ Liệu Cloud Firestore Thực Tế & Khai Tử Toàn Bộ Mock Data (`Zero-Mock & Pure Real Database Invariant`)

1. **Tuyệt đối cấm sử dụng fallback mock data** (`MOCK_COURSES`, `MOCK_CLASSES`, `MOCK_TEACHERS`, `MOCK_STUDENTS`, `MOCK_CONTRACTS`, `MOCK_PAYROLLS`, `MOCK_ACADEMIC_STAFF`, `INITIAL_STATS`...). Khai tử toàn bộ tài khoản demo cũ (`GV001..GV007`, `ACA001..ACA003`).
2. **Tuyệt đối cấm dùng `localStorage` làm nguồn dữ liệu chính**. Tự động purge rác cache cũ (`lak_erp_classes`, `lak_erp_timetable`, `lak_erp_courses`) khi khởi chạy.
3. **Mỗi Sub-Feature Class kết nối trực tiếp 1 Firestore Collection**:
   - `CourseService` $\rightarrow$ `courses`
   - `ClassService` $\rightarrow$ `classes`
   - `TeacherContractService` $\rightarrow$ `contracts`
   - `TeacherPayrollService` $\rightarrow$ `payrolls`
   - `StaffPayrollService` $\rightarrow$ trích xuất động từ Cán bộ Giáo vụ thật trong `users` (`role === 'academic'`: `ACA545` Ngọc Nhi, `ACA404` Diễm Quỳnh...)
   - `ExecutiveAnalyticsService` $\rightarrow$ tính toán thống kê động từ dữ liệu thực tế.
4. **Dropdown Modal tạo mới liên kết danh bạ thật**: Mọi ô chọn Giáo viên / Học viên bắt buộc dùng Select Dropdown liên kết với Firestore `allSystemUsers` (`GV791`...), tuyệt đối cấm nhập text tự do.
5. **Dữ liệu rỗng hiển thị Empty State chuẩn mực**: Khi Firestore chưa có bản ghi, hiển thị Empty State trang nhã kèm nút tạo mới, tuyệt đối không bơm mock data lấp liếm.
6. **Kiểm toán Tự Động Playwright E2E Khẳng Định Dữ Liệu Thật (`Automated Real-DB Assertion`)**: Trước khi bàn giao nghiệm thu phân hệ cho Sếp Bảo, bắt buộc chạy kiểm thử Playwright tự động để kiểm tra: ASSERT TRUE (dữ liệu nhân sự thật hiển thị đầy đủ: `GV791 Hellen`, `ACA545 Ngọc Nhi`, `ACA404 Diễm Quỳnh`...) và ASSERT FALSE (hoàn toàn không còn xuất hiện bất kỳ nhân sự mock giả lập nào: `David Smith`, `Emma Watson`, `Trần Thu Hà`, `Nguyễn Phương Thảo`...).



---

## 7. Quy Chuẩn Cô Lập Trạng Thái Tương Tác Cục Bộ & Chống Nhảy Layout Khi Thao Tác Lưới (`Fine-Grained Item-Level Pending State & Zero-Jitter Grid Invariant`)

Để đảm bảo trải nghiệm người dùng mượt mà, phản hồi tức thì và không gây mỏi mắt (eye fatigue) khi thao tác liên tục trên các màn hình danh sách/lưới thẻ:

1. **Tuyệt đối cấm dùng biến Boolean Pending toàn cục cho danh sách (`Zero Global Boolean Pending for Lists`)**:
   - Khi giao diện có nhiều Card/Hàng tương tác độc lập (ví dụ: điểm danh từng học viên, bật/tắt công tắc từng lớp, duyệt từng đơn), Controller Hook **BẮT BUỘC lưu trạng thái Pending theo ID của phần tử** (dạng Map hoặc Set: `pendingChanges = { [id]: status }` hoặc `pendingIds = new Set()`).
   - Chỉ phần tử đang trực tiếp xử lý mới nhận `isPending = true`. Tất cả các phần tử xung quanh **BẮT BUỘC giữ nguyên trạng thái hoạt động bình thường (`disabled = false`)**, không được chớp tắt, mờ nút hay giật style.
   - Hỗ trợ thao tác liên tục (Multi-click queue): Không dùng ref lock đơn luồng toàn cục (`lock.current = true`) chặn đứng click của các phần tử khác. Cho phép người dùng bấm liên tiếp các phần tử khác nhau một cách mượt mà.

2. **Kỷ luật Bọc `React.memo` & `useCallback` Cho Mọi Item Component Trong Lưới**:
   - Mọi component đại diện cho 1 item trong lưới (`StudentSeat`, `ClassCard`, `ProductItem`...) **BẮT BUỘC bọc `React.memo`**.
   - Các hàm callback truyền từ Hook xuống item component **BẮT BUỘC bọc `useCallback`**.
   - Khi thao tác trên item A, React **phải bỏ qua 100% việc re-render các item B, C, D...** còn lại trong danh sách.

3. **Tách biệt Tuyệt đối Spinner Đơn Lẻ & Spinner Toàn Bộ (`Single-Action vs. Bulk-Action Loading Separation`)**:
   - Các thanh công cụ/hành động đáy trang (`FormActionBar`, Sticky Footer) chứa nút hành động hàng loạt (như *"Tất cả có mặt"*, *"Lưu tất cả"*, *"Duyệt tất cả"*) **CHỈ ĐƯỢC PHÉP hiển thị icon xoay tròn `loading={true}` khi thực sự bấm hành động hàng loạt đó** (`loading={isBulkPending}`).
   - Tuyệt đối không để hành động click 1 item đơn lẻ làm nhảy spinner và co giãn chiều rộng của nút đáy trang.

4. **Kỷ luật Gióng Thẳng Trục Lực & Cố Định Chiều Cao Text Trong CSS Grid**:
   - Các trường văn bản có nguy cơ rớt dòng (như tên học viên, tiêu đề khóa học) **BẮT BUỘC có chiều cao cố định 2 dòng** (`min-height: 44px; max-height: 44px; line-height: 22px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`).
   - Thẻ Card cha áp dụng Flexbox lấp đầy 100% chiều cao hàng (`height: 100%; display: flex; flex-direction: column; justify-content: space-between;`).
   - Hàng nút bấm hành động ở đáy Card (`.actions`) sử dụng `margin-top: auto; display: flex; gap: 8px;` với các nút con `flex: 1; min-height: 40px; border-radius: 8px;` để hàng nút bấm của toàn bộ các Card trên cùng một hàng luôn thẳng hàng tăm tắp theo phương ngang, độ lệch trục $\Delta y = 0$.

---

## 8. Quy Chuẩn Soạn Thảo Nhận Xét Sư Phạm, Placeholder Thông Minh & Lịch Sử Đánh Giá (`Pedagogical Evaluation Editor, Clean Placeholder & Privacy-First Evaluation History Invariant`)

1. **Kỷ luật Tuyệt Đối Phân Biệt Placeholder vs. Value (`Clean Placeholder Invariant`):**
   - **TUYỆT ĐỐI CẤM** tự ý điền sẵn văn bản mẫu (như *"Tham gia học tích cực."*, *"Completed assignment."*) vào giá trị `value` của ô nhập liệu hoặc editor nếu học viên chưa có ghi chú thực tế trong giờ.
   - Khi chưa có ghi chú trong giờ, `value` **BẮT BUỘC là chuỗi rỗng (`""`)** để Giáo viên có thể click vào và gõ nhận xét ngay lập tức mà không phải thực hiện thao tác xóa (backspace).
   - Các gợi ý chuẩn mực sư phạm bắt buộc hiển thị ở dạng **`placeholder` màu xám mờ** (Song ngữ: VI `Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay...` / EN `Actively participated in class, pronunciation was very clear and completed homework well...`).
   - Nếu học viên có ghi chú thực tế trong giờ (từ tính năng Quick Note), hệ thống mới tự động pre-fill nguyên văn ghi chú đó vào `value` để giáo viên chỉnh sửa nhanh.
   - Khi xuất báo cáo gửi phụ huynh qua Zalo hoặc hiển thị Bảng tổng kết học viên, nếu ô nhận xét để trống thì hệ thống mới áp dụng câu nhận xét sư phạm tích cực này làm fallback.

2. **Quy chuẩn Trình Soạn Thảo Nhận Xét Chuyên Dụng (`SimpleEvaluationEditor`):**
   - Mọi ô nhận xét học viên trong bảng đánh giá sau giờ phải sử dụng component chuẩn `SimpleEvaluationEditor` với chiều cao tối thiểu $\ge 140 - 160\text{px}$ (cao gấp ~5 lần ô input 32px ban đầu).
   - Tích hợp thanh công cụ sư phạm:
     * Định dạng chữ: **Bold (`**text**`)**, *Italic (`*text*`)*, Danh sách gạch đầu dòng (`• `), Danh sách đánh số (`1. `).
     * Nút bấm chèn nhanh 1 chạm: 🌟 Khen ngợi (Praise), 🔤 Phonics, 🗣️ Tương tác (Engagement), 📚 BTVN (Homework).
     * Nút Xóa nhanh (Clear) màu đỏ để làm sạch nội dung khi cần viết lại từ đầu.
   - **Chống Giật Lag Realtime (`Zero-Jitter Anti-Reset Shield`):** Sử dụng `localEditsRef` để cô lập và bảo toàn nội dung người dùng đang gõ, chặn đứng nguy cơ mất chữ hoặc kẹt ký tự khi đồng hồ lớp học realtime nhảy giây hoặc Firestore gửi snapshot ngầm.

---

## 9. Kỷ Luật Đồng Bộ Cơ Sở Dữ Liệu Node Script & Môi Trường Localhost (`Node Scripts & Vite Localhost DB Parity Invariant`)

1. **Nguyên Tắc Đồng Bộ Nhất Quán Giữa CLI & Browser:**
   - Trong `src/core/services/firebase.js`: Ở môi trường Node.js CLI (chạy qua `node scripts/...` hoặc Playwright Python), biến `typeof window === 'undefined'`.
   - **BẮT BUỘC** nhận diện môi trường Node.js cục bộ và tự động kích hoạt `IS_DEVELOPMENT_FIREBASE = true` (kết nối cơ sở dữ liệu `lakeducation-dev`), đồng bộ 100% với phiên Vite dev server chạy trên `127.0.0.1:3000`.
   - Tuyệt đối cấm logic chỉ kiểm tra `window.location.hostname` khiến Node.js script kết nối nhầm sang Production (`lakeducation`) trong khi trình duyệt lại đọc Development (`lakeducation-dev`), gây hiện tượng lệch DB (split-brain) và làm rớt các bài kiểm thử E2E tự động.
   - Chỉ khi lập trình viên cố tình truyền biến môi trường `LAK_USE_PROD_FIREBASE=true`, Node.js script mới được phép kết nối sang Production.

---

## 10. Kỷ Luật Thép: Nghiêm Cấm Tuyệt Đối Tự Ý Tạo Dữ Liệu & Bắt Buộc Dọn Sạch 100% Dữ Liệu Test (`Strict Zero Test-Data Residue & No Unsolicited Data Invariant`)

1. **Nghiêm Cấm Tạo Dữ Liệu Khi Chưa Có Lệnh:**
   - **TUYỆT ĐỐI CẤM** tự ý tạo, hardcode hoặc seed dữ liệu mẫu/dữ liệu giả lập người dùng, giáo viên, học viên (tự ý gõ nhận xét, tự tạo bản ghi đánh giá buổi học, tự tạo bài tập giả mạo giáo viên) khi Sếp Bảo chưa yêu cầu rõ ràng.
2. **Kỷ Luật Dọn Sạch Dữ Liệu Test 100% (Strict Teardown Invariant):**
   - Mọi kịch bản kiểm thử E2E tự động (Playwright, Python, Node.js script) nếu có phát sinh dữ liệu tạm để kiểm thử giao diện/API thì **BẮT BUỘC phải dọn sạch hoàn toàn (hard-delete / teardown sạch sẽ 100%)** ngay trong khối `finally` của script. Tuyệt đối cấm để rò rỉ bất kỳ bản ghi test nào (`e2e_`, `test_`, `att_`, `LIVE_`) vào Cloud Firestore thật.
3. **Bảo Toàn Trạng Thái Trống Thực Tế (Authentic Empty State):**
   - Nếu thực tế học viên chưa có đánh giá nào từ giáo viên thật, giao diện BẮT BUỘC phải hiển thị trạng thái Trống (Empty State) *"Chưa có bản đánh giá nào từ giáo viên"* / *"No session evaluations yet"*, cấm tự vẽ hoặc giữ lại dữ liệu test để lấp chỗ trống.

---

## 10. Quy Chuẩn Vận Hành Thời Khóa Biểu, Lớp Học Chưa Diễn Ra & Soạn Giáo Án Đơn Giản (`Timetable Sessions, Upcoming Invariants & Simple Objectives Editor`)

1. **Tính toán Thứ tự Buổi Học Động Theo Thời Khóa Biểu (`generateClassSessionDates`):**
   - Mọi phân hệ liên quan đến buổi học của lớp (`classroom`, `curriculum`, `evaluation`, `schedules`) **BẮT BUỘC** tính toán thứ tự buổi học dựa trên thời khóa biểu và ngày khai giảng (`startDate`) thông qua `generateClassSessionDates(cls)`.
   - **TUYỆT ĐỐI CẤM** fallback cứng số buổi (ví dụ: `c.session?.sessionIndex || 3` hoặc `|| 1`). Nếu ngày hiện tại không có lịch học, `currentSessionIndex` phải là `null`.
   - **Tuyệt đối cấm hiển thị nhãn "(Hôm nay)" / "(Today)"** cho các buổi tương lai khi lớp chưa khai giảng hoặc ngày hiện tại không phải ngày học. Mặc định chọn Buổi 1 (ngày khai giảng) để chuẩn bị giáo án.

2. **Kỷ Luật Khóa Tính Năng Đánh Giá Sư Phạm Khi Buổi Học Chưa Diễn Ra:**
   - Khi buổi học chưa bắt đầu (`now < session.start` hoặc trước ngày khai giảng `startDate`), toàn bộ tính năng đánh giá học viên (chấm sao `Rate`, nhận xét `textarea`, nút Lưu toàn bộ `btn-save-all-evaluations`) **BẮT BUỘC ở trạng thái `disabled=true`**.
   - Banner thông báo phải nêu rõ ngày, giờ bắt đầu dự kiến của buổi học và **TUYỆT ĐỐI KHÔNG CHỨA CỤM TỪ "Zalo phụ huynh"**.

3. **Kế Thừa 100% Kho Giáo Trình Gốc Của Khóa Học & Zero Dummy Links:**
   - Kho giáo trình trong lớp học (`curriculum-vault`) kế thừa động 100% từ Khóa học cấp cha (`courses/<courseId>`), gồm sách giáo khoa cốt lõi (`curriculumTextbooks`) và tài liệu số (`courseMaterials`).
   - Tuyệt đối **CẤM** khai báo mảng link tĩnh hoặc link mẫu dummy.
   - Dọn sạch 100% dữ liệu test residue trong Firestore sau khi kiểm thử tự động (`Zero Test-Data Residue`).

4. **Dropdown TKB Thông Minh & Simple Objectives Editor (`SimpleObjectivesEditor.jsx`):**
   - Khi soạn/chỉnh sửa giáo án, hợp nhất "Khung Bài Học (Unit & Week)" và "Ngày Giảng Dạy Dự Kiến" thành 1 ô Dropdown TKB thông minh duy nhất (`select-schedule-session`) sinh tự động từ thời khóa biểu của lớp. Khi chọn buổi, tự động điền đồng bộ `sessionIndex`, `date`, `unitWeek`.
   - Trình soạn thảo mục tiêu bài học chuẩn sư phạm `SimpleObjectivesEditor.jsx` tích hợp các phím tắt 1-chạm nạp nhanh cấu trúc McGraw-Hill Wonders (`🎯 Question`, `📖 Reading`, `🔤 Phonics`, `💬 Words`, `🧩 Grammar`), bộ đếm số lượng mục tiêu/dòng thời gian thực và thanh công cụ Bold/Italic/Bullet trực quan.

5. **Kỷ Luật Cửa Sổ Mở Phòng Học Trực Tuyến & Dịch Vụ Tập Trung (`Schedule Lead Window & TimetableSlotService`):**
   - Mọi phân hệ hiển thị hoặc kiểm tra điều kiện vào phòng học trực tuyến (Google Meet / Zoom / Microsoft Teams) bắt buộc gọi qua `TimetableSlotService.getSessionTimingState(...)` với tham số `leadMinutes` động.
   - **Học viên (`student`):** `leadMinutes = 10` (600s), nút vào phòng và link trực tuyến chỉ mở trước giờ học đúng 10 phút.
   - **Giáo viên & Cán bộ (`teacher`, `academic`, `director`, `admin`):** `leadMinutes = 15` (900s) để thầy/cô vào phòng chuẩn bị giáo án, thiết bị và điểm danh sớm.
   - Tuyệt đối cấm hardcode giá trị cứng `startsIn <= 900` hay `15 * 60 * 1000` tại các component view.

---

## 11. Quy Chuẩn Chỉ Nói Quy Trình Cho User & Phòng Vệ Rò Rỉ Mã Khóa i18n (`User Workflow Focus & Defensive i18n Guardrail Invariant`)

1. **Nguyên lý "Quy trình người dùng thay vì cơ chế máy móc":**
   - **Lỗi sai điển hình:** *"Hệ thống tự động tạo thư mục trên Firebase Storage và mở dialog..."* (Mô tả cơ chế máy móc, lộ tên công nghệ hạ tầng).
   - **Cách viết đúng chuẩn:** *"Kéo thả 1 hoặc nhiều tài liệu vào đây để nhập thông tin và phân loại theo khóa học. Hỗ trợ tệp PDF, Audio, Slide bài giảng."* (Mô tả hành động của người dùng và giá trị nhận được).
   - Mọi thông điệp giao diện phải trả lời câu hỏi: *"Người dùng cần làm gì tiếp theo?"* thay vì *"Hệ thống sẽ làm gì bên dưới backend?"*.

2. **Lớp bảo vệ i18n chống rò rỉ khóa kỹ thuật:**
   - Trong `src/core/context/LanguageContext.jsx`, hàm `t` bắt buộc phải có lớp bảo vệ:
     ```javascript
     const t = useCallback((key, optionsOrFallback) => {
       const fallback = typeof optionsOrFallback === 'string' ? optionsOrFallback : optionsOrFallback?.defaultValue;
       const res = rawT(key, optionsOrFallback);
       if (res === key) {
         if (fallback) return fallback;
         return ''; // Trả về chuỗi rỗng để pattern `t(key) || fallback` kích hoạt tự nhiên
       }
       return res;
     }, [rawT]);
     ```

3. **Kỷ luật kiểm toán i18n tự động:**
   - Chạy script đối soát regex quét toàn bộ `t('...')` trong module mới so với `vi.js` và `en.js` để bảo đảm không còn khóa nào bị thiếu (`Missing in VI: []`, `Missing in EN: []`) trước khi bàn giao.

---

## 12. Quy Chuẩn Xem Trước Media Sư Phạm & Giao Thức Nhúng An Toàn (Pedagogical Media Preview & Embed Protocol)

1. **Kỷ luật Chặn đứng URL Tạm Thời (`Zero Dead Blob: URLs Invariant`):**
   - **TUYỆT ĐỐI CẤM** lưu `URL.createObjectURL(file)` (`blob:...`) vào cơ sở dữ liệu Cloud Firestore.
   - URL `blob:` chỉ tồn tại trong RAM của đúng phiên/tab tạo ra nó; khi mở ở thiết bị khác hoặc khi làm mới trang, đường dẫn sẽ chết (`ERR_FILE_NOT_FOUND / 404`), gây trắng khung xem trước. Mọi tài liệu phải dùng link lưu trữ vĩnh viễn (Google Drive hoặc Cloud Storage).
   - **Lớp bảo vệ phòng vệ UI:** Trong `MaterialPreviewModal.jsx`, nếu phát hiện tệp mang URL `blob:`, bắt buộc hiển thị thẻ cảnh báo hướng dẫn thay vì mở iframe trắng.

2. **Giao Thức Nhúng An Toàn Google Drive & YouTube (`Drive & YouTube Embed Protocol`):**
   - Mọi liên kết chia sẻ Google Drive (`/view`, `/edit`, `?usp=sharing`) bắt buộc tự động chuyển đổi sang `/preview` (`https://drive.google.com/file/d/{id}/preview`) trong `resolveEmbedUrl()` để vượt qua rào cản `X-Frame-Options: SAMEORIGIN`.
   - Video YouTube bắt buộc chuyển đổi sang `https://www.youtube-nocookie.com/embed/{id}?rel=0&modestbranding=1` để tăng cường bảo mật và không bị chặn nhúng.
   - Khung xem trước Slide và Video bắt buộc đặt trong container tỷ lệ chuẩn điện ảnh `16:9` (`paddingBottom: '56.25%'` hoặc `aspectRatio: '16/9'`).

3. **Bộ Điều Khiển Tốc Độ Audio Sư Phạm (ESL Playback Rate Tuning):**
   - Thẻ `<audio>` liên kết `ref={audioRef}`. Khi người dùng chọn tốc độ `0.75x`, `1.0x`, `1.25x`, `1.5x`, cập nhật trực tiếp `audioRef.current.playbackRate = speed` để hỗ trợ học viên luyện nghe phát âm giáo viên bản ngữ.

4. **Công Thái Học Di Động & Chống Rớt Chữ (Mobile Ergonomics & No Broken Words):**
   - Toàn bộ nút hành động chân modal (`Mở Tab Mới`, `Tải Về`, `Đóng`) bắt buộc `whiteSpace: 'nowrap'`, chiều cao $\ge 38-40\text{px}$.
   - Khẳng định `scrollWidth <= innerWidth` (Zero Overflow-X) trên cả Desktop (`1366px`) và Mobile (`390px`).

---

## 13. Quy Chuẩn Nhận Diện Nền Tảng Phòng Học Trực Tuyến Động & Khóa Nút Truy Cập Theo Thời Gian Thực (Dynamic Meeting Platform & 15m Time-Locked Access Protocol)

1. **Triệt Tiêu Hardcode Tên Thương Hiệu (`Zero Hardcoded Platform Brand Invariant`):**
   - **TUYỆT ĐỐI CẤM** viết cứng tên nền tảng (như `"Zoom"`, `"Vào Zoom"`, `"🎥 Vào Lớp Học Zoom Ngay"`) trên bất kỳ nút bấm, tiêu đề hay nhãn phòng học nào.
   - Bắt buộc 100% sử dụng tiện ích nhận diện động `detectMeetingPlatform(url)` và huy hiệu `<MeetingPlatformBadge url={url} />` từ `src/shared/utils/meetingPlatformUtils.jsx` để tự động render đúng tên (`Google Meet`, `Zoom Meeting`, `Microsoft Teams`, `Phòng Trực Tuyến`), icon chính hãng và màu sắc thương hiệu.

2. **Kỷ Luật Khóa Phòng Học Theo Thời Gian Thực (`15-Minute Threshold Time-Locked Access Invariant`):**
   - Trạng thái phòng học trực tuyến phải được kiểm soát chặt chẽ theo thời gian thực qua `findClassSession(cls, now)` và `getSessionTimer(session, now)`:
     * **Khi buổi học chưa đến giờ (còn > 15 phút / `startsIn > 900`):** Nút **BẮT BUỘC DISABLED** với nhãn `Phòng [Platform] Mở Trước 15 Phút` (`[Platform] Opens 15m Before`), kèm tooltip giải thích rõ ràng phòng sẽ tự động mở trước 15 phút.
     * **Khi trong vòng 15 phút trước giờ học (`startsIn <= 900`):** Nút tự động chuyển trạng thái `primary` xanh sáng với nhãn `🎥 Vào Lớp Học [Platform] Ngay` (`🎥 Join [Platform] Now`).
     * **Khi buổi học đang diễn ra (`timer.state === 'live'`):** Nút hiển thị `🔴 Vào Lớp [Platform] (Đang Diễn Ra)` (`🔴 Join Live [Platform]`).
     * **Khi chưa cập nhật link:** Nút `disabled` với nhãn `Chưa Có Link Phòng Học` (`Meeting Link Not Available`).

3. **Ưu Tiên Ca Học Gần Nhất Trên Banner (`Earliest Session Priority`):**
   - Mọi banner ca học tiếp theo phải lấy từ ca học diễn ra sớm nhất theo thời gian thực (`sortedClasses[0]` dựa trên `sA.start - sB.start`), tuyệt đối không đọc index `[0]` tĩnh của mảng lớp.

4. **Kỷ Luật Phòng Vệ Null-Safety Trong Utility Functions:**
   - Mọi hàm phân tích lớp học như `findClassSession(cls, now)` bắt buộc kiểm tra `if (!cls) return null;` ở dòng đầu tiên để tránh lỗi sập DOM runtime.

---

## 14. Kỷ Luật Bảo Mật Mật Khẩu Bcrypt Hashing & Di Trú Không Gián Đoạn (Zero-Downtime Bcrypt Password Hashing & Dual-Verification Standard)

1. **Chuẩn Thuật Toán Băm Mật Khẩu Bắt Buộc:**
   - **TUYỆT ĐỐI CẤM** lưu trữ hoặc ghi đè mật khẩu ở dạng văn bản thuần (plaintext) vào bất kỳ collection/document nào trên Cloud Firestore.
   - Bắt buộc 100% sử dụng thư viện `bcryptjs` với số vòng băm muối tiêu chuẩn: `SALT_ROUNDS = 10` (tiền tố băm chuẩn `$2b$10$` hoặc `$2a$10$`).
   - Mọi thao tác tạo người dùng mới (`createUser`), đổi mật khẩu (`updateUserProfile`, `changePassword`) trong `UserService.js` hoặc các service liên quan **BẮT BUỘC PHẢI BĂM BCRYPT** qua `PasswordHashService.hashPassword()` trước khi gửi payload lên Firestore `setDoc` / `updateDoc`.

2. **Cơ Chế Xác Thực Kép & Tự Động Nâng Cấp Ngầm (Dual-Verification & In-Flight Auto-Upgrade):**
   - Trong `PasswordHashService.comparePassword(plain, stored)`:
     * Nếu `stored` đã là hash Bcrypt (bắt đầu bằng `$2a$` hoặc `$2b$`): Dùng `bcrypt.compareSync(plain, stored)`.
     * Nếu `stored` là chuỗi cũ chưa mã hóa: So sánh trực tiếp `plain === stored` để đảm bảo người dùng cũ không bao giờ bị khóa tài khoản hoặc lỗi đăng nhập.
   - **Tự Động Nâng Cấp Ngầm (Self-Healing Auto-Upgrade):** Khi một tài khoản mang mật khẩu cũ đăng nhập thành công qua nhánh fallback, `AuthService` phải kích hoạt tác vụ ngầm băm mật khẩu bằng Bcrypt và cập nhật Firestore ngay lập tức mà không làm chậm phiên đăng nhập.

3. **Bảo Toàn Cơ Chế Đăng Nhập SĐT Phụ Huynh & Cụm Gia Đình (Family Cluster Preserving):**
   - Khi phụ huynh đăng nhập bằng Số điện thoại (1 SĐT có thể liên kết nhiều con học cùng trường):
     * Hàm tìm kiếm tài khoản `findRegisteredUsers` trả về danh sách hồ sơ học viên khớp SĐT.
     * Sử dụng `PasswordHashService.comparePassword(password, user.password)` để lọc các hồ sơ khớp mật khẩu.
     * Nếu có nhiều hồ sơ khớp, trả về `requireProfileSelection: true` để mở Modal chọn học viên, bảo đảm tính độc lập của từng hồ sơ.

4. **Kỷ Luật Di Trú Dữ Liệu An Toàn Tuyệt Đối (Safe Batch Migration Protocol):**
   - Trước khi thực hiện bất kỳ script di trú hàng loạt mật khẩu nào:
     * **Bước 1:** Bắt buộc xuất bản sao lưu kiểm toán snapshot lưu tại `docs/migration_audit_backup.json` (chứa ID, role, trạng thái mã hóa trước di trú).
     * **Bước 2:** Chạy kiểm toán idempotency (chỉ băm các document chưa có tiền tố `$2b$` hoặc `$2a$`).
     * **Bước 3:** Chạy bộ kiểm thử Playwright Headless Browser trên 6 kịch bản thực tế (Admin, Director, Teacher, Single Student, Family Cluster, Wrong Password Rejection) và xác nhận 100% PASS trước khi bàn giao.

---

## 15. Kỷ Luật Thiết Kế Giao Diện Tự Nhiên & Bảo Mật Ngầm (Natural User Interface & Silent Security Invariant)

1. **Bảo Mật Ngầm Tuyệt Đối (Silent & Seamless Security Invariant):**
   - Mọi cơ chế phân quyền, bảo vệ dữ liệu nhạy cảm hay trung chuyển thông tin giữa các vai trò (ví dụ: Teacher $\to$ Academic $\to$ Parent) **BẮT BUỘC PHẢI DIỄN RA DƯỚI NỀN (UNDER THE HOOD)**.
   - Giao diện người dùng phải trông hoàn toàn tự nhiên, thân thiện và liền mạch như một tính năng thông thường.
2. **Triệt Tiêu Hoàn Toàn Nhãn/Cảnh Báo Bảo Mật Thừa Thãi (Zero Security Disclaimers):**
   - Tuyệt đối **KHÔNG** hiển thị các nhãn/tag mang tính cấm đoán hoặc phân bua lý do kỹ thuật (như `🔒 Bảo mật qua Giáo vụ`, `🔒 Academic Privacy`, `🔒 Bị ẩn do phân quyền`). Thay vào đó, đơn giản là không hiển thị hoặc chỉ hiển thị các thông tin được phép (ví dụ: tên phụ huynh).
   - Tuyệt đối **KHÔNG** đưa banner/alert mô tả quy trình trung chuyển nội bộ ("Tin nhắn sẽ chuyển đến bộ phận XYZ...") vào form thao tác của người dùng.
3. **Từ Ngữ Tự Nhiên, Trực Diện (User-Centric Terminology):**
   - Dùng từ ngữ sư phạm gần gũi: **`Nhắn Tin`** / **`Gửi Tin Nhắn`** (`Message` / `Send Message`) thay vì dùng từ ngữ hành chính `Nhắn Giáo Vụ` (`Message Academic`).

---

## 16. Quy Chuẩn Form Xác Thực, Chống Bot Phishing False-Positive & Ép Chuyển Hướng Canonical Domain (`Anti-Phishing & Canonical Domain Invariant`)

1. **Nguyên tắc Phân Lập Form Xác Thực:**
   - Khi ứng dụng hỗ trợ cả đăng nhập bằng Mật khẩu nội bộ và Đăng nhập bằng Google OAuth (SSO):
     * **BẮT BUỘC** tách biệt thành 2 Tab hoặc 2 Section độc lập hoàn toàn (`Segmented` hoặc `Tabs`).
     * **Tab nhập Mật khẩu nội bộ:** Tuyệt đối **KHÔNG** đặt logo Google hoặc nút Google bên trong, tránh thuật toán bot quét (Google Safe Browsing) hiểu lầm là trang credential-harvesting.
     * **Tab Google SSO:** Chỉ gồm nút bấm chuyển hướng an toàn sang `accounts.google.com`, tuyệt đối **KHÔNG** chứa ô nhập mật khẩu.
     * **CẤM TUYỆT ĐỐI:** Vẽ logo SVG 4 màu Google tự chế đặt trong cùng form hoặc nằm cạnh ô nhập Password nội bộ.

2. **Ép Chuyển Hướng Canonical Domain (0ms Redirect):**
   - Trong `siteConfig.js`, hàm `enforceCanonicalDomain()` và inline script tại `vite.*.config.js`:
     * Tự động `window.location.replace` từ các tên miền phụ đám mây (`*.web.app`, `*.firebaseapp.com`) sang tên miền doanh nghiệp chính thức (`.edu.vn`).
     * Đảm bảo bot crawler khi truy cập `web.app` nhận được chỉ thị chuyển hướng ngay lập tức, không bao giờ quét được form đăng nhập trên domain phụ.

3. **Cấu Trúc Dữ Liệu Pháp Lý Doanh Nghiệp (Institutional Trust):**
   - Mọi trang đích (Landing, ERP Gate) bắt buộc có Schema.org `EducationalOrganization` và thông tin pháp nhân đầy đủ (`CÔNG TY CỔ PHẦN LAK EDUCATION`, liên kết Điều khoản dịch vụ và Chính sách quyền riêng tư).

---

## 17. Kỷ Luật Phân Tách 3 Tầng Multi-Hosting & Database Mapping Tuyệt Đối Không Nhầm Lẫn (`Strict 3-Tier Multi-Hosting & Database Isolation Invariant`)

1. **Bản Đồ Cố Định 3 Tầng Hạ Tầng LAK EDUCATION:**
   - **Tầng 1 — PRODUCTION (Chính thức):**
     * Project ID: `lakeducation` (Number: `36575839783`, Blaze Plan)
     * Hosting Sites / Targets: `erp` $\to$ `lakeducation-erp-portal`, `landing` $\to$ `lakeducation`
     * Domain: `https://erp.lakeducation.edu.vn` & `https://lakeducation.edu.vn` (Tạm chờ Google duyệt mở lại)
     * Cloud Firestore Database: **`lakeducationdb`** (Database Thật 100%)
     * Firebase Auth: `lakeducation` (Gốc)
     * Đối tượng: 520 học viên, 68 cán bộ/giáo viên vận hành thật.
   - **Tầng 2 — BACKUP PRODUCTION (Dự phòng khẩn cấp):**
     * Project ID: `lakeducation-backup` (Number: `621289402673`, Spark Plan)
     * Hosting Sites / Targets: `erp` $\to$ `lakeducation-backup-erp`, `landing` $\to$ `lakeducation-backup`
     * Domain: `https://bk.lakeducation.edu.vn`, `https://lakeducation-backup-erp.web.app`
     * Cloud Firestore Database: **`lakeducationdb`** (Database Thật 100% của project `lakeducation`)
     * Firebase Auth: `lakeducation` (qua cơ chế Authorized Domains)
     * Đối tượng: Thay thế tức thì khi Production chính gặp sự cố mạng hoặc CDN. Ghi nhận dữ liệu trực tiếp vào Database thật.
   - **Tầng 3 — DEVELOPMENT (Môi trường Dev / Sandbox):**
     * Project ID: `lakeducation-dev` (Number: `609742112072`, Spark Plan)
     * Hosting Sites / Targets: `erp` $\to$ `lakeducation-dev-erp`, `landing` $\to$ `lakeducation-dev`
     * Domain: `https://dev.lakeducation.edu.vn`, `https://lakeducation-dev-erp.web.app`
     * Cloud Firestore Database: `lakeducation-dev` (Database Thử Nghiệm Sandbox)
     * Firebase Auth: `lakeducation-dev`
     * Đối tượng: Dành riêng cho IT kiểm thử tính năng mới, tuyệt đối không ảnh hưởng dữ liệu thật.

2. **Kỷ Luật Cưỡng Chế Lệnh Deploy (`package.json`):**
   - Tuyệt đối cấm chạy `firebase deploy` tự do không chỉ định target.
   - Bắt buộc dùng đúng lệnh kịch bản:
     * `npm run deploy:prod` $\to$ Chỉ deploy lên Production `lakeducation`.
     * `npm run deploy:backup` $\to$ Chỉ deploy lên Backup `lakeducation-backup`.
     * `npm run deploy:dev` $\to$ Chỉ deploy lên Dev `lakeducation-dev`.
     * `npm run deploy:all` $\to$ Deploy đồng bộ cả 3 môi trường.

3. **Cấu Hình Cloudflare DNS Bắt Buộc (DNS Only):**
   - Cả 2 subdomain `bk.lakeducation.edu.vn` và `dev.lakeducation.edu.vn` khi trỏ CNAME về Firebase Hosting (`lakeducation-backup-erp.web.app` và `lakeducation-dev-erp.web.app`) **BẮT BUỘC TẮT PROXY (đám mây xám `DNS only`)** để Google Trust Services xác thực và cấp phát SSL tự động không bị nghẽn SSL handshake.

4. **Kỷ Luật Cách Ly Tuyệt Đối Localhost/Dev Sandbox & Chốt Chặn Kiểm Toán Fail-Closed:**
   - **Localhost & Dev Domain:** Mặc định 100% kết nối vào sandbox `lakeducation-dev`, hiển thị thanh banner màu xanh lá cây `MÔI TRƯỜNG PHÁT TRIỂN • DỮ LIỆU DEV`, và 100% (55/55 tài khoản) sử dụng mật khẩu DEV chuẩn **`@Bcd1234`**. Tuyệt đối không để máy local kết nối tự do vào Database Thật của Production.
   - **Chốt chặn Fail-Closed (`scripts/verify_deployment_safety.mjs`):** Tích hợp vào lệnh `npm run build`. Trước khi đóng gói, tự động assert 10 kịch bản giả lập runtime. Nếu phát hiện bất kỳ sự sai lệch cấu hình nào giữa 3 môi trường, lệnh build lập tức FAIL ngay ở bước 1, ngăn chặn triệt để mọi rủi ro deploy nhầm.

---

## 🌐 15. Quy Chuẩn Song Ngữ Sạch 100% Không Lẫn Lộn Anh/Việt (Clean Bilingual Harmonization Standard)

1. **Nguyên Tắc Bất Biến:**
   - Hệ thống LAK Education phục vụ cả Giáo viên bản xứ (100% tiếng Anh) và Học viên / Phụ huynh / Cán bộ giáo vụ (Việt & Anh).
   - Khi giao diện chuyển sang tiếng Anh (`isEnglish === true` hoặc `language === 'en'`), **100% nội dung hiển thị** (nhãn `label`, tag, văn bản phụ `extra`, văn bản gợi ý `placeholder`, thông báo validate, dialog, tooltip, và enum từ database) **BẮT BUỘC PHẢI LÀ TIẾNG ANH**.
   - Tuyệt đối nghiêm cấm việc hardcode chuỗi tiếng Việt tĩnh trực tiếp trong JSX mà không bọc qua điều kiện `{isEnglish ? 'English' : 'Tiếng Việt'}` hoặc `t(...)`.

2. **Ánh Xạ Chuẩn Hóa Dữ Liệu Enum Database (Firestore Enum Mapping):**
   - Các trường trạng thái lưu trữ bằng tiếng Việt trong Cloud Firestore (ví dụ `tuitionStatus`: `"Chờ đối soát"`, `"Đã đóng đủ"`, `"Chưa đóng"`) **TUYỆT ĐỐI KHÔNG** được render trực tiếp `{user.tuitionStatus}`.
   - Bắt buộc xử lý qua hàm tiện ích ánh xạ từ điển:
     ```javascript
     const formatTuitionStatus = (status, isEnglish) => {
       if (!status || status === 'Chờ đối soát') return isEnglish ? 'Pending Audit' : 'Chờ đối soát';
       if (status === 'Đã đóng đủ') return isEnglish ? 'Paid in Full' : 'Đã đóng đủ';
       if (status === 'Chưa đóng' || status === 'Chưa thanh toán') return isEnglish ? 'Unpaid' : 'Chưa đóng';
       return status;
     };
     ```

3. **Checklist Kiểm Tra Tự Động Trước Khi Hoàn Thành:**
   - [x] Không còn thẻ Tag hiển thị tiếng Việt trên màn hình tiếng Anh (`Multiple Classes` thay vì `Nhiều Lớp`).
   - [x] Không còn ghi chú `extra` hardcode tiếng Việt dưới ô nhập liệu.
   - [x] Placeholder Form hỗ trợ song ngữ đồng bộ (`placeholder={isEnglish ? '...' : '...'}`).
   - [x] Thông báo lỗi Form `message.warning` / `message.error` hiển thị đúng ngôn ngữ đang chọn.







