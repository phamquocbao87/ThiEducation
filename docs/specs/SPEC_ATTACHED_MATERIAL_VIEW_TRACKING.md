# SPEC: Tính Thời Gian Xem Tài Liệu Đính Kèm Buổi Học (Attached Material View Time Tracking)

- **Mã tài liệu:** `SPEC-13-ATTACHED-MATERIAL-VIEW-TRACKING`
- **Trạng thái:** APPROVED & VERIFIED (PASS 100% Playwright E2E + Zero-Residue Teardown)
- **Người phê duyệt:** Sếp Bảo

## 1. Quy chuẩn nghiệp vụ
- **PDF / Slides / Practice / Image / Drive iframe:** Đạt chuẩn khi xem thực tế `>= 60 giây` (Visibility API Guard + nhận diện iframe focus + Check-in sau mỗi `120 giây`).
- **HTML5 `<video>` / `<audio>` trực tiếp:** Đạt chuẩn khi phát thực tế `>= 60%` thời lượng (hoặc `>= 60 giây` với media dài > 10 phút), chỉ đếm khi media đang phát (`!paused && !ended`), chống tua nhanh (`watchedBuckets`).
- **Chống cộng đúp giờ (`Hand-Off Pattern`):** Khi mở `MaterialPreviewModal` từ bên trong `LessonBookReaderModal`, đồng hồ Book Reader tự pause & flush ngay (`pausedExternally = true`), nhường quyền đếm cho `useMaterialViewTimer`.
- **Tổng hợp trạng thái chuẩn bị bài (`evaluatePrepStatus`):**
  - Giáo án không có tài liệu đính kèm: Giữ nguyên công thức cũ (`90s–300s` + cuộn `>= 80%`).
  - Giáo án có `N` tài liệu đính kèm: `60%` trọng số đọc giáo án + `40%` trọng số xem tài liệu; chỉ đạt `🟢 PREPARED (100)` khi hoàn thành cả đọc giáo án lẫn xem đạt chuẩn 100% tài liệu đính kèm.
- **Lưu trữ tập trung:** Ghi trực tiếp trong `lesson_reading_logs/{READ_<classId>_S<sessionIndex>_<studentId>}` (`materialLogs`, `materialActiveSeconds`, `materialsOpenedCount`, `materialsCompletedCount`, `materialsTotalCount`).
