import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def reproduce():
    print("🚀 Khởi chạy tái hiện lỗi tại /my-profile/edit...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )
        ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = ctx.new_page()

        # 1. Đăng nhập HV151
        page.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)

        # Chuyển ngôn ngữ sang English nếu đang là VI để kiểm tra màn hình tiếng Anh
        lang_btn = page.locator('button:has-text("EN"), button:has-text("VI")').first
        if lang_btn.is_visible():
            txt = lang_btn.inner_text().strip()
            print(f"Current language toggle button: {txt}")
            if 'EN' in txt:
                print("Switching to English...")
                lang_btn.click()
                page.wait_for_timeout(500)

        # 2. Điều hướng tới /my-profile/edit
        print("Navigating to /my-profile/edit...")
        page.goto(f"{BASE_URL}/my-profile/edit", wait_until='domcontentloaded')
        page.wait_for_selector('form', timeout=15000)
        page.wait_for_timeout(1500)

        # Chụp toàn trang tiếng Anh
        screenshot_en = f"{OUTPUT_DIR}/reproduce_student_my_profile_edit_en.png"
        page.screenshot(path=screenshot_en, full_page=True)
        print(f"📸 Đã chụp ảnh màn hình tiếng Anh: {screenshot_en}")

        # Kiểm tra trạng thái của ô Enrolled Classes Select
        select_disabled = page.evaluate('''() => {
            const selectEl = document.querySelector('.ant-select-multiple');
            if (!selectEl) return 'NOT_FOUND';
            return selectEl.classList.contains('ant-select-disabled');
        }''')
        print(f"Enrolled Classes Select disabled state: {select_disabled}")

        # Đổi lại tiếng Việt để kiểm tra giao diện tiếng Việt
        lang_btn2 = page.locator('button:has-text("VI")').first
        if lang_btn2.is_visible():
            print("Switching to Vietnamese...")
            lang_btn2.click()
            page.wait_for_timeout(500)
            screenshot_vi = f"{OUTPUT_DIR}/reproduce_student_my_profile_edit_vi.png"
            page.screenshot(path=screenshot_vi, full_page=True)
            print(f"📸 Đã chụp ảnh màn hình tiếng Việt: {screenshot_vi}")

        browser.close()
        print("✅ Hoàn thành script tái hiện!")

if __name__ == '__main__':
    reproduce()
