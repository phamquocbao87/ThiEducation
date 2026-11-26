# BA SPECIFICATION & 5-AXIS TEST MATRIX (v2.0): 18-Hour Hard-Lock, Teacher Unlock Request & Manager 18h Re-Unlock

- **Task Source:** `Bảng Giao Việc & Theo Dõi Tiến Độ Nhân Sự LAK.xlsx` — Sheet `Quốc IT` Row 6 (`Điểm 5`) + Sếp Bảo's v2.0 Security & Governance Directive (`26/11/2026`)
- **Status:** Approved by Sếp Bảo (`Hard-Lock >18h` + `18h Re-Unlock Duration` + `Default Lock for All with 1-Tap Manager Unlock & Teacher Request`)
- **Target Environment:** Local / DEV (`http://localhost:3000` → `lakeducation-dev`) — Uncommitted in Working Tree per Rule 6

---

## 1. Approved Business Rules (v2.0 Governance Model)

### Rule 1 — Strict 18-Hour Hard-Lock (`>18h` Auto-Lock for All Users)
1. **Live & Initial 18-Hour Window (`startMs <= now <= endMs + 18h`):**
   - Session evaluation is **OPEN (`canEvaluate = true`)**.
   - `findClassSession(cls, now, { allowRecentEnded: true })` keeps the just-ended session active for `18 hours` with a live countdown (`⏳ Còn Xg Yp`).
   - Session is only marked **Completed (`isComplete = true`)** when **100% of non-absent (`presence !== 'OFFLINE'`) roster students** have a non-empty written `comment`.
2. **Hard-Lock Past `18 hours` (`now > endMs + 18h` without active unlock):**
   - Session evaluation is **HARD-LOCKED (`isLockedAfter18h = true`, `canEvaluate = false`)** across **ALL roles by default** (prevents accidental edits to historical student records; applies to both incomplete and already-completed sessions).
   - Enforced at **both** UI layer (star ratings, rich-text editors, quick tags, seating quick-rate, `Save` & `Save & Complete` disabled) **and** Firestore Transaction layer (`ClassroomRealtimeService.saveStudentEvaluation` & `saveAllEvaluations` throw `EVALUATION_WINDOW_LOCKED` if `isLockedAfter18h`).

### Rule 2 — Manager Unlock & Manual Re-Lock (`academic`, `director`, `admin`)
1. **Authorized Roles:** Exclusively **Giáo vụ (`academic`)**, **Giám đốc (`director`)**, and **IT Admin (`admin`)** (`PermissionService.canUnlockSessionEvaluation(role)`).
2. **18-Hour Temporary Unlock Window (`A1`):**
   - Clicking **`[🔓 Mở Khóa Đánh Giá Lại (18h)]` / `[🔓 Duyệt Mở Khóa (18h)]`** sets `unlockState = { status: 'UNLOCKED', unlockedAtMs: now, unlockedUntilMs: now + 18 * 3600 * 1000, unlockedBy, unlockedByName, unlockedByRole }`.
   - For the next **18 hours** (`now < unlockedUntilMs`), the session is **OPEN (`isTemporarilyUnlocked = true`, `canEvaluate = true`)** with a live countdown (`🔓 Đã mở khóa — Còn Xg Yp`).
   - Once `now >= unlockedUntilMs`, the session **automatically re-locks** without needing a cronjob.
   - Managers also have a 1-tap **`[🔒 Khóa Lại Ngay]` (`Lock Now`)** button to immediately re-lock the session at any time.
   - Unlocking dispatches a realtime notification (`EVALUATION_UNLOCK_APPROVED`) directly to the class's assigned teacher (`cls.teacherId`).

### Rule 3 — Teacher Unlock Request Workflow (`teacher`)
1. When viewing any locked past session (`>18h`) in `/classroom/:classId?tab=evaluation`, the assigned Teacher sees **`[📨 Gửi Yêu Cầu Mở Khóa]` (`Request Unlock`)**.
2. Submitting the request (with optional/quick reason) updates `unlockState.status = 'REQUESTED'` in **`0ms`**, switches the button to **`⏳ Đã gửi yêu cầu — Chờ Giáo vụ duyệt`** (preventing duplicate spam), and dispatches a realtime notification (`EVALUATION_UNLOCK_REQUESTED`) to **`ROLE:academic`, `ROLE:director`, and `ROLE:admin`**.
3. Pending unlock requests surface immediately at the top of `PendingEvaluationTasksCard` on the **Academic, Director, and IT Admin Dashboards** (with a 1-tap **`[🔓 Duyệt Mở Khóa 18h]`** button right on the Dashboard card) as well as inside the Classroom session banner.

---

