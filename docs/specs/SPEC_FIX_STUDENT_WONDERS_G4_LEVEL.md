# BA SPECIFICATION & 5-AXIS TEST MATRIX: Fix `WONDERS-G4` Level Mismatch on `WP02` & `WP03` Students

- **Task Source:** `Bảng Giao Việc & Theo Dõi Tiến Độ Nhân Sự LAK.xlsx` — Sheet `Quốc IT` Row 8 (`Điểm 7`): *"Check tài khoản học sinh vì vẫn để Wonder G4 — Tất cả học sinh 2 lớp WP02 và WP03 đều bị như vậy ạ"*
- **Status:** Approved by Sếp Bảo (`A3`: Full Course-to-Class-to-Student inheritance in Code + DEV Database synchronization)
- **Target Environment:** Local / DEV (`http://localhost:3000` → `lakeducation-dev`)

---

## 1. Root Cause Summary
1. Parent Course `courses/KH-7569` (*Wonder Grade 5 (G5) - 2023*) has `level: "WONDERS-G5"`, while child class `classes/LH002` (`WP03 G5`) retained stale `courseLevel: "WONDERS-G4"` and `classes/LH004` (`WP02 G5`) had `courseLevel: null`.
2. Enrolled students in `users` (`HV120`, `HV199`, `HV235`, `HV253`, `HV267`, `HV361`, `HV479`, `HV801`, `HV866`, `HV891`...) retained stale `level: "WONDERS-G4"` (or unnormalized course name), and `student_goals` generated `"Chinh Phục Toàn Diện McGraw-Hill WONDERS-G4"`.
3. `ClassroomCurriculumPanel.jsx` rendered `cls?.courseLevel` before parent Course `level`.

---

## 2. Approved Fix (`A3`)
1. **Parent Course Level Inheritance in Code:**
   - `CourseService.saveCourse`: cascades updated `level` & `name` (`courseLevel`, `courseName`) to all child `classes` with matching `courseId`.
   - `ClassService.saveClass`: resolves `courseLevel` from parent `courses/{courseId}.level` and syncs enrolled students' `users.level` + `student_goals` when assigned.
   - `useClassroomController.js` & `ClassroomCurriculumPanel.jsx`: resolve `parentCourse.level` first so `Course Program Vault` always displays the true parent Course level (`WONDERS-G5`).
   - `StudentGoalService.js`: self-heals stale `WONDERS-G4` goals when the class's active `courseLevel` is `WONDERS-G5`, and maps `G4/G5/G6` CEFR targets accurately.
2. **Idempotent Data Synchronization on DEV (`lakeducation-dev`):**
   - Synchronizes `LH002` (`WP03`) & `LH004` (`WP02`) `courseLevel -> "WONDERS-G5"`, all 21 enrolled students' `users.level -> "WONDERS-G5"`, and any stale `WONDERS-G4` `student_goals` to `WONDERS-G5`.

---

## 3. 5-Axis Verification (`scripts/qc_class_recordings_and_wonders_g5.py`)
- Verify live as Student `HV235` (`WP03` / `LH002`) and Student `HV768` (`WP02` / `LH004`) across Dashboard, My Profile, Attendance, Academic Transcript/Goals, and Classroom `Course Program Vault`: **`0` occurrences of `WONDERS-G4`**, **`100%` `WONDERS-G5`**.
