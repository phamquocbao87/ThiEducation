# SPEC-10: LESSON OVERVIEW COMPACT, FULL-SCREEN BOOK READER, STUDENT NOTES, TEACHER Q&A & CONDUCT SCORE REPORTING

*(Tài Liệu Đặc Tả Nghiệp Vụ & Kiến Trúc Kỹ Thuật — Chuẩn Hội Chẩn 3 Bộ Phận BA – DEV – QC/AUDIT)*

- **Mã tài liệu:** `SPEC-10`
- **Trạng thái:** `APPROVED & VERIFIED — ALL 3 PHASES PASS 100% ON PLAYWRIGHT E2E (DESKTOP & MOBILE)`
- **Phiên bản:** `1.0.0`
- **Ngày lập:** `23/11/2026`
- **Phân hệ tác động:** `dashboard` (`StudentPortalPanel`, `TeacherWorkspacePanel`, `AcademicOperationsPanel`, `DirectorOverviewPanel`), `classroom` (Tab Giáo án & Q&A), `core/services/NotificationService.js`, `students` (Hồ sơ điểm rèn luyện).
- **Môi trường phát triển:** Localhost (`http://127.0.0.1:3000`) & Dev Firestore (`lakeducation-dev` / `lakeducationdb`).

---

## 1. BỐI CẢNH & VẤN ĐỀ NGHIỆP VỤ (BUSINESS CONTEXT)

### 1.1. Hiện trạng màn hình `/dashboard` (Vai trò Người Học — `student`)
Kiểm tra trực tiếp mã nguồn [`src/modules/dashboard/components/StudentPortalPanel.jsx`](../../src/modules/dashboard/components/StudentPortalPanel.jsx) (dòng `717–917`) và dữ liệu Production thực tế ([`data/production_snapshot/classes.json`](../../data/production_snapshot/classes.json)):
1. **Khối `"Tổng Quan Bài Học (Lesson Overview):"` quá dài:**
   - Ví dụ thực tế lớp `LH002` (*WP03 G5 Ms. Maj/357*, Session 2 & 3): mảng `objectives` chứa tới **24 mục** (chia 2 phần `READING` & `WRITING`), cộng thêm `lessonTitle`, 2 thẻ benchmark (`60+ mins`, `30+ mins`), khối `Student Prep`, `Assigned Homework` và `Slide Link`.
   - Giao diện hiện tại render toàn bộ 24 thẻ dọc xếp chồng $\rightarrow$ kéo dài **1.100px – 1.400px**, đẩy 2 khối hành động quan trọng bên dưới (*Bài tập được giao* và *Đánh giá gần nhất của giáo viên*) xuống tận đáy màn hình.
2. **Thiếu trải nghiệm đọc & tự học chủ động trước giờ lên lớp:**
   - Học viên hiện chỉ nhìn lướt text tĩnh, chưa có trình đọc tập trung như sách điện tử, chưa thể ghi chú (Take Note) các từ vựng/ý chính cần nhớ, và chưa có kênh hỏi trực tiếp giáo viên ngay tại đoạn bài học chưa rõ.
3. **Chưa đo lường được mức độ chuẩn bị bài trước giờ học:**
   - Khác với Google Meet (không thể biết học viên có đang onscreen hay chuyển tab khác), trên chính nền tảng LAK Education ta có thể đo **thời gian đọc thực tế (Active Reading Time)** kèm cơ chế chống mở treo máy.
   - Chưa có hệ thống tự động tính **Điểm Rèn Luyện / Chuẩn Bị Bài** và gửi báo cáo đa cấp cho **Giáo viên – Giáo vụ – Giám đốc**.

---

## 2. ĐẶC TẢ NGHIỆP VỤ & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION)

### 2.1. Quy chuẩn rút gọn `"Tổng Quan Bài Học (Lesson Overview)"` trên `/dashboard`
- **Giới hạn số dòng hiển thị trên Card Preview (`StudentPortalPanel`):**
  - **Desktop (`>= 768px`):** Hiển thị tối đa **4 dòng (items)** đầu tiên của `objectives` + hiệu ứng phủ mờ dần (`fade-out gradient`) ở dòng cuối nếu `objectives.length > 4`.
  - **Mobile (`390px`):** Hiển thị tối đa **3 dòng (items)** đầu tiên của `objectives` + `fade-out gradient` để khối Lesson Overview nằm gọn trong màn hình đầu tiên (Above the Fold).
  - Khối `Student Prep` hiển thị tóm tắt tối đa **2 dòng** (`ellipsis`), `Homework` tối đa **1–2 dòng** (`ellipsis`).
