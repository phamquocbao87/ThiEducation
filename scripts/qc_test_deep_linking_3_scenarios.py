import asyncio
import sys
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def run_qc_test():
    print("==================================================================")
    print("🧪 PHÒNG QC: KIỂM TOÁN DEEP LINKING & INTENDED REDIRECT (3 SCENARIOS)")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------------------
        # 1. KỊCH BẢN 1: ĐÚNG QUYỀN (VÀO THẲNG /zoom-schedules)
        # ----------------------------------------------------------------
        print("\n--- [1] KỊCH BẢN 1: ĐÚNG QUYỀN (Teacher Maj vào /zoom-schedules) ---")
        ctx1 = await browser.new_context(viewport={"width": 1366, "height": 850})
        page1 = await ctx1.new_page()

        print("  1.1 Truy cập URL trực tiếp chưa đăng nhập: http://localhost:3000/zoom-schedules")
        await page1.goto("http://localhost:3000/zoom-schedules", wait_until="domcontentloaded")
        await page1.wait_for_timeout(2000)

        # Kiểm tra Form Đăng Nhập mở ra
        login_input = page1.locator("input#identifier")
        assert await login_input.is_visible(), "FAIL: Form đăng nhập không xuất hiện khi truy cập chưa có auth!"
        print("  ✅ Form đăng nhập xuất hiện tại chỗ trên URL /zoom-schedules")

        # Điền thông tin Giáo viên GV952
        print("  1.2 Đăng nhập tài khoản Giáo viên GV952 (Teacher Maj)...")
        await login_input.fill("GV952")
        await page1.locator("input#password").fill("@Bcd1234")
        await page1.locator("button[type='submit']").click()
        await page1.wait_for_timeout(3500)

        # Kiểm tra URL sau đăng nhập
        current_url_1 = page1.url
        print(f"  1.3 URL hiện tại sau đăng nhập: {current_url_1}")
        assert "/zoom-schedules" in current_url_1, f"FAIL: Không điều hướng vào /zoom-schedules! URL: {current_url_1}"
        print("  ✅ [PASS] Kịch bản 1: Đăng nhập thành công và vào đúng màn hình /zoom-schedules!")

        await page1.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_scenario_1_zoom_schedules_success.png")
        await ctx1.close()

        # ----------------------------------------------------------------
        # 2. KỊCH BẢN 2: ĐĂNG NHẬP THẤT BẠI (Ở LẠI FORM, BÁO LỖI ĐỎ)
        # ----------------------------------------------------------------
        print("\n--- [2] KỊCH BẢN 2: ĐĂNG NHẬP THẤT BẠI (Sai mật khẩu) ---")
        ctx2 = await browser.new_context(viewport={"width": 1366, "height": 850})
        page2 = await ctx2.new_page()

        print("  2.1 Truy cập: http://localhost:3000/zoom-schedules")
        await page2.goto("http://localhost:3000/zoom-schedules", wait_until="domcontentloaded")
        await page2.wait_for_timeout(2000)

        login_input_2 = page2.locator("input#identifier")
        await login_input_2.fill("GV952")
        await page2.locator("input#password").fill("SaiMatKhau999!")
        print("  2.2 Bấm submit với mật khẩu sai...")
        await page2.locator("button[type='submit']").click()
        await page2.wait_for_timeout(2500)

        # URL vẫn phải là /zoom-schedules (hoặc query redirect=%2Fzoom-schedules trên Localhost)
        current_url_2 = page2.url
        print(f"  2.3 URL hiện tại: {current_url_2}")
        assert ("/zoom-schedules" in current_url_2 or "redirect=%2Fzoom-schedules" in current_url_2), f"FAIL: Bị chuyển hướng sai URL khi login lỗi! URL: {current_url_2}"

        # Form đăng nhập vẫn hiển thị
        assert await login_input_2.is_visible(), "FAIL: Form đăng nhập bị đóng khi login thất bại!"
        print("  ✅ [PASS] Kịch bản 2: Vẫn ở lại Form đăng nhập trên đúng URL /zoom-schedules khi login thất bại!")

        await page2.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_scenario_2_login_failure.png")
        await ctx2.close()

        # ----------------------------------------------------------------
        # 3. KỊCH BẢN 3: THIẾU QUYỀN TRUY CẬP (HỌC VIÊN VÀO /contracts-payroll -> 403)
        # ----------------------------------------------------------------
        print("\n--- [3] KỊCH BẢN 3: THIẾU QUYỀN TRUY CẬP (Học viên vào /contracts-payroll -> 403) ---")
        ctx3 = await browser.new_context(viewport={"width": 1366, "height": 850})
        page3 = await ctx3.new_page()

        print("  3.1 Truy cập URL bảo mật: http://localhost:3000/contracts-payroll")
        await page3.goto("http://localhost:3000/contracts-payroll", wait_until="domcontentloaded")
        await page3.wait_for_timeout(2000)

        # Đăng nhập bằng tài khoản Học viên HV768 (Kenji)
        print("  3.2 Đăng nhập bằng tài khoản Học viên HV768 (không có quyền xem lương/hợp đồng)...")
        await page3.locator("input#identifier").fill("HV768")
        await page3.locator("input#password").fill("@Bcd1234")
        await page3.locator("button[type='submit']").click()
        await page3.wait_for_timeout(3500)

        # Kiểm tra URL vẫn là /contracts-payroll
        current_url_3 = page3.url
        print(f"  3.3 URL hiện tại: {current_url_3}")
        assert "/contracts-payroll" in current_url_3, f"FAIL: Không giữ URL /contracts-payroll! URL: {current_url_3}"

        # Kiểm tra Màn hình 403 Forbidden
        title_403 = page3.locator("[data-testid='error-403-title']")
        assert await title_403.is_visible(), "FAIL: Không hiển thị màn hình 403 Forbidden!"
        title_text = await title_403.inner_text()
        print(f"  ✅ Tiêu đề màn hình lỗi: '{title_text}'")
        assert "403" in title_text, f"FAIL: Tiêu đề không chứa 403: {title_text}"

        btn_back = page3.locator("[data-testid='btn-back-dashboard']")
        assert await btn_back.is_visible(), "FAIL: Nút quay lại dashboard không hiển thị!"

        # Chụp ảnh minh chứng màn hình 403 Forbidden TRƯỚC KHI bấm nút quay lại
        await page3.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_scenario_3_403_forbidden.png")

        # Bấm nút quay lại Dashboard
        print("  3.4 Bấm nút Quay Lại Dashboard...")
        await btn_back.click()
        await page3.wait_for_timeout(2000)
        assert "/dashboard" in page3.url, f"FAIL: Không quay về dashboard! URL: {page3.url}"
        print(f"  ✅ [PASS] Kịch bản 3: Chặn 403 Forbidden thành công và quay về Dashboard an toàn!")

        await page3.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_scenario_3_back_to_dashboard.png")
        await ctx3.close()

        # ----------------------------------------------------------------
        # 4. MOBILE 390px AUDIT (ZERO OVERFLOW-X)
        # ----------------------------------------------------------------
        print("\n--- [4] KIỂM TOÁN MOBILE 390px (Zero Overflow-X) ---")
        ctx4 = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page4 = await ctx4.new_page()

        await page4.goto("http://localhost:3000/zoom-schedules", wait_until="domcontentloaded")
        await page4.wait_for_timeout(2000)

        overflow = await page4.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                hasOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        }""")
        print(f"  Mobile 390px Check: scrollWidth={overflow['scrollWidth']}, innerWidth={overflow['innerWidth']}")
        assert not overflow["hasOverflow"], f"FAIL: Mobile bị tràn ngang: {overflow}"
        print("  ✅ [PASS] Mobile 390px Zero Overflow-X hoàn hảo!")

        await page4.screenshot(path="/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_deep_linking_mobile_390.png")
        await ctx4.close()

        await browser.close()

    print("\n==================================================================")
    print("🎉 TẤT CẢ 4/4 KỊCH BẢN KIỂM THỬ PLAYWRIGHT ĐẠT 100% PERFECT PASS!")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_qc_test())
    sys.exit(0)