## 2. Clean Modular Architecture Impact Map

| Layer | File | Responsibility |
| :--- | :--- | :--- |
| **RBAC & Notifications** | `src/core/services/PermissionService.js`<br>`src/core/services/NotificationService.js` | Add `canUnlockSessionEvaluation`, `canRequestEvaluationUnlock`, include `admin`/`director` in `canEvaluateStudents`; add `EVALUATION_UNLOCK_REQUESTED` & `EVALUATION_UNLOCK_APPROVED`. |
| **Shared Time & Lock Math** | `src/shared/utils/classSessionUtils.js` | Upgrade `getSessionFeedbackWindowState` & `mergeSessionEvaluationDocs` to compute `isLockedAfter18h`, `isTemporarilyUnlocked`, `isUnlockRequested`, `unlockRemainingMs`, plus `resolveSessionEndMs`. |
| **Realtime Firestore Service** | `src/shared/services/ClassroomRealtimeService.js`<br>`src/shared/models/classroom.model.js` | Enforce `EVALUATION_WINDOW_LOCKED` inside `saveStudentEvaluation` & `saveAllEvaluations`; implement `requestSessionEvaluationUnlock`, `unlockSessionEvaluation`, and `relockSessionEvaluation` transactions + notifications. |
| **Classroom Controller & UI** | `src/modules/classroom/hooks/useClassroomController.js`<br>`src/modules/classroom/ClassroomPage.jsx`<br>`src/modules/classroom/components/SessionEvaluationModal.jsx` | Enforce `canEvaluate = false` when `isLockedAfter18h`; add Teacher `Request Unlock` modal, Manager 1-tap `Unlock (18h)` / `Approve Unlock (18h)` / `Lock Now` controls, and live unlock countdown banner (`0ms` state update). |
| **Dashboards (`Academic`, `Director`, `Admin`, `Teacher`)** | `src/modules/dashboard/services/PendingEvaluationTaskService.js`<br>`src/modules/dashboard/components/PendingEvaluationTasksCard.jsx`<br>`src/modules/dashboard/components/TeacherEvaluationTasksCard.jsx`<br>`src/modules/dashboard/components/ClassMonitoringPanel.jsx` | Surface `📨 Unlock Requested` & `🔒 Locked >18h` sessions; enable 1-tap `Approve Unlock 18h` directly from Academic/Director/Admin Dashboards; show `🔓 Unlocked` status on Teacher Dashboard. |

---

## 3. 5-Axis Real Test Matrix (`scripts/qc_teacher_feedback_18h_window.py`)

| Axis | Test Case | Expected Result |
| :--- | :--- | :--- |
| **Axis 1 — Lock Math & Full E2E Lifecycle** | 1A. Unit math: `+13h` open, `+18.5h` hard-locked (`isLockedAfter18h: true`), unlocked `+17h` open (`isTemporarilyUnlocked: true`), unlocked `+18.1h` auto-relocked!<br>1B. Live E2E on `LH002` `19/11/2026` (`>18h`):<br>• Teacher `GV952` opens session -> **Hard-locked** (`Save` & editors disabled).<br>• Teacher submits **`Request Unlock`** -> `0ms` switches to `Waiting for Academic Approval` + creates notification.<br>• Academic `ACA404` sees **`📨 Unlock Request`** on Dashboard & approves **`Unlock 18h`** -> `0ms` unlocked!<br>• Teacher `GV952` now edits & saves student comment (`8/10 -> 7/10`, persists across `F5`)!<br>• Academic clicks **`Lock Now`** -> immediately re-locks (`Save` disabled again)! | `100%` of lifecycle transitions succeed in `0ms` and persist across `F5`. |
| **Axis 2 — Transaction Security Guard** | Attempt direct `ClassroomRealtimeService.saveStudentEvaluation` call on a locked `>18h` session while `GV952` is logged in. | Rejected with `EVALUATION_WINDOW_LOCKED`. |
| **Axis 3 — 6-Role RBAC Scoping** | Verify `GV952` (cannot unlock own session, no Zalo/fees), `ACA404` & `ADM001` (can unlock/relock), `HV235` (isolated from staff lock/request UI). | Strict role enforcement across UI & service layer. |
| **Axis 4 — Dual Viewport Responsive** | Desktop (`1366x850`) & Mobile (`390x844`) + `scripts/qc_layout_auditor.py`. | `Zero Overflow-X` (`scrollWidth <= innerWidth`), touch targets `>= 38-40px`. |
| **Axis 5 — Zero-Residue Teardown** | `finally` block restores `LIVE_LH002_*` evaluation/unlock state and deletes test notifications (`NOTI-*`) created during QC. | `0%` test residue in `lakeducation-dev`. |