- **Tương tác chạm / click (Tap-to-Open Full View):**
  - Toàn bộ khung `pre-class-prep-guide` (`Lesson Overview`) có `cursor: pointer`, hiệu ứng hover nhẹ và thanh chân trang CTA nổi bật:
    - Nút chính: **`📖 Mở Sách Bài Học & Ghi Chú (Xem đầy đủ X mục)`** (EN: `📖 Open Lesson Reader & Notes (View all X items)`).
    - Hiển thị badge trạng thái chuẩn bị bài hiện tại của học viên ngay góc trên khối:
      - 🟢 `Đã chuẩn bị bài (3p 20s)` / `Prepared`
      - 🟡 `Đang đọc dở (45s)` / `In Progress`
      - ⚪ `Chưa đọc bài trước giờ học` / `Not Read Yet`
- **Phân tách hành vi theo Role khi tap mở rộng:**
  - **Vai trò `student` (Người Học):** Mở **Full-Screen Book Reader Viewer** (`100vw × 100vh`) có nút `Close`, đầy đủ tính năng Đọc sách + Ghi chú + Hỏi giáo viên + Bộ đếm thời gian đọc thực tế.
  - **Các vai trò khác (`teacher`, `academic`, `director`, `admin`):** Khi xem preview bài học (ở Classroom/Courses hoặc chế độ xem thử), mở Modal/Drawer đọc nhanh toàn văn giáo án (không ghi log tính điểm học viên).

---

### 2.2. Trình Đọc Sách Toàn Màn Hình (`LessonBookReaderModal` — Dành riêng cho `student`)
- **Kích thước & Lớp hiển thị:** Full-screen `100vw × 100vh`, `position: fixed`, `inset: 0`, `z-index: 1050`, khóa cuộn trang nền phía sau (`body overflow: hidden`).
- **Thanh điều khiển trên cùng (Reader Top Bar — cao `56px`, cố định trên đỉnh):**
  - **Trái:** Mã lớp + Tên lớp + Buổi học (`🏫 LH002 • Session 3 • 19/11/2026`).
  - **Giữa:**
    - Nút chỉnh cỡ chữ: **`A-`** / **`A+`** (`14px`, `16px`, `18px`, `20px` — lưu `localStorage`).
    - Nút chọn chế độ giấy đọc bảo vệ mắt: **☀️ Sáng (Light `#ffffff`)** / **📜 Giấy sách (Sepia `#faf6ed`)** / **🌙 Tối (Night `#111827`)**.
    - Chỉ báo tiến độ: Thanh progress nhỏ (`%` đã cuộn đọc) + Chip thời gian đọc thực (`⏱ 02:15` — tự chuyển màu xám khi tạm dừng).
  - **Phải:** Nút **`✕ Đóng (Close)`** rõ ràng, vùng chạm $\ge 40 \times 40\text{px}$ (hỗ trợ phím `ESC`).
- **Bố cục nội dung 2 vùng (Responsive Desktop & Mobile):**
  - **Desktop (`>= 992px`):** Chia 2 cột `65% / 35%`:
    - **Cột trái (`65%`) — Trang Sách Bài Học (Reading Canvas):**
      - Chiều rộng chữ tối ưu cho mắt (`max-width: 720px`, căn giữa, `line-height: 1.75`, font chữ dễ đọc).
      - Cấu trúc rõ ràng:
        1. **Essential Question / Lesson Title** (Tiêu đề lớn đầu trang).
        2. **Mục tiêu & Nội dung chi tiết (`Objectives`)**: Tự động phân nhóm theo các tiêu đề đậm như `READING`, `WRITING`. **Mỗi mục có 2 nút hành động nhanh tinh gọn khi hover/tap:**
           - `📝 Ghi chú` (tạo note gắn đúng mục này).
           - `🙋 Hỏi GV` (mở form đặt câu hỏi trích dẫn sẵn nội dung mục này).
        3. **Mục tiêu thời lượng hàng ngày (`60+ mins Reading`, `30+ mins Writing`)**.
        4. **Nội dung cần chuẩn bị trước giờ lên lớp (`Student Prep`)**.
        5. **Bài tập về nhà (`Homework`)** & **Slide bài giảng** (nếu có).
      - Cuối trang có nút xác nhận: **`✅ Con đã đọc hiểu xong bài học này`** (ghi nhận hoàn tất nếu đã đạt ngưỡng thời gian + cuộn trang).
    - **Cột phải (`35%`) — Bảng Tương Tác 2 Tab:**
      - **Tab 1: 📝 Ghi chú của con (`My Notes`)**
      - **Tab 2: 🙋 Hỏi Giáo Viên (`Ask Teacher Q&A`)**
  - **Mobile (`390px`):**
    - Toàn màn hình dành cho **Reading Canvas** (Zero Overflow-X).
    - Thanh đáy cố định (**Sticky Bottom Action Bar**, chiều cao `56px`, nút $\ge 44\text{px}$):
      - Nút `📝 Ghi chú (n)` $\rightarrow$ mở Bottom Sheet Ghi chú (`height: 75vh`).
      - Nút `🙋 Hỏi GV (m)` $\rightarrow$ mở Bottom Sheet Hỏi – Đáp (`height: 75vh`).

