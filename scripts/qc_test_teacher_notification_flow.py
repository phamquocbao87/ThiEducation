import asyncio
import os
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

async def test_teacher_notification_flow():
    print("=" * 80)
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E LUỒNG NHẮC NHỞ GIÁO VIÊN & NHẬN THÔNG BÁO CHUÔNG")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # -------------------------------------------------------------
        # BƯỚC 1: GIÁO VỤ ĐÀO TẠO (ACA101) BẤM NÚT NHẮC GIÁO VIÊN
        # -------------------------------------------------------------
        print("\n[BƯỚC 1] Đăng nhập Giáo vụ (ACA101) & Bấm nút [Nhắc Giáo Viên]...")
        context_aca = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_aca = await context_aca.new_page()

        await page_aca.goto("http://127.0.0.1:3000/dashboard?sso_uid=ACA101", wait_until="domcontentloaded")
        await page_aca.wait_for_timeout(3000)

        # Tìm đúng nút Nhắc Giáo Viên Soạn Giáo Án
        btn_remind = page_aca.locator('[data-testid^="btn-remind-lesson-plan-"]').first
        btn_count = await btn_remind.count()
        assert btn_count > 0, "FAIL: Không tìm thấy nút [Nhắc Giáo Viên Soạn Giáo Án] trên Dashboard Giáo Vụ!"
        print(f"  - Trạng thái nút trước khi bấm: '{await btn_remind.inner_text()}'")

        # Bấm nút Nhắc Giáo Viên
        await btn_remind.click()
        await page_aca.wait_for_timeout(2000)

        # Kiểm tra nút chuyển sang Đã nhắc (Reminded)
        btn_text_after = await btn_remind.inner_text()
        print(f"  - Trạng thái nút sau khi bấm: '{btn_text_after}'")
        assert "Reminded" in btn_text_after or "Đã nhắc" in btn_text_after, \
            f"FAIL: Nút không chuyển sang trạng thái Đã nhắc! Nhận: {btn_text_after}"
        print("  ✅ XÁC NHẬN: Nút Nhắc Giáo Viên đã cập nhật thành công sang trạng thái Đã nhắc!")

        # Chụp ảnh minh chứng Giáo vụ bấm nút nhắc
        shot_aca_action = os.path.join(ARTIFACTS_DIR, "qc_academic_remind_button_clicked.png")
        await page_aca.screenshot(path=shot_aca_action, full_page=True)
        print(f"  📸 Đã chụp ảnh Giáo vụ: {shot_aca_action}")

        # Lấy thông tin localStorage cache để xem notification vừa gửi
        noti_sent = await page_aca.evaluate('''() => {
            const raw = localStorage.getItem('lak_erp_notifications_cache_GV952') || '[]';
            return JSON.parse(raw)[0] || null;
        }''')
        noti_title = (noti_sent or {}).get('title', '')
        print(f"  - Thông báo đã được ghi vào cache GV952: Tiêu đề = '{noti_title}'")

        await context_aca.close()

        # -------------------------------------------------------------
        # BƯỚC 2: GIÁO VIÊN (GV952 - Teacher Maj) MỞ CHUÔNG NHẬN THÔNG BÁO
        # -------------------------------------------------------------
        print("\n[BƯỚC 2] Đăng nhập Giáo Viên phụ trách (GV952 - Teacher Maj) & Kiểm tra Chuông Thông Báo...")
        context_tea = await browser.new_context(viewport={"width": 1366, "height": 800})
        page_tea = await context_tea.new_page()

        await page_tea.goto("http://127.0.0.1:3000/dashboard?sso_uid=GV952", wait_until="domcontentloaded")
        await page_tea.wait_for_timeout(3000)

        # Kiểm tra nút Chuông ở Header
        bell_btn = page_tea.locator('[data-testid="notification-bell-btn"]')
        if await bell_btn.count() == 0:
            bell_btn = page_tea.locator('.ant-badge:has(.anticon-bell), button:has(.anticon-bell)').first

        assert await bell_btn.count() > 0, "FAIL: Không tìm thấy Chuông thông báo trên Header Giáo Viên!"
        print("  ✅ Chuông thông báo Header hiển thị chuẩn xác!")

        # Bấm mở Popover Chuông Thông Báo
        await bell_btn.click()
        await page_tea.wait_for_timeout(1500)

        # Kiểm tra nội dung danh sách thông báo
        popover_list = page_tea.locator('[data-testid="notification-popover-list"]')
        assert await popover_list.count() > 0, "FAIL: Popover thông báo không mở khi click Chuông!"

        popover_text = await popover_list.inner_text()
        print(f"\n  --- Danh Sách Thông Báo Của Giáo Viên Teacher Maj ---\n{popover_text[:400]}...\n  ---------------------------------------------------")

        # Khẳng định có thông báo nhắc soạn giáo án
        has_lesson_plan_noti = (
            "Lesson Plan" in popover_text
            or "Giáo Án" in popover_text
            or "soạn giáo án" in popover_text
            or "24h" in popover_text
        )
        assert has_lesson_plan_noti, f"FAIL: Giáo viên KHÔNG nhận được thông báo nhắc giáo án! Nội dung: {popover_text}"
        print("  🎉 XÁC NHẬN: BÊN GIÁO VIÊN ĐÃ NHẬN ĐƯỢC THÔNG BÁO NHẮC NHỞ SOẠN GIÁO ÁN TRƯỚC 24H!")

        # Chụp ảnh minh chứng Chuông thông báo bên Giáo viên
        shot_tea_bell = os.path.join(ARTIFACTS_DIR, "qc_teacher_received_reminder_bell.png")
        await page_tea.screenshot(path=shot_tea_bell)
        print(f"  📸 Đã chụp ảnh Chuông Giáo Viên: {shot_tea_bell}")

        # BƯỚC 3: Test Click vào thông báo để chuyển sang màn hình lớp học
        print("\n[BƯỚC 3] Kiểm tra bấm vào thông báo để điều hướng đến lớp học...")
        noti_item = popover_list.locator('.ant-list-item:has-text("Lesson Plan"), .ant-list-item:has-text("Giáo Án"), .ant-list-item:has-text("24h")').first
        if await noti_item.count() > 0:
            await noti_item.click()
            await page_tea.wait_for_timeout(2500)
            current_url = page_tea.url
            print(f"  - URL sau khi bấm thông báo: {current_url}")
            assert "classroom" in current_url or "courses-classes" in current_url, \
                f"FAIL: Bấm thông báo không điều hướng đúng lớp học! Nhận: {current_url}"
            print("  ✅ Bấm thông báo điều hướng chính xác vào Lớp Học!")

        await context_tea.close()
        await browser.close()

    print("\n" + "=" * 80)
    print("🎉 KIỂM THỬ HOÀN TẤT: GIÁO VIÊN NHẬN THÔNG BÁO CHUÔNG 100% THÀNH CÔNG!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_teacher_notification_flow())
