# BA SPECIFICATION & 5-AXIS TEST MATRIX: Master Class Recordings Directory ("File Tổng Cho Recording")

- **Task Source:** `Bảng Giao Việc & Theo Dõi Tiến Độ Nhân Sự LAK.xlsx` — Sheet `Quốc IT` Row 7 (`Điểm 6`): *"Làm file tổng cho recording => thể hiện các recordings đã có của 1 lớp học"*
- **Status:** Approved by Sếp Bảo (`A1`: Dual placement on `/zoom-schedules` & `/classroom/:classId`; `A2`: Default shows existing recordings only, with Staff/Teacher toggle to show missing past sessions + `.xlsx` export)
- **Target Environment:** Local / DEV (`http://localhost:3000` → `lakeducation-dev`)

---

## 1. Business Rules & Clean Modular Architecture

1. **Dual Placement (`A1`) via Shared Component (`src/shared/components/ClassRecordingsDirectoryCard.jsx`):**
   - **Location 1 — `Live Class Schedules` (`/zoom-schedules`):** 3rd view option on top `<Segmented>` (`Lịch Tuần` | `Bảng Danh Sách` | `📹 Tổng Hợp Recording`). Provides a Class Selector scoped by role + `.xlsx` Excel export.
   - **Location 2 — `Classroom` (`/classroom/:classId` — Tab `Bài Học & Tài Liệu`):** Embedded directly below `Course Program Vault`, locked to the current class `cls.id` (`100%` isolated per class so `WP02` never leaks into `WP03`).
2. **Display Modes (`A2`):**
   - **Default (`onlyRecorded = true`):** Lists strictly the uploaded recordings of the selected class (matched to Session Index & Date), with 1-tap **`[▶ Xem Ngay]`** (opens fullscreen `MaterialPreviewModal`), **`[📋 Copy Link]`**, and for authorized Staff/Assigned Teacher: **`[+ Upload Recording]`** & **`[🗑️ Xoá]`** (`0ms` state update + Google Drive 30-day Trash).
   - **Staff/Teacher Toggle (`Hiện cả buổi chưa có video`):** Merges past scheduled sessions (`endMs <= now`) that have `0` recordings so Giáo vụ / Giáo viên immediately spot missing dates and click **`[+ Upload bù]`** pre-filled with that exact session date.
3. **Real Binary `.xlsx` Export (`src/shared/utils/xlsxExportUtils.js`):**
   - Zero-dependency OOXML `.xlsx` generator (`PK\x03\x04` ZIP archive) allowing Giáo vụ / Giám đốc / IT / Giáo viên to download `Tong_Hop_Recording_<Class>_<Date>.xlsx`.

---

## 2. 5-Axis Real Test Matrix (`scripts/qc_class_recordings_and_wonders_g5.py`)

| Axis | Test Case | Expected Result |
| :--- | :--- | :--- |
| **Axis 1 — Real Binary `.mp4` & `.xlsx`** | Upload a real `.mp4` recording from Class Recordings Directory (`0ms` appearance) + download real `.xlsx` file and parse cells via Python `zipfile`/`xml`. | Valid `.xlsx` binary downloaded containing exact class recording rows; `.mp4` playable in fullscreen modal and trashed on delete. |
| **Axis 2 — Realtime & 0ms Sync** | Upload & Delete recording in `/zoom-schedules` (`viewMode = 'recordings'`) and `/classroom/LH002`. | `0ms` UI update without reload; persists across `F5`. |
| **Axis 3 — 6-Role RBAC Scoping** | Compare `HV235` (Student in `LH002`), `GV952` (Teacher), and `ACA404` (Academic). | `HV235` sees ONLY `LH002` recordings (no `LH004`, no Upload/Delete, no missing-session toggle, no `STAFF_ONLY`). `ACA404` sees all classes, missing toggle, Upload/Delete, and `.xlsx` export. |
| **Axis 4 — Responsive Desktop & Mobile** | Assert `Zero Overflow-X` on `1366x850` & `390x844` (including 3-option `<Segmented>` header on Mobile `390px`). | `scrollWidth <= innerWidth`, buttons `>= 38-40px`. |
| **Axis 5 — Zero-Residue Teardown** | `finally` deletes test recording from Firestore & moves test `.mp4` to Trash/deletes on Drive. | `0%` test residue in `lakeducation-dev`. |