---

### 2.3. Tính Năng Ghi Chú Cá Nhân (`My Study Notes`)
- Học viên có thể tạo ghi chú tổng quát cho buổi học hoặc gắn vào 1 đoạn/mục cụ thể (`anchorIndex`, `anchorText`).
- Hỗ trợ chọn màu nhãn ghi chú (`💡 Ý chính`, `📖 Từ vựng mới`, `⚠️ Cần ôn lại`).
- **Quyền riêng tư tuyệt đối:** Ghi chú cá nhân chỉ thuộc về học viên đó (và phụ huynh đăng nhập tài khoản học viên), **không hiển thị cho học viên khác**.
- **Zero-Refresh 0ms:** Thêm/Sửa/Xóa ghi chú cập nhật ngay lập tức trên UI và đồng bộ Firestore.

---

### 2.4. Luồng Hỏi – Đáp 2 Chiều Học Viên $\leftrightarrow$ Giáo Viên (`Ask Teacher Q&A`)
1. **Học viên đặt câu hỏi:**
   - Chọn đoạn chưa rõ (hoặc bấm `🙋 Hỏi GV` trực tiếp ở 1 dòng mục tiêu) $\rightarrow$ nhập câu hỏi (tối đa 1.000 ký tự).
   - Bấm gửi $\rightarrow$ tạo document trong `lesson_questions` với `status: 'OPEN'`.
   - **Bắn Realtime Notification** qua `NotificationService` (`type: 'STUDENT_LESSON_QUESTION'`) đến:
     - **Giáo viên phụ trách lớp** (`cls.teacherId`).
     - *(Cấu hình mặc định)* Cán bộ **Giáo vụ** quản lý lớp để theo dõi SLA phản hồi.
2. **Giáo viên tiếp nhận & trả lời:**
   - Giáo viên nhìn thấy badge số câu hỏi chưa trả lời (`OPEN`) ngay trên:
     1. Chuông thông báo (click đi thẳng tới câu hỏi).
     2. Thẻ **Student Questions & Pre-Class Prep** trên `TeacherWorkspacePanel` (`/dashboard`).
     3. Tab **Lesson Plan / Q&A** bên trong phòng học `/classroom/:classId`.
   - Giáo viên nhập câu trả lời trực tiếp trên hệ thống (100% in-app, **TUYỆT ĐỐI KHÔNG DÙNG ZALO** tuân thủ `Native Teacher Zalo Isolation Guard`).
   - Giáo viên có tùy chọn switch: **`🌐 Chia sẻ câu trả lời cho cả lớp cùng học`** (`visibility: 'PRIVATE' | 'CLASS_SHARED'`, mặc định `PRIVATE` 1-1 để bảo vệ tâm lý học viên ngại hỏi).
3. **Học viên nhận phản hồi:**
   - Ngay khi GV bấm gửi trả lời $\rightarrow$ `status` chuyển `ANSWERED`, lưu `answeredBy`, `answeredAt`, `answerText`.
   - Bắn **Realtime Notification** (`type: 'TEACHER_QUESTION_ANSWERED'`) về chuông của học viên.
   - Học viên bấm thông báo $\rightarrow$ mở thẳng Book Reader tại Tab Q&A, có nút đánh dấu **`👍 Con đã hiểu rồi`** (`resolvedByStudent: true`).

---

### 2.5. Cơ Chế Đo Thời Gian Đọc Thực Tế (`Active Reading Time Tracking` — Anti-Cheat)
Mọi lần học viên mở `LessonBookReaderModal` đều được `LessonReadingTrackerService` theo dõi chính xác với **3 lớp chống gian lận**:

| Lớp kiểm soát | Cơ chế kỹ thuật | Hành vi hệ thống |
| :--- | :--- | :--- |
| **1. Tab Visibility Guard** | Lắng nghe sự kiện `document.visibilityState` & `window.blur / focus` | Khi học viên chuyển sang tab khác hoặc thu nhỏ cửa sổ $\rightarrow$ **Tạm dừng đồng hồ ngay lập tức**. Khi quay lại $\rightarrow$ Tiếp tục cộng dồn. |
| **2. Idle Detector (Chống treo máy)** | Theo dõi tương tác (`scroll`, `mousemove`, `touchstart`, `keydown`, `click`) | Sau **60 giây** không có bất kỳ thao tác nào $\rightarrow$ **Tạm dừng tính giờ** + hiển thị banner nhẹ *"Con vẫn đang đọc bài chứ? Chạm để tiếp tục"*. |
| **3. Scroll Coverage Depth** | Đo `scrollTop + clientHeight / scrollHeight` của vùng Reading Canvas | Lưu `maxScrollPercent` (`0–100%`). Nếu nội dung ngắn hơn khung hình (không có thanh cuộn) $\rightarrow$ mặc định `100%`. |

