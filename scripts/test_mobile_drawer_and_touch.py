import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/mobile_audit')
CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'

def test_mobile_interactions():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2,
        )

        page = context.new_page()

        # Login as Admin
        page.goto(f"{BASE_URL}/?sso_uid=ADM001", wait_until='domcontentloaded')
        page.wait_for_timeout(500)
        page.goto(f"{BASE_URL}/dashboard", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)

        # 1. Open Hamburger Menu
        menu_btn = page.locator("header button:has(.anticon-menu)").first
        print("Hamburger button visible:", menu_btn.is_visible())
        assert menu_btn.is_visible(), "Hamburger button must be visible on mobile"
        menu_btn.click()
        page.wait_for_timeout(500)

        # 2. Check Drawer visibility and touch items
        drawer = page.locator(".ant-drawer-content")
        print("Drawer opened:", drawer.is_visible())
        assert drawer.is_visible(), "Mobile Drawer must open"

        # Check menu items in drawer
        drawer_items = page.locator(".ant-drawer .ant-menu-item").all_text_contents()
        print(f"Drawer Menu Items ({len(drawer_items)}): {drawer_items[:5]}...")
        assert len(drawer_items) >= 8, f"Expected at least 8 menu items, got {len(drawer_items)}"

        # Check logout button
        logout_btn = page.locator(".lak-mobile-drawer-logout-btn")
        print("Logout button in drawer:", logout_btn.is_visible())
        assert logout_btn.is_visible(), "Logout button must be present in mobile drawer"
        rect = logout_btn.bounding_box()
        print(f"Logout button dimensions: {rect['width']}x{rect['height']}px (height >= 40px)")
        assert rect['height'] >= 40, f"Logout button height must be >= 40px, got {rect['height']}"

        # Take screenshot of Mobile Drawer
        drawer_snap = ARTIFACTS_DIR / "390px_mobile_drawer_navigation.png"
        page.screenshot(path=str(drawer_snap))
        print(f"Saved drawer screenshot: {drawer_snap}")

        # Close drawer
        close_btn = page.locator(".ant-drawer-close, .ant-drawer-mask").first
        close_btn.click()
        page.wait_for_timeout(400)

        # 3. Test Course & Classes Drawer Modal on mobile
        page.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page.wait_for_timeout(1000)

        # Click "Tạo Lớp Học Mới" / "New Class" button
        new_class_btn = page.locator("button:has-text('Tạo Lớp Học Mới'), button:has-text('New Class')").first
        if new_class_btn.is_visible():
            new_class_btn.click()
            page.wait_for_timeout(600)
            # Check Drawer is 100% width on mobile
            drawer_w = page.evaluate("""() => {
                const d = document.querySelector('.ant-drawer-content-wrapper');
                return d ? d.getBoundingClientRect().width : null;
            }""")
            print(f"Class Creation Drawer Width on Mobile: {drawer_w}px (should be 390px)")
            assert drawer_w == 390, f"Expected 390px drawer width on mobile, got {drawer_w}"
            page.screenshot(path=str(ARTIFACTS_DIR / "390px_class_creation_drawer.png"))

        browser.close()
        print("\n🎉 ALL MOBILE INTERACTION TESTS PASSED!")

if __name__ == '__main__':
    test_mobile_interactions()

