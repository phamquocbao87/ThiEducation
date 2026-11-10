import asyncio
import os
from playwright.async_api import async_playwright

PROOF_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1366, "height": 850})
        page = await context.new_page()

        print("=== BẮT ĐẦU KIỂM TOÁN TỰ ĐỘNG 5 NHÓM DỮ LIỆU ĐA NGÔN NGỮ EN/VI ===")

        # 1. Khởi tạo phiên và chuyển sang chế độ Tiếng Anh
        await page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'en')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        # -------------------------------------------------------------
        # TEST 1: Khóa học & Lớp học (/courses-classes)
        # -------------------------------------------------------------
        print("\n[TEST 1] Kiểm tra /courses-classes...")
        await page.goto("http://localhost:3000/courses-classes", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        content_courses = await page.content()

        # Kiểm tra tag tuổi
        has_ages = "Ages " in content_courses or "Grade " in content_courses
        has_raw_tuoi_in_tags = "tuổi (Lớp" in content_courses
        print(f"  -> Có chứa 'Ages / Grade': {has_ages}")
        print(f"  -> Không còn sót 'tuổi (Lớp': {not has_raw_tuoi_in_tags}")
        assert has_ages, "LỖI: Chưa hiển thị độ tuổi chuẩn tiếng Anh (Ages / Grade)!"
        assert not has_raw_tuoi_in_tags, "LỖI: Vẫn còn sót 'tuổi (Lớp' trong thẻ khóa học!"

        shot_courses = os.path.join(PROOF_DIR, "proof_i18n_courses_classes.png")
        await page.screenshot(path=shot_courses)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_courses}")

        # -------------------------------------------------------------
        # TEST 2: Cấp độ giáo trình (/curriculum-levels)
        # -------------------------------------------------------------
        print("\n[TEST 2] Kiểm tra /curriculum-levels...")
        await page.goto("http://localhost:3000/curriculum-levels", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        content_curr = await page.content()

        has_months = "months (" in content_curr or "sessions)" in content_curr
        has_raw_thang = "tháng (48 - 72 buổi)" in content_curr or "tháng (72 buổi)" in content_curr
        print(f"  -> Có chứa 'months / sessions': {has_months}")
        print(f"  -> Không còn sót 'tháng (... buổi)': {not has_raw_thang}")
        assert has_months, "LỖI: Chưa hiển thị thời lượng chuẩn tiếng Anh (months / sessions)!"
        assert not has_raw_thang, "LỖI: Vẫn còn sót 'tháng (... buổi)' trong cấp độ giáo trình!"

        shot_curr = os.path.join(PROOF_DIR, "proof_i18n_curriculum_levels.png")
        await page.screenshot(path=shot_curr)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_curr}")

        # -------------------------------------------------------------
        # TEST 3: Điểm danh & Đánh giá (/class-attendance-evaluation)
        # -------------------------------------------------------------
        print("\n[TEST 3] Kiểm tra /class-attendance-evaluation...")
        await page.goto("http://localhost:3000/class-attendance-evaluation", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        content_att = await page.content()

        has_present = "Present:" in content_att
        has_raw_comat = "Có mặt:" in content_att
        print(f"  -> Có chứa tag 'Present:': {has_present}")
        print(f"  -> Không còn sót 'Có mặt:': {not has_raw_comat}")
        assert has_present, "LỖI: Chưa hiển thị tag 'Present:' trong bảng điểm danh!"
        assert not has_raw_comat, "LỖI: Vẫn còn sót 'Có mặt:' trong bảng điểm danh!"

        shot_att = os.path.join(PROOF_DIR, "proof_i18n_attendance.png")
        await page.screenshot(path=shot_att)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_att}")

        # -------------------------------------------------------------
        # TEST 4: Quản lý học phí (/tuition-fees)
        # -------------------------------------------------------------
        print("\n[TEST 4] Kiểm tra /tuition-fees...")
        await page.goto("http://localhost:3000/tuition-fees", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        content_tuition = await page.content()

        has_status_paid = "PAID" in content_tuition or "UNPAID" in content_tuition
        has_raw_danop = "ĐÃ NỘP" in content_tuition
        print(f"  -> Có chứa tag 'PAID / UNPAID': {has_status_paid}")
        print(f"  -> Không còn sót 'ĐÃ NỘP': {not has_raw_danop}")
        assert has_status_paid, "LỖI: Chưa hiển thị tag trạng thái học phí tiếng Anh (PAID / UNPAID)!"
        assert not has_raw_danop, "LỖI: Vẫn còn sót 'ĐÃ NỘP' trong bảng học phí!"

        shot_tuition = os.path.join(PROOF_DIR, "proof_i18n_tuition.png")
        await page.screenshot(path=shot_tuition)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_tuition}")

        # -------------------------------------------------------------
        # TEST 5: Hồ sơ cá nhân (/my-profile)
        # -------------------------------------------------------------
        print("\n[TEST 5] Kiểm tra /my-profile...")
        await page.goto("http://localhost:3000/my-profile", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        # Chuyển tab 2 Professional Details nếu có
        try:
            tab2 = page.locator("div[role='tab']:has-text('Professional Details')")
            if await tab2.count() > 0:
                await tab2.first.click()
                await page.wait_for_timeout(1000)
        except Exception as e:
            print("  (Tab click note):", e)

        content_profile = await page.content()
        has_coordinator_or_it = "Academic Coordinator" in content_profile or "Head of IT" in content_profile or "Academic Operations Department" in content_profile or "IT & Systems" in content_profile
        has_raw_position = "Điều phối viên giáo vụ" in content_profile or "Phòng Đào Tạo" in content_profile
        print(f"  -> Có chứa chức danh/phòng ban tiếng Anh: {has_coordinator_or_it}")
        print(f"  -> Không còn sót tiếng Việt cứng: {not has_raw_position}")
        assert has_coordinator_or_it, "LỖI: Chưa hiển thị chức danh/phòng ban tiếng Anh!"
        assert not has_raw_position, "LỖI: Vẫn còn sót 'Điều phối viên giáo vụ' hoặc 'Phòng Đào Tạo'!"

        shot_profile = os.path.join(PROOF_DIR, "proof_i18n_my_profile.png")
        await page.screenshot(path=shot_profile)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_profile}")

        # -------------------------------------------------------------
        # TEST 6: Chuyển lại sang Tiếng Việt (VI Mode) kiểm tra phục hồi
        # -------------------------------------------------------------
        print("\n[TEST 6] Chuyển về Tiếng Việt (VI Mode) kiểm tra bảo toàn...")
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'vi')")
        await page.goto("http://localhost:3000/class-attendance-evaluation", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        content_vi = await page.content()
        has_vi_comat = "Có mặt:" in content_vi
        print(f"  -> Phục hồi tiếng Việt 'Có mặt:': {has_vi_comat}")
        assert has_vi_comat, "LỖI: Không phục hồi tiếng Việt khi đổi sang VI!"

        shot_vi = os.path.join(PROOF_DIR, "proof_i18n_vi_mode.png")
        await page.screenshot(path=shot_vi)
        print(f"  -> Đã chụp ảnh minh chứng: {shot_vi}")

        # Khôi phục mặc định Tiếng Anh
        await page.evaluate("() => localStorage.setItem('lak_app_language', 'en')")

        await browser.close()
        print("\n=== TẤT CẢ 5 BÀI TEST ĐÃ PASS 100% HOÀN HẢO! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())