- **Cơ chế đồng bộ tiết kiệm chi phí Firestore (Cost-Optimized Sync):**
  - Bộ đếm chạy tại Client bằng `setInterval(1000)` chỉ cộng khi `isVisible && !isIdle`.
  - Ghi lên Firestore theo **Heartbeat mỗi 30 giây** (chỉ ghi khi có thêm $\ge 5$ giây mới) + **Flush cuối cùng** khi bấm nút `Close` hoặc sự kiện `pagehide` / `visibilitychange (hidden)`.
  - Tích lũy **đa phiên (multi-session)**: Nếu học viên đọc 1 phút buổi tối rồi sáng hôm sau đọc tiếp 2 phút $\rightarrow$ hệ thống cộng dồn thành `180 giây` (`totalActiveSeconds`), đồng thời phân tách rõ `preClassActiveSeconds` (đọc trước giờ học) và `postClassActiveSeconds` (ôn tập sau giờ học).

---

## 3. KIẾN TRÚC FIRESTORE & THIẾT KẾ MODULE (CLEAN MODULAR ARCHITECTURE)

Tuân thủ tuyệt đối chuẩn [`AGENTS.md`](../../AGENTS.md): **1 Sub-Feature = 1 Class** (kế thừa `BaseModuleService`), không can thiệp chéo module, lưu trữ trên database **`lakeducationdb`**.

### 3.1. Schema 3 Collections Firestore Mới

#### Collection 1: `lesson_reading_logs`
- **Document ID chuẩn:** `READ_${classId}_S${sessionIndex}_${studentId}` *(1 document duy nhất cho mỗi bộ Học viên – Lớp – Buổi học $\rightarrow$ tránh phình số lượng document, dễ truy vấn O(1))*.
```json
{
  "id": "READ_LH002_S3_HV235",
  "classId": "LH002",
  "className": "WP03 G5 Ms. Maj/357 7:20-9:20 pm",
  "sessionIndex": 3,
  "sessionDate": "2026-11-19",
  "sessionStartMs": 1795090800000,
  "studentId": "HV235",
  "studentName": "Nguyen Le Khanh Trang",
  "teacherId": "GV952",
  "totalActiveSeconds": 215,
  "preClassActiveSeconds": 185,
  "postClassActiveSeconds": 30,
  "minRequiredSeconds": 120,
  "maxScrollPercent": 96,
  "openCount": 2,
  "firstOpenedAt": "2026-11-18T13:10:00.000Z",
  "lastReadAt": "2026-11-19T11:45:00.000Z",
  "completedConfirmedAt": "2026-11-19T11:45:00.000Z",
  "prepStatus": "PREPARED",
  "prepScore": 100,
  "notesCount": 2,
  "questionsCount": 1,
  "updatedAt": "2026-11-19T11:45:00.000Z"
}
```

#### Collection 2: `lesson_student_notes`
- **Document ID chuẩn:** `NOTE_${classId}_S${sessionIndex}_${studentId}_${timestamp}`
```json
{
  "id": "NOTE_LH002_S3_HV235_1795001234567",
  "classId": "LH002",
  "sessionIndex": 3,
  "studentId": "HV235",
  "anchorIndex": 5,
  "anchorText": "Text Structure: Cause and Effect",
  "tag": "VOCAB",
  "content": "Signal words: because, therefore, as a result...",
  "isDeleted": false,
  "createdAt": "2026-11-18T13:12:00.000Z",
  "updatedAt": "2026-11-18T13:12:00.000Z"
}
```

#### Collection 3: `lesson_questions`
- **Document ID chuẩn:** `QA_${classId}_S${sessionIndex}_${studentId}_${timestamp}`
```json
{
  "id": "QA_LH002_S3_HV235_1795001299999",
  "classId": "LH002",
  "className": "WP03 G5 Ms. Maj/357 7:20-9:20 pm",
  "sessionIndex": 3,
  "studentId": "HV235",
  "studentName": "Nguyen Le Khanh Trang",
  "teacherId": "GV952",
  "teacherName": "Teacher Maj",
  "anchorIndex": 4,
  "anchorText": "Primary and Secondary Sources",
  "questionText": "Teacher, is a diary always a primary source?",
  "status": "ANSWERED",
  "visibility": "PRIVATE",
  "answerText": "Yes! A diary written by someone who lived through the event is a primary source.",
  "answeredBy": "GV952",
  "answeredByName": "Teacher Maj",
  "answeredAt": "2026-11-18T15:00:00.000Z",
  "resolvedByStudent": true,
  "isDeleted": false,
  "createdAt": "2026-11-18T13:15:00.000Z",
  "updatedAt": "2026-11-18T15:00:00.000Z"
}
```

