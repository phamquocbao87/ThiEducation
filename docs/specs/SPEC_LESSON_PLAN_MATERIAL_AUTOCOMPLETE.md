# SPEC: Ô Autocomplete Chọn Tài Liệu Đã Chia Sẻ Cho Lớp Trong "Soạn Giáo Án"

- **Mã tài liệu:** `SPEC-12-LESSON-PLAN-MATERIAL-AUTOCOMPLETE`
- **Trạng thái:** VERIFIED — PASS 100% PLAYWRIGHT E2E & ZERO-RESIDUE TEARDOWN

## 1. Mục tiêu
- Trong modal **Soạn Giáo Án** ([LessonPlanEditorModal.jsx](file:///Volumes/DATA/projects/ThiEducation/src/modules/classroom/components/LessonPlanEditorModal.jsx)), cung cấp 1 ô Autocomplete đa chọn (`LessonMaterialAutocomplete`) giúp Giáo viên / Giáo vụ gõ tìm và đính kèm nhanh nhiều tài liệu đã được chia sẻ cho lớp (`PDF`, `AUDIO`, `PRACTICE`, `SLIDES`, `VIDEO`).
- Ưu tiên tài liệu được share trực tiếp cho lớp (`sharedClassIds`), kế tiếp tài liệu khóa học và công khai toàn trường; loại trừ tuyệt đối tài liệu đã xóa, tài liệu nội bộ giáo viên (`STAFF_ONLY` / `TEACHERS_ONLY`) và video ghi hình buổi học cũ (`isSessionRecording`).
- Lưu vào trường `attachedMaterials` trong giáo án (`classes/{classId}.lessonPlans[sessionIndex]`) và đồng bộ hiển thị tại Classroom (`ClassroomCurriculumPanel`), Dashboard Học viên (`LessonOverviewCompactCard`) và Chế độ Đọc Sách (`LessonBookReaderModal`).
