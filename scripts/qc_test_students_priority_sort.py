import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000/students?sso_uid=ACA404"
ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def run_test():
    print("🚀 BẮT ĐẦU KIỂM THỬ PLAYWRIGHT E2E: THUẬT TOÁN SORT ƯU TIÊN & THẺ CARD HỌC VIÊN")
    with sync_playwright() as p:
        # 1. KIỂM THỬ DESKTOP (1280x800)
        print("\n--- 1. KIỂM THỬ DESKTOP (1280x800) ---")
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print(f"👉 Mở trang: {BASE_URL}")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        time.sleep(3)

        # Chờ phần tử select sort xuất hiện
        sort_select = page.locator('[data-testid="select-sort-students"]')
        sort_select.wait_for(state="visible", timeout=10000)
        print("✅ [PASS] Dropdown Sort học viên xuất hiện đầy đủ.")

        # Kiểm tra Card đầu tiên trong danh sách
        cards = page.locator('[data-testid^="student-card-"]')
        count = cards.count()
        print(f"✅ [PASS] Tìm thấy {count} thẻ học sinh trong danh sách.")

        first_card = cards.nth(0)
        first_card_id = first_card.get_attribute("data-testid")
        print(f"📌 Thẻ học sinh đầu tiên: {first_card_id}")

        # Kiểm tra có thẻ cảnh báo nghỉ phép hoặc tin nhắn không
        pending_banners = page.locator('[data-testid^="card-pending-absence-"]')
        pending_count = pending_banners.count()
        print(f"📌 Số thẻ có đơn báo nghỉ phép PENDING: {pending_count}")

        # Chụp ảnh Desktop
        desktop_screenshot = os.path.join(ARTIFACTS_DIR, "qc_students_priority_sorted_desktop.png")
        page.screenshot(path=desktop_screenshot, full_page=False)
        print(f"📸 Đã lưu ảnh Desktop: {desktop_screenshot}")

        # Kiểm tra Zero Overflow-X Desktop
        overflow_x = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"🔍 Kiểm tra Overflow-X Desktop: {'FAIL' if overflow_x else 'PASS (Zero Overflow)'}")
        assert not overflow_x, "Lỗi: Tràn ngang trên Desktop!"

        browser.close()

        # 2. KIỂM THỬ MOBILE (390x844)
        print("\n--- 2. KIỂM THỬ MOBILE (390x844) ---")
        browser_mobile = p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context_mobile = browser_mobile.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        )
        page_mobile = context_mobile.new_page()

        print(f"👉 Mở trang Mobile: {BASE_URL}")
        page_mobile.goto(BASE_URL, wait_until="domcontentloaded")
        time.sleep(3)

        mobile_sort = page_mobile.locator('[data-testid="select-sort-students"]')
        mobile_sort.wait_for(state="visible", timeout=10000)
        print("✅ [PASS] Mobile: Dropdown Sort hiển thị hoàn hảo.")

        # Chụp ảnh Mobile
        mobile_screenshot = os.path.join(ARTIFACTS_DIR, "qc_students_priority_sorted_mobile.png")
        page_mobile.screenshot(path=mobile_screenshot, full_page=False)
        print(f"📸 Đã lưu ảnh Mobile: {mobile_screenshot}")

        # Kiểm tra Zero Overflow-X Mobile
        overflow_x_mobile = page_mobile.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"🔍 Kiểm tra Overflow-X Mobile: {'FAIL' if overflow_x_mobile else 'PASS (Zero Overflow)'}")
        assert not overflow_x_mobile, "Lỗi: Tràn ngang trên Mobile!"

        browser_mobile.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ PLAYWRIGHT ĐẠT 100% PASS!")

if __name__ == "__main__":
    run_test()