### 3.2. Mở rộng `NOTIFICATION_TYPES` trong `src/core/services/NotificationService.js`
Bổ sung 4 loại thông báo chuẩn (tận dụng 100% hạ tầng Realtime WebSocket & `targetKeys` hiện có):
- `STUDENT_LESSON_QUESTION`: Học viên đặt câu hỏi mới trong bài học $\rightarrow$ gửi tới `teacherId` + `role:academic`.
- `TEACHER_QUESTION_ANSWERED`: Giáo viên đã trả lời câu hỏi $\rightarrow$ gửi tới `studentId`.
- `PRE_CLASS_PREP_REMINDER`: Nhắc học viên đọc bài trước giờ học (Giáo vụ/GV bấm nhắc) $\rightarrow$ gửi tới `studentId`.
- `PRE_CLASS_PREP_REPORT_ALERT`: Cảnh báo lớp có tỷ lệ đọc bài thấp (`< 50%`) trước giờ học $\rightarrow$ gửi tới `teacherId` + `role:academic` + `role:director`.

### 3.3. Cấu trúc Class & Component Độc Lập (`1 Sub-Feature = 1 Class`)
Tạo phân hệ con sạch sẽ trong `src/modules/lesson-reader/` (hoặc mở rộng gọn gàng trong `src/modules/dashboard/` + `src/shared/`):

| Thành phần | Đường dẫn đề xuất | Trách nhiệm duy nhất |
| :--- | :--- | :--- |
| **Service 1** | `src/modules/lesson-reader/services/LessonReadingTrackerService.js` | Tính toán ngưỡng đọc động, lưu/đọc `lesson_reading_logs`, cộng dồn thời gian trước/sau giờ học. |
| **Service 2** | `src/modules/lesson-reader/services/LessonStudentNoteService.js` | CRUD ghi chú cá nhân (`lesson_student_notes`) cô lập tuyệt đối theo `studentId`. |
| **Service 3** | `src/modules/lesson-reader/services/LessonQuestionService.js` | CRUD Hỏi – Đáp (`lesson_questions`), bắn Realtime Notification 2 chiều HV $\leftrightarrow$ GV. |
| **Service 4** | `src/modules/lesson-reader/services/ConductScoreService.js` | Engine tính **Điểm Chuẩn Bị Bài** từng buổi và **Điểm Rèn Luyện Tháng (Thang 100)** tổng hợp. |
| **Service 5** | `src/modules/lesson-reader/services/PreClassPrepReportService.js` | Tổng hợp ma trận báo cáo chuẩn bị bài theo Lớp / Buổi / Toàn trường cho 3 cấp (GV, Giáo vụ, Giám đốc). |
| **Hook** | `src/modules/lesson-reader/hooks/useActiveReadingTimer.js` | Custom Hook đo Active Reading Time tích hợp Visibility API + Idle 60s + Scroll Depth + Heartbeat 30s. |
| **UI 1** | `src/modules/lesson-reader/components/LessonOverviewCompactCard.jsx` | Khối rút gọn Lesson Overview (4 dòng Desktop / 3 dòng Mobile + Fade-out + Badge trạng thái đọc + Tap mở). |
| **UI 2** | `src/modules/lesson-reader/components/LessonBookReaderModal.jsx` | Trình đọc sách Full-Screen `100vw × 100vh` (Close, `A-/A+`, Light/Sepia/Dark, Reading Canvas). |
| **UI 3** | `src/modules/lesson-reader/components/LessonStudentNotesPanel.jsx` | Tab Ghi chú cá nhân (Desktop sidebar & Mobile Bottom Sheet). |
| **UI 4** | `src/modules/lesson-reader/components/LessonQuestionsPanel.jsx` | Tab Hỏi – Đáp với Giáo viên + giao diện trả lời cho GV. |
| **UI 5** | `src/modules/dashboard/components/TeacherPreClassPrepCard.jsx` | Thẻ theo dõi học viên đọc bài & Hộp thư Q&A trên Dashboard Giáo viên. |
| **UI 6** | `src/modules/dashboard/components/AcademicPreClassPrepMonitorCard.jsx` | Thẻ đôn đốc học viên chưa đọc bài + nút gửi nhắc nhở trên Dashboard Giáo vụ. |
| **UI 7** | `src/modules/dashboard/components/DirectorStudentReadinessCard.jsx` | KPI Card Tỉ lệ Chuẩn Bị Bài & Điểm Rèn Luyện toàn trường + Drawer đối soát cho Giám đốc. |

---

## 4. CÔNG THỨC ĐÁNH GIÁ CHUẨN BỊ BÀI & ĐIỂM RÈN LUYỆN (`ConductScoreService`)

