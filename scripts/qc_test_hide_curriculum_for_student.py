import asyncio
import os
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

async def test_hide_curriculum_for_student():
    print("=" * 80)
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E ẨN TAB CURRICULUM LEVELS ĐỐI VỚI HỌC VIÊN")
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
        # TEST 1: KIỂM TOÁN TÀI KHOẢN HỌC VIÊN (HV768 - Kenji)
        # -------------------------------------------------------------
        url_student = "http://127.0.0.1:3000/courses-classes?sso_uid=HV768"
        print(f"\n[TEST 1] 1. Truy cập trang Khóa học & Lớp học với vai trò Học viên: {url_student}")
        await page.goto(url_student, wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        # 1.1 Kiểm tra các Tab hiển thị
        tabs = page.locator('.ant-tabs-tab')
        tab_count = await tabs.count()
        tab_texts = [await tabs.nth(i).inner_text() for i in range(tab_count)]
        print(f"   - Danh sách các Tabs hiển thị cho học viên ({tab_count} tabs): {tab_texts}")
        assert tab_count == 2, f"FAIL: Học viên phải thấy đúng 2 tabs, nhưng thấy {tab_count} tabs: {tab_texts}"

        # 1.2 Khẳng định Tab 'Curriculum Levels' KHÔNG tồn tại
        has_curriculum_tab = any("Curriculum" in t or "Cấp Độ" in t for t in tab_texts)
        assert not has_curriculum_tab, f"FAIL: Học viên vẫn thấy tab Curriculum Levels! {tab_texts}"
        print("   ✅ XÁC NHẬN: Tab 'Curriculum Levels' ĐÃ ĐƯỢC ẨN 100% đối với Học viên!")

        # 1.3 Thử truy cập Deep-Link ?tab=curriculum với vai trò Học viên
        url_student_deeplink = "http://127.0.0.1:3000/courses-classes?tab=curriculum&sso_uid=HV768"
        print(f"\n   1.3 Kiểm tra Deep-link ?tab=curriculum: {url_student_deeplink}")
        await page.goto(url_student_deeplink, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        active_tab = await page.locator('.ant-tabs-tab-active').inner_text()
        print(f"   - Tab active thực tế khi học viên mở ?tab=curriculum: '{active_tab.replace(chr(10), ' ')}'")
        assert "Class" in active_tab or "Lớp" in active_tab, \
            f"FAIL: Học viên không được fallback về tab classes! Nhận: {active_tab}"
        print("   ✅ XÁC NHẬN: Deep-link ?tab=curriculum tự động fallback về tab Lớp Học an toàn!")

        # 1.4 Chụp ảnh Desktop học viên
        student_desktop_snap = os.path.join(ARTIFACTS_DIR, "qc_student_courses_no_curriculum_desktop.png")
        await page.screenshot(path=student_desktop_snap, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Desktop Học viên: {student_desktop_snap}")

        # 1.5 Kiểm tra Mobile 390px Zero Overflow-X
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(1000)
        overflow_x = await page.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        print(f"   - Mobile 390px Viewport Check: scrollWidth={overflow_x['scrollWidth']}px, innerWidth={overflow_x['innerWidth']}px")
        assert not overflow_x['hasOverflow'], f"FAIL: Mobile bị tràn ngang! {overflow_x}"
        print("   ✅ ASSERT Zero Overflow-X PASS trên Mobile 390px!")

        student_mobile_snap = os.path.join(ARTIFACTS_DIR, "qc_student_courses_no_curriculum_mobile_390.png")
        await page.screenshot(path=student_mobile_snap, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Mobile Học viên: {student_mobile_snap}")

        # -------------------------------------------------------------
        # TEST 2: KIỂM TOÁN VAI TRÒ GIÁO VIÊN / ADMIN (VẪN THẤY ĐỦ 3 TABS)
        # -------------------------------------------------------------
        print("\n[TEST 2] KIỂM TOÁN VAI TRÒ GIÁO VIÊN BẢN XỨ (GV952) / ADMIN...")
        await page.set_viewport_size({"width": 1280, "height": 850})
        url_teacher = "http://127.0.0.1:3000/courses-classes?sso_uid=GV952"
        await page.goto(url_teacher, wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        teacher_tabs = page.locator('.ant-tabs-tab')
        teacher_tab_count = await teacher_tabs.count()
        teacher_tab_texts = [await teacher_tabs.nth(i).inner_text() for i in range(teacher_tab_count)]
        print(f"   - Danh sách Tabs hiển thị cho Giáo viên ({teacher_tab_count} tabs): {teacher_tab_texts}")
        assert teacher_tab_count == 3, f"FAIL: Giáo viên phải thấy đủ 3 tabs! Nhận: {teacher_tab_texts}"
        assert any("Curriculum" in t or "Cấp Độ" in t for t in teacher_tab_texts), \
            f"FAIL: Giáo viên bị mất tab Curriculum Levels! {teacher_tab_texts}"
        print("   ✅ XÁC NHẬN: Giáo viên/Admin vẫn bảo toàn đầy đủ 3 Tabs bao gồm Curriculum Levels!")

        teacher_desktop_snap = os.path.join(ARTIFACTS_DIR, "qc_teacher_courses_has_curriculum_desktop.png")
        await page.screenshot(path=teacher_desktop_snap, full_page=True)
        print(f"   📸 Đã chụp ảnh minh chứng Giáo viên: {teacher_desktop_snap}")

        await browser.close()
        print("\n" + "=" * 80)
        print("🎉 PHÒNG QC BÁO CÁO: 100% KỊCH BẢN ĐẠT CHUẨN XUẤT SẮC!")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_hide_curriculum_for_student())
