import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        # -------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        print("\n--- 1. TESTING DESKTOP VIEWPORT (1366x800) ---")
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Navigate to /courses-classes
        page.goto('http://127.0.0.1:3000/courses-classes', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        # Find class card LH004
        card = page.locator('[data-testid="class-card-LH004"]')
        assert card.is_visible(), "Class card LH004 must be visible on /courses-classes!"
        print("ASSERT PASS: Found class card LH004 on /courses-classes")

        # Check button Chi Tiết Lớp (btn-classroom-LH004)
        classroom_btn = page.locator('[data-testid="btn-classroom-LH004"]')
        assert classroom_btn.is_visible(), "Classroom details button must be visible!"
        print(f"Classroom button text: '{classroom_btn.inner_text()}'")

        # Capture desktop screenshot before clicking
        screenshot_courses = ARTIFACT_DIR / 'e2e_courses_classes_card_buttons_desktop.png'
        page.screenshot(path=str(screenshot_courses), full_page=True)
        print(f"Captured screenshot: {screenshot_courses}")

        # Action 1: Click button "Chi Tiết Lớp"
        classroom_btn.click()
        page.wait_for_timeout(1500)
        print("Current URL after clicking button:", page.url)
        assert '/classroom/LH004' in page.url, f"Expected URL to contain /classroom/LH004, got {page.url}"
        print("ASSERT PASS: Button 'Chi Tiết Lớp' successfully navigated to /classroom/LH004")

        # Action 2: Go back to /courses-classes and test clicking anywhere on Card body
        page.goto('http://127.0.0.1:3000/courses-classes', wait_until='domcontentloaded')
        page.wait_for_timeout(2000)

        card = page.locator('[data-testid="class-card-LH004"]')
        # Click on card title or header
        card_title = card.locator('h5').first
        assert card_title.is_visible(), "Card title must be visible"
        card_title.click()
        page.wait_for_timeout(1500)
        print("Current URL after clicking Card Title:", page.url)
        assert '/classroom/LH004' in page.url, f"Expected URL to contain /classroom/LH004, got {page.url}"
        print("ASSERT PASS: Clicking Card body successfully navigated to /classroom/LH004")

        # Check Zero Overflow-X on Desktop
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = page.evaluate("() => window.innerWidth")
        assert scroll_width <= inner_width, f"Desktop overflow-x detected! scrollWidth ({scroll_width}) > innerWidth ({inner_width})"
        print(f"ASSERT PASS Desktop: Zero Overflow-X (scrollWidth: {scroll_width} <= innerWidth: {inner_width})")

        page.close()

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING MOBILE VIEWPORT (390x844) ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1500)

        mobile_page.goto('http://127.0.0.1:3000/courses-classes', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(2000)

        # Check Zero Overflow-X on Mobile
        m_scroll_width = mobile_page.evaluate("() => document.documentElement.scrollWidth")
        m_inner_width = mobile_page.evaluate("() => window.innerWidth")
        assert m_scroll_width <= m_inner_width, f"Mobile overflow-x detected! scrollWidth ({m_scroll_width}) > innerWidth ({m_inner_width})"
        print(f"ASSERT PASS Mobile: Zero Overflow-X (scrollWidth: {m_scroll_width} <= innerWidth: {m_inner_width})")

        # Capture mobile screenshot
        mobile_screenshot = ARTIFACT_DIR / 'e2e_courses_classes_mobile.png'
        mobile_page.screenshot(path=str(mobile_screenshot), full_page=True)
        print(f"Captured mobile screenshot: {mobile_screenshot}")

        # Click Classroom button on Mobile
        m_btn = mobile_page.locator('[data-testid="btn-classroom-LH004"]')
        assert m_btn.is_visible(), "Classroom button must be visible on Mobile"
        m_btn.click()
        mobile_page.wait_for_timeout(1500)
        print("Mobile URL after clicking:", mobile_page.url)
        assert '/classroom/LH004' in mobile_page.url, "Must navigate to /classroom/LH004 on Mobile"
        print("ASSERT PASS Mobile: Clicked into classroom on mobile successfully")

        mobile_page.close()
        browser.close()

        print("\n=======================================================")
        print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFICATION PASSED")
        print("=======================================================")

if __name__ == '__main__':
    main()