### 4.1. Ngưỡng Công Nhận "Đã Đọc Bài Trước Giờ Học"
Để công bằng giữa bài ngắn và bài dài (như bài 24 mục của `LH002`):
- **Thời gian tối thiểu yêu cầu (`minRequiredSeconds` — ĐÃ CHỐT BỞI SẾP BẢO):**
  - Công thức động theo độ dài bài học (đã phê duyệt):
    $$\text{minRequiredSeconds} = \max\Big(90,\; \min\big(300,\; \text{objectivesCount} \times 8\big)\Big)$$
  - Kết hợp điều kiện cuộn trang: `maxScrollPercent >= 80%`.
  - *Ví dụ thực tế:* Bài có 6 mục $\rightarrow$ cần tối thiểu `90 giây` (1.5 phút). Bài `LH002` có 24 mục $\rightarrow$ cần tối thiểu `192 giây` (~3.2 phút). Trần tối đa `300 giây` (5 phút).
- **Phân loại trạng thái chuẩn bị bài (`prepStatus`) cho mỗi buổi học:**

| Trạng thái | Nhãn hiển thị | Điều kiện xác định | Điểm buổi (`prepScore`) |
| :--- | :--- | :--- | :---: |
| **`PREPARED`** | 🟢 Đã chuẩn bị tốt | `preClassActiveSeconds >= minRequiredSeconds` **VÀ** `maxScrollPercent >= 80` | **100 điểm** |
| **`SKIMMED`** | 🟡 Đọc lướt / Chưa đủ | `preClassActiveSeconds >= 30` (nhưng chưa đủ ngưỡng hoặc cuộn `< 80%`) | **50 điểm** |
| **`POST_READ`** | 🔵 Đọc ôn sau giờ học | `preClassActiveSeconds < 30` nhưng `postClassActiveSeconds >= minRequiredSeconds` | **40 điểm** |
| **`NOT_STARTED`** | 🔴 Chưa đọc bài | Chưa mở hoặc tổng thời gian `< 30 giây` | **0 điểm** |

### 4.2. Công Thức Tính Điểm Rèn Luyện Toàn Diện (Thang 100 điểm / Tháng)
Gộp dữ liệu thực từ hệ thống (Zero Mock Data) thành **Điểm Rèn Luyện (Student Conduct & Diligence Score)**:

$$\text{ConductScore} = 0.35 \times S_{\text{prep}} + 0.15 \times S_{\text{engage}} + 0.25 \times S_{\text{attend}} + 0.25 \times S_{\text{hw}}$$

Trong đó:
1. **$S_{\text{prep}}$ (35% — Chuẩn bị bài trước giờ học):** Trung bình `prepScore` của các buổi có giáo án sẵn sàng trong kỳ.
2. **$S_{\text{engage}}$ (15% — Chủ động tương tác):** Điểm khuyến khích khi học viên có ít nhất 1 `Take Note` hoặc 1 câu hỏi `Ask Teacher` chất lượng trước buổi học (`100` điểm nếu đạt $\ge 50\%$ số buổi, tuyến tính theo tỷ lệ).
3. **$S_{\text{attend}}$ (25% — Chuyên cần & Đúng giờ):** Tỷ lệ tham gia học đúng giờ lấy từ `session_evaluations` (vắng không phép `0`, đi trễ `70`, đúng giờ `100`).
4. **$S_{\text{hw}}$ (25% — Hoàn thành bài tập):** Tỷ lệ hoàn thành bài tập đúng hạn từ `exercise_assignments` & `exercise_attempts`.

**Xếp loại Rèn Luyện:**
- `90 – 100`: 🏆 **Xuất sắc (Exemplary)**
- `75 – 89`: 🌟 **Tốt (Good)**
- `60 – 74`: 👍 **Khá (Satisfactory)**
- `< 60`: ⚠️ **Cần Giáo Vụ / Phụ Huynh Phối Hợp Đôn Đốc (Needs Attention)**

---

## 5. MA TRẬN PHÂN QUYỀN 6 ROLES & BÁO CÁO 3 CẤP (RBAC INVARIANT)

| Quyền hạn / Dữ liệu | `student` (Người học) | `teacher` (GV bản xứ) | `academic` (Giáo vụ) | `director` (Giám đốc) | `accountant` (Kế toán) | `admin` (IT Admin) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Xem Card Lesson Overview rút gọn | ✅ (Lớp mình) | ➖ (Xem ở Classroom) | ➖ (Xem ở Classroom) | ➖ | ❌ | ✅ (Impersonate) |
| Mở **Full-Screen Book Reader** & tính giờ đọc | ✅ | 👁️ Xem preview (không tính giờ) | 👁️ Xem preview | 👁️ Xem preview | ❌ | ✅ |
| Tạo / Sửa / Xóa **Ghi chú cá nhân** (`My Notes`) | ✅ (Chỉ của mình) | ❌ (Bảo mật riêng tư HV) | ❌ | ❌ | ❌ | ❌ |
| Đặt câu hỏi **Ask Teacher Q&A** | ✅ (Lớp mình) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem & Trả lời câu hỏi Q&A | ✅ (Câu của mình + câu `CLASS_SHARED` của lớp) | ✅ (Chỉ lớp GV phụ trách) | ✅ (Toàn trường — giám sát SLA) | ✅ (Toàn trường — chỉ đọc) | ❌ | ✅ |
| Xem **Báo cáo Chuẩn bị bài & Điểm rèn luyện** | ✅ (Chỉ điểm của mình) | ✅ (Chỉ học viên lớp mình — **ẨN SĐT PH & ZALO & HỌC PHÍ**) | ✅ (Toàn trường + nút gửi nhắc nhở + SĐT PH) | ✅ (KPI Toàn trường + Drawer theo lớp) | ❌ | ✅ |

