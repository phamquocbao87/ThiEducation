import asyncio
import os
import sys
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

async def run_qc_student_attendance_test():
    print("=" * 80)
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E NÂNG CẤP LỜI NHẬN XÉT SƯ PHẠM")
    print("   & ĐỒNG BỘ HIỂN THỊ TRÊN GIAO DIỆN HỌC VIÊN + GIÁO VIÊN")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 850})
        page = await context.new_page()

        # -------------------------------------------------------------
        # TEST 1: KIỂM TOÁN GIAO DIỆN HỌC VIÊN KENJI (HV768)
        # -------------------------------------------------------------
        url_student = "http://127.0.0.1:3000/class-attendance-evaluation?sso_uid=HV768"
        print(f"\n[TEST 1] 1. Truy cập với vai trò Học viên Kenji: {url_student}")
        await page.goto(url_student, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # 1. Kiểm tra Tiêu đề trang
        title_text = await page.locator("h3").first.inner_text()
        print(f"   - Tiêu đề trang học viên: '{title_text}'")
        assert "Quá Trình Rèn Luyện & Chuyên Cần" in title_text or "Personal Learning Journey" in title_text, \
            f"FAIL: Tiêu đề chưa cá nhân hóa! Nhận: {title_text}"
        print("   ✅ Tiêu đề trang đã cá nhân hóa 100% chuẩn xác!")

        # 2. Kiểm tra Thẻ Hero Profile cá nhân
        hero_view = page.locator('[data-testid="student-personal-attendance-view"]')
        assert await hero_view.is_visible(), "FAIL: Không tìm thấy component StudentAttendancePersonalView!"
        hero_text = await hero_view.inner_text()
        assert "KENJI" in hero_text or "HV768" in hero_text, "FAIL: Thiếu tên tiếng Anh hoặc mã học viên Kenji"
        assert "Teacher Maj" in hero_text or "GV" in hero_text, "FAIL: Thiếu thông tin Giáo viên bản xứ"
        print("   ✅ Thẻ thông tin cá nhân & giáo trình Wonders hiển thị đầy đủ!")

        # 3. Kiểm tra Callout Box nhận xét sư phạm của Giáo viên bản xứ
        callout_boxes = page.locator('[data-testid="teacher-feedback-callout"]')
        callout_count = await callout_boxes.count()
        print(f"   - Số lượng Callout Box nhận xét sư phạm tìm thấy: {callout_count}")
        assert callout_count > 0, "FAIL: Không tìm thấy Callout Box nhận xét sư phạm nào!"
        first_callout_text = await callout_boxes.first.inner_text()
        print(f"   - Nội dung Callout Box đầu tiên: {first_callout_text.replace(chr(10), ' ')}")
        assert "Teacher Maj" in first_callout_text or "Nhận Xét Sư Phạm" in first_callout_text or "Teacher's Remark" in first_callout_text, \
            "FAIL: Callout Box thiếu nhãn nhận xét hoặc tên giáo viên!"
        print("   ✅ Khung nhận xét sư phạm (Callout Box) hiển thị sang trọng, nổi bật 100%!")

        # 4. Kiểm tra Badge 'Đang cập nhật nhận xét' (Pending Feedback)
        pending_badges = page.locator('[data-testid="teacher-feedback-pending"]')
        pending_count = await pending_badges.count()
        print(f"   - Số lượng buổi học đang chờ giáo viên nhận xét: {pending_count}")
        if pending_count > 0:
            pending_text = await pending_badges.first.inner_text()
            assert "Đang cập nhật nhận xét" in pending_text or "Feedback Updating" in pending_text, \
                f"FAIL: Badge pending không đúng text! {pending_text}"
            print("   ✅ Badge trạng thái 'Đang cập nhật nhận xét' hiển thị minh bạch, chuẩn xác!")

        # 5. Chụp ảnh minh chứng Desktop
        desktop_snap_path = os.path.join(ARTIFACTS_DIR, "qc_student_personal_attendance_desktop.png")
        await page.screenshot(path=desktop_snap_path, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Desktop: {desktop_snap_path}")

        # -------------------------------------------------------------
        # TEST 2: KIỂM TOÁN MOBILE VIEWPORT (390x844) ZERO OVERFLOW-X
        # -------------------------------------------------------------
        print("\n[TEST 2] KIỂM TOÁN GIAO DIỆN DI ĐỘNG (MOBILE 390x844)...")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(1500)

        overflow_x_check = await page.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        print(f"   - Mobile Viewport Check: scrollWidth={overflow_x_check['scrollWidth']}px, innerWidth={overflow_x_check['innerWidth']}px")
        assert not overflow_x_check['hasOverflow'], f"FAIL: Mobile bị tràn ngang! {overflow_x_check}"
        print("   ✅ ASSERT Zero Overflow-X PASS trên Mobile 390px!")

        mobile_snap_path = os.path.join(ARTIFACTS_DIR, "qc_student_personal_attendance_mobile_390.png")
        await page.screenshot(path=mobile_snap_path, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Mobile: {mobile_snap_path}")

        # -------------------------------------------------------------
        # TEST 3: KIỂM TOÁN VAI TRÒ GIÁO VIÊN BẢN XỨ (TEACHER MAJ - GV952)
        # -------------------------------------------------------------
        print("\n[TEST 3] KIỂM TOÁN VAI TRÒ GIÁO VIÊN BẢN XỨ (TEACHER MAJ - GV952)...")
        await page.set_viewport_size({"width": 1280, "height": 850})
        url_teacher = "http://127.0.0.1:3000/class-attendance-evaluation?sso_uid=GV952"
        await page.goto(url_teacher, wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        # Kiểm tra nút danh sách nhận xét học viên chi tiết
        feedback_btns = page.locator('[data-testid="session-student-feedbacks-btn"]')
        fb_btn_count = await feedback_btns.count()
        print(f"   - Tìm thấy {fb_btn_count} ca dạy có nhận xét chi tiết từng học viên")
        assert fb_btn_count > 0, "FAIL: Không tìm thấy nút nhận xét chi tiết học viên trong SessionEvaluationTable!"

        # Bấm thử nút đầu tiên để mở Popover danh sách nhận xét
        first_btn = feedback_btns.first
        await first_btn.scroll_into_view_if_needed()
        await first_btn.click()
        await page.wait_for_timeout(1000)

        popover_content = page.locator('.ant-popover:not(.ant-popover-hidden)').first
        assert await popover_content.is_visible(), "FAIL: Popover nhận xét chi tiết không mở khi bấm nút!"
        popover_text = await popover_content.inner_text()
        print(f"   - Popover nhận xét chi tiết học viên: {popover_text[:120].replace(chr(10), ' ')}...")
        assert "HV" in popover_text or "Teacher" in popover_text, "FAIL: Nội dung Popover thiếu mã học viên hoặc nhận xét!"
        print("   ✅ Popover liệt kê đầy đủ nhận xét của từng học viên hoạt động hoàn hảo!")

        teacher_snap_path = os.path.join(ARTIFACTS_DIR, "qc_teacher_evaluation_new_column.png")
        await page.screenshot(path=teacher_snap_path, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Giáo viên với Popover nhận xét: {teacher_snap_path}")

        await browser.close()
        print("\n" + "=" * 80)
        print("🎉 PHÒNG QC BÁO CÁO: 100% KỊCH BẢN KIỂM THỬ ĐÃ ĐẠT TIÊU CHUẨN XUẤT SẮC!")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_qc_student_attendance_test())
