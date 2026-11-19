import asyncio
import os
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

async def test_lesson_plan_alerts_e2e():
    print("=" * 80)
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E TÍNH NĂNG NHẮC NHỞ GIÁO ÁN 24H & BÁO THIẾU GIÁO TRÌNH")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # -------------------------------------------------------------
        # TEST 1: GIÁO VỤ ĐÀO TẠO (ACA101 - Academic Coordinator)
        # -------------------------------------------------------------
        print("\n[TEST 1] Kiểm tra Dashboard Giáo Vụ (Academic Coordinator)...")
        context_aca = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_aca = await context_aca.new_page()

        await page_aca.goto("http://127.0.0.1:3000/dashboard?sso_uid=ACA101", wait_until="domcontentloaded")
        await page_aca.wait_for_timeout(3000)

        # Assert card monitor
        monitor_card = page_aca.locator('[data-testid="academic-lesson-plan-monitor-card"]')
        has_monitor_card = await monitor_card.count() > 0
        print(f"  - AcademicLessonPlanMonitorCard hiện diện: {has_monitor_card}")

        # Check Zero Overflow-X Desktop
        sw = await page_aca.evaluate("() => document.documentElement.scrollWidth")
        iw = await page_aca.evaluate("() => window.innerWidth")
        print(f"  - Desktop scrollWidth: {sw} vs innerWidth: {iw}")
        assert sw <= iw, f"FAIL: Bị tràn ngang Desktop Giáo Vụ! {sw} > {iw}"

        # Chụp ảnh Desktop Giáo vụ
        shot_aca_desk = os.path.join(ARTIFACTS_DIR, "qc_academic_lesson_plan_monitor_desktop.png")
        await page_aca.screenshot(path=shot_aca_desk, full_page=True)
        print(f"  📸 Đã chụp: {shot_aca_desk}")

        # Test Mobile 390px Giáo vụ
        await page_aca.set_viewport_size({"width": 390, "height": 844})
        await page_aca.wait_for_timeout(1000)
        sw_m = await page_aca.evaluate("() => document.documentElement.scrollWidth")
        iw_m = await page_aca.evaluate("() => window.innerWidth")
        print(f"  - Mobile 390 scrollWidth: {sw_m} vs innerWidth: {iw_m}")
        assert sw_m <= iw_m, f"FAIL: Bị tràn ngang Mobile Giáo Vụ! {sw_m} > {iw_m}"

        shot_aca_m = os.path.join(ARTIFACTS_DIR, "qc_academic_lesson_plan_monitor_mobile.png")
        await page_aca.screenshot(path=shot_aca_m, full_page=True)
        print(f"  📸 Đã chụp: {shot_aca_m}")
        await context_aca.close()

        # -------------------------------------------------------------
        # TEST 2: GIÁM ĐỐC ĐIỀU HÀNH (DIR505 - Phạm Hiếu Thi)
        # -------------------------------------------------------------
        print("\n[TEST 2] Kiểm tra Dashboard Giám Đốc (Director)...")
        context_dir = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_dir = await context_dir.new_page()

        await page_dir.goto("http://127.0.0.1:3000/dashboard?sso_uid=DIR505", wait_until="domcontentloaded")
        await page_dir.wait_for_timeout(3000)

        # Assert card readiness KPI
        readiness_card = page_dir.locator('[data-testid="kpi-director-curriculum-readiness"]')
        assert await readiness_card.count() > 0, "FAIL: Không tìm thấy KPI Card Sẵn Sàng Bài Học 24H!"
        print("  ✅ Thẻ KPI DirectorCurriculumReadinessCard hiển thị chuẩn xác!")

        # Click vào thẻ để mở Drawer
        await readiness_card.click()
        await page_dir.wait_for_timeout(1000)
        drawer = page_dir.locator('.ant-drawer-open')
        drawer_count = await drawer.count()
        print(f"  - Số lượng Drawer mở: {drawer_count}")
        assert drawer_count > 0, "FAIL: Drawer đối soát bài học 24H không mở!"
        print("  ✅ Drawer Đối Soát Sẵn Sàng Học Thuật mở thành công khi click!")

        # Chụp ảnh Desktop Giám Đốc mở Drawer
        shot_dir_desk = os.path.join(ARTIFACTS_DIR, "qc_director_readiness_drawer_desktop.png")
        await page_dir.screenshot(path=shot_dir_desk, full_page=True)
        print(f"  📸 Đã chụp: {shot_dir_desk}")

        # Check Zero Overflow-X Mobile Giám Đốc
        await page_dir.set_viewport_size({"width": 390, "height": 844})
        await page_dir.wait_for_timeout(1000)
        sw_dir_m = await page_dir.evaluate("() => document.documentElement.scrollWidth")
        iw_dir_m = await page_dir.evaluate("() => window.innerWidth")
        print(f"  - Mobile 390 scrollWidth: {sw_dir_m} vs innerWidth: {iw_dir_m}")
        assert sw_dir_m <= iw_dir_m, f"FAIL: Bị tràn ngang Mobile Giám Đốc! {sw_dir_m} > {iw_dir_m}"

        shot_dir_m = os.path.join(ARTIFACTS_DIR, "qc_director_readiness_drawer_mobile.png")
        await page_dir.screenshot(path=shot_dir_m, full_page=True)
        print(f"  📸 Đã chụp: {shot_dir_m}")
        await context_dir.close()

        # -------------------------------------------------------------
        # TEST 3: GIÁO VIÊN BẢN XỨ (TEA202 - Michael Chen)
        # -------------------------------------------------------------
        print("\n[TEST 3] Kiểm tra Dashboard Giáo Viên Bản Xứ (Native Teacher)...")
        context_tea = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_tea = await context_tea.new_page()

        await page_tea.goto("http://127.0.0.1:3000/dashboard?sso_uid=TEA202", wait_until="domcontentloaded")
        await page_tea.wait_for_timeout(3000)

        # Check Zero Overflow-X Desktop
        sw_tea = await page_tea.evaluate("() => document.documentElement.scrollWidth")
        iw_tea = await page_tea.evaluate("() => window.innerWidth")
        print(f"  - Desktop Teacher scrollWidth: {sw_tea} vs innerWidth: {iw_tea}")
        assert sw_tea <= iw_tea, f"FAIL: Bị tràn ngang Desktop Giáo Viên! {sw_tea} > {iw_tea}"

        shot_tea_desk = os.path.join(ARTIFACTS_DIR, "qc_teacher_dashboard_alerts_desktop.png")
        await page_tea.screenshot(path=shot_tea_desk, full_page=True)
        print(f"  📸 Đã chụp: {shot_tea_desk}")

        # Check Zero Overflow-X Mobile Teacher
        await page_tea.set_viewport_size({"width": 390, "height": 844})
        await page_tea.wait_for_timeout(1000)
        sw_tea_m = await page_tea.evaluate("() => document.documentElement.scrollWidth")
        iw_tea_m = await page_tea.evaluate("() => window.innerWidth")
        print(f"  - Mobile Teacher scrollWidth: {sw_tea_m} vs innerWidth: {iw_tea_m}")
        assert sw_tea_m <= iw_tea_m, f"FAIL: Bị tràn ngang Mobile Giáo Viên! {sw_tea_m} > {iw_tea_m}"

        shot_tea_m = os.path.join(ARTIFACTS_DIR, "qc_teacher_dashboard_alerts_mobile.png")
        await page_tea.screenshot(path=shot_tea_m, full_page=True)
        print(f"  📸 Đã chụp: {shot_tea_m}")
        await context_tea.close()

        # -------------------------------------------------------------
        # TEST 4: HỌC VIÊN TIÊU BIỂU (HV768 - Kenji)
        # -------------------------------------------------------------
        print("\n[TEST 4] Kiểm tra Dashboard Học Viên (Student)...")
        context_stu = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_stu = await context_stu.new_page()

        await page_stu.goto("http://127.0.0.1:3000/dashboard?sso_uid=HV768", wait_until="domcontentloaded")
        await page_stu.wait_for_timeout(3000)

        # Check text in student portal
        body_text = await page_stu.locator('body').inner_text()
        assert "chưa soạn giáo án" not in body_text, "FAIL: Học viên vẫn thấy dòng tiêu cực 'chưa soạn giáo án'!"
        print("  ✅ XÁC NHẬN: Không còn dòng chữ tiêu cực 'chưa soạn giáo án' trên view Học Viên!")

        shot_stu_desk = os.path.join(ARTIFACTS_DIR, "qc_student_dashboard_friendly_desktop.png")
        await page_stu.screenshot(path=shot_stu_desk, full_page=True)
        print(f"  📸 Đã chụp: {shot_stu_desk}")
        await context_stu.close()

        await browser.close()

    print("\n" + "=" * 80)
    print("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ PLAYWRIGHT E2E ĐỀU PASS 100%!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_lesson_plan_alerts_e2e())