> **Kỷ luật Bảo mật Bất Biến (Tuân thủ `AGENTS.md`):**
> - **Student PII Privacy Guard:** Học viên tuyệt đối KHÔNG thấy thời gian đọc, điểm rèn luyện, ghi chú hay câu hỏi `PRIVATE` của học viên khác.
> - **Native Teacher Zalo Isolation Guard:** Trên thẻ báo cáo của Giáo viên (`TeacherPreClassPrepCard`), **TUYỆT ĐỐI KHÔNG** có nút/link Zalo hay SĐT phụ huynh; mọi tương tác Q&A diễn ra 100% trong hệ thống bằng tiếng Anh/song ngữ.

---

## 6. KẾ HOẠCH TRIỂN KHAI 3 PHASE (PHASED DELIVERY ROADMAP)

### 🚀 PHASE 1: Rút Gọn Lesson Overview + Full-Screen Book Reader + Đo Thời Gian Đọc Thực
- **Mục tiêu:** Giải quyết ngay lập tức lỗi UI quá dài trên `/dashboard` và đưa vào vận hành trình đọc sách chuyên nghiệp có ghi nhận thời gian đọc thật.
- **Công việc chi tiết:**
  1. Tạo `LessonReadingTrackerService.js` & Hook `useActiveReadingTimer.js` (Visibility API + Idle 60s + Scroll Depth + Heartbeat 30s).
  2. Tạo `LessonOverviewCompactCard.jsx` (Desktop 4 dòng / Mobile 3 dòng + Fade-out + Badge trạng thái đọc + Tap-to-Open) và tích hợp vào `StudentPortalPanel.jsx`.
  3. Tạo `LessonBookReaderModal.jsx` full-screen `100vw × 100vh` (nút `Close`, `A-/A+`, Light/Sepia/Dark, Reading Canvas chuẩn sách, nút xác nhận đọc xong).
  4. Kiểm thử Playwright E2E Desktop (`1366px`) & Mobile (`390px`) + Zero-Residue Teardown trên Local/Dev.

### 💬 PHASE 2: Ghi Chú Cá Nhân (Take Note) & Hỏi – Đáp 2 Chiều Với Giáo Viên (Ask Teacher Q&A)
- **Mục tiêu:** Kích hoạt tương tác học tập chủ động trong Book Reader và luồng Q&A realtime giữa Học viên và Giáo viên.
- **Công việc chi tiết:**
  1. Tạo `LessonStudentNoteService.js` & `LessonStudentNotesPanel.jsx` (CRUD 0ms, gắn đoạn bài học, cô lập theo `studentId`).
  2. Tạo `LessonQuestionService.js` & `LessonQuestionsPanel.jsx` (học viên đặt câu hỏi trích dẫn mục bài học, GV trả lời, tùy chọn `PRIVATE` / `CLASS_SHARED`).
  3. Mở rộng `NotificationService.js` với `STUDENT_LESSON_QUESTION` & `TEACHER_QUESTION_ANSWERED`.
  4. Gắn Hộp thư Q&A vào `TeacherWorkspacePanel.jsx` và `ClassroomCurriculumPanel.jsx`.
  5. Kiểm thử Playwright E2E luồng 2 vai trò (`student` gửi $\rightarrow$ `teacher` nhận thông báo & trả lời $\rightarrow$ `student` nhận thông báo & thấy câu trả lời) + Teardown.

### 📊 PHASE 3: Engine Điểm Rèn Luyện & Báo Cáo Chuẩn Bị Bài 3 Cấp (GV – Giáo Vụ – Giám Đốc)
- **Mục tiêu:** Tự động hóa đánh giá năng lực tự học của học viên và cung cấp bảng điều hành chuẩn bị bài cho toàn hệ thống quản lý.
- **Công việc chi tiết:**
  1. Tạo `ConductScoreService.js` & `PreClassPrepReportService.js` (tổng hợp dữ liệu từ `lesson_reading_logs`, `lesson_student_notes`, `lesson_questions`, `session_evaluations`, `exercise_attempts`).
  2. Xây dựng 3 thành phần báo cáo đối xứng:
     - `TeacherPreClassPrepCard.jsx` (nhúng vào `TeacherWorkspacePanel.jsx`).
     - `AcademicPreClassPrepMonitorCard.jsx` (nhúng vào `AcademicOperationsPanel.jsx` + nút nhắc nhở học viên chưa đọc bài).
     - `DirectorStudentReadinessCard.jsx` (nhúng vào `DirectorOverviewPanel.jsx` + Drawer đối soát toàn trường).
  3. Hiển thị thẻ **Điểm Rèn Luyện Của Con** trên `StudentPortalPanel.jsx` (chỉ hiển thị điểm cá nhân, có thanh phân rã 4 tiêu chí minh bạch).
  4. Kiểm thử Playwright E2E 6 Roles + 8 chỉ số `qc_layout_auditor.py` + Chạy kiểm thử kép DEV & PROD sau khi Sếp lệnh `deploy`.

---

## 7. MA TRẬN KIỂM THỬ 5 TRỤC THỰC TẾ (5-AXIS QC TEST MATRIX)

Script kiểm thử dự kiến: `scripts/qc_lesson_reader_and_prep_dual_env.py` (tuân thủ bắt buộc `wait_until='domcontentloaded'`, cấm `networkidle`).

| Mã Case | Trục Kiểm Thử | Vai Trò & Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Assertion) |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Trục 1: Compact UI & Data Thật** | Đăng nhập Học viên lớp `LH002` (có 24 mục `objectives`) trên `/dashboard` | Desktop chỉ hiện tối đa **4 mục** + fade-out; Mobile chỉ hiện tối đa **3 mục**; không kéo dài màn hình. |
| **TC-02** | **Trục 1: Full-Screen Book Reader** | Click vào vùng `Lesson Overview` trên Desktop & Mobile | Mở Reader `100vw × 100vh`, có nút `Close`, hiển thị đủ **24 mục**, chuyển đổi `Light/Sepia/Dark` và `A+/A-` tức thì 0ms. |
| **TC-03** | **Trục 1: Active Timer & Anti-Cheat** | Mở Reader, cuộn xuống đáy, chờ 10s, giả lập `visibilityState = hidden` | Thời gian cộng đúng khi active, **dừng ngay** khi ẩn tab, lưu thành công vào Firestore `lesson_reading_logs` khi bấm `Close` và giữ nguyên sau F5. |
| **TC-04** | **Trục 1: Take Note 0ms & F5 Integrity** | Học viên tạo 1 ghi chú gắn mục `Cause and Effect`, sửa và xóa 1 ghi chú khác | Cập nhật UI 0ms, reload F5 ghi chú đã lưu còn nguyên, ghi chú đã xóa không sống lại. |
| **TC-05** | **Trục 2: Q&A 2 Chiều & Realtime Notification** | Học viên `HV235` gửi câu hỏi $\rightarrow$ GV `GV952` mở chuông & trả lời $\rightarrow$ `HV235` kiểm tra | Thông báo đến đúng `GV952`; sau khi GV trả lời, trạng thái chuyển `ANSWERED`, `HV235` nhận thông báo ngay. |
| **TC-06** | **Trục 3: RBAC & Privacy Invariant** | Đăng nhập học viên khác cùng lớp (`HV801`) và Giáo viên (`GV952`) | `HV801` **KHÔNG** thấy ghi chú/câu hỏi `PRIVATE`/thời gian đọc của `HV235`. `GV952` **KHÔNG** thấy Zalo/SĐT PH/Học phí trên thẻ báo cáo. |
| **TC-07** | **Trục 3: Báo Cáo 3 Cấp (GV – Giáo vụ – Giám đốc)** | Lần lượt kiểm tra Dashboard của `teacher`, `academic`, `director` | Khớp 100% số lượng `PREPARED / SKIMMED / NOT_STARTED` theo `lesson_reading_logs` thực; Giáo vụ bấm nhắc nhở gửi được Notification tới HV. |
| **TC-08** | **Trục 4: Responsive 8 Chỉ Số** | Chạy `qc_layout_auditor.py` trên Desktop `1366×800` & Mobile `390×844` | `scrollWidth <= innerWidth` (0px overflow-x), nút bấm Mobile $\ge 40\text{px}$, Bottom Sheet không che khuất nút Close. |
| **TC-09** | **Trục 2 & 4: Dual-Env (DEV + PROD)** | Chạy E2E trên `dev.lakeducation.edu.vn` và `bk.lakeducation.edu.vn` sau deploy | Cả 2 môi trường cùng PASS 100% không lỗi Console / CORS / Firestore permission. |
| **TC-10** | **Trục 5: Zero-Residue Teardown** | Khối `finally` sau khi chạy xong test | Xóa sạch 100% documents test trong `lesson_reading_logs`, `lesson_student_notes`, `lesson_questions`, `notifications` vừa tạo. |
