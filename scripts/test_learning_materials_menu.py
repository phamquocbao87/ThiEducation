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
        page.goto('http://127.0.0.1:3000/dashboard', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # 1.1 Kiểm tra Menu Sidebar có mục "Tài Liệu Học Tập" / "Learning Materials"
        materials_menu = page.locator('.ant-menu-item').filter(has_text='Tài Liệu Học Tập').or_(
            page.locator('.ant-menu-item').filter(has_text='Learning Materials')
        )
        assert materials_menu.count() > 0, "Menu item 'Tài Liệu Học Tập' must exist on sidebar!"
        print(f"ASSERT PASS: Found materials menu on sidebar: '{materials_menu.first.inner_text().strip()}'")

        # 1.2 Click Menu để chuyển sang /learning-materials
        materials_menu.first.click()
        page.wait_for_timeout(2000)
        print("Current URL after clicking menu:", page.url)
        assert '/learning-materials' in page.url, f"Expected /learning-materials, got {page.url}"
        print("ASSERT PASS: Successfully navigated to /learning-materials")

        # 1.3 Kiểm tra giao diện và thẻ thống kê
        page_title = page.locator('[data-testid="materials-page-title"]')
        assert page_title.is_visible(), "Page title must be visible!"
        print(f"Page title text: '{page_title.inner_text().strip()}'")

        # 1.4 Kiểm tra nút Upload và Modal
        upload_btn = page.locator('[data-testid="btn-open-upload-modal"]')
        assert upload_btn.is_visible(), "Upload button must be visible for Admin!"
        upload_btn.click()
        page.wait_for_timeout(1000)

        modal_title = page.locator('[data-testid="upload-material-modal-title"]')
        assert modal_title.is_visible(), "Upload modal must be visible after click!"
        print("ASSERT PASS: Material upload modal opened successfully")

        # Nhập thông tin tài liệu kiểm thử
        test_title = "QC AutoTest Wonders G5 Companion Unit 1"
        page.fill('[data-testid="input-material-title"]', test_title)
        page.fill('[data-testid="input-material-url"]', "https://drive.google.com/file/d/test-qc-doc/view")
        page.fill('[data-testid="input-material-description"]', "Test description for unit 1 curriculum")

        # Submit form
        submit_btn = page.locator('[data-testid="btn-submit-upload-material"]')
        submit_btn.click()
        page.wait_for_timeout(2000)

        # 1.5 Kiểm tra dữ liệu vừa tạo hiển thị ngay trên bảng (0ms sync)
        new_row = page.locator('.ant-table-row').filter(has_text=test_title)
        assert new_row.count() > 0, f"Row with '{test_title}' must exist in materials table!"
        print(f"ASSERT PASS: New material '{test_title}' found in table!")

        # 1.6 Kiểm tra bộ lọc tìm kiếm
        page.fill('[data-testid="input-search-material"]', "QC AutoTest")
        page.wait_for_timeout(800)
        assert page.locator('.ant-table-row').filter(has_text=test_title).count() > 0, "Search filter must retain matching row!"
        page.fill('[data-testid="input-search-material"]', "")
        page.wait_for_timeout(800)

        # 1.7 Desktop Zero Overflow-X
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = page.evaluate("() => window.innerWidth")
        print(f"Desktop ScrollWidth: {scroll_width}, InnerWidth: {inner_width}")
        assert scroll_width <= inner_width, f"FAIL: Desktop overflow detected! scrollWidth ({scroll_width}) > innerWidth ({inner_width})"
        print("ASSERT PASS Desktop: Zero Overflow-X (scrollWidth <= innerWidth)")

        # Chụp ảnh Desktop
        screenshot_desktop = ARTIFACT_DIR / 'e2e_learning_materials_desktop.png'
        page.screenshot(path=str(screenshot_desktop), full_page=True)
        print(f"Captured desktop screenshot: {screenshot_desktop}")

        # 1.8 Xóa dữ liệu test (Zero Test-Data Residue)
        delete_btn = new_row.locator('[data-testid^="btn-delete-material-"]').first
        delete_btn.click()
        page.wait_for_timeout(500)
        confirm_popconfirm = page.locator('.ant-popconfirm-buttons .ant-btn-dangerous, .ant-popconfirm-buttons .ant-btn-primary').first
        confirm_popconfirm.click()
        page.wait_for_timeout(1500)
        assert page.locator('.ant-table-row').filter(has_text=test_title).count() == 0, "Test material must be cleaned up!"
        print("ASSERT PASS: Test material successfully cleaned up (Zero Test-Data Residue)")

        page.close()

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING MOBILE VIEWPORT (390x844) ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1000)

        mobile_page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(2000)

        # Mobile Zero Overflow-X
        m_scroll = mobile_page.evaluate("() => document.documentElement.scrollWidth")
        m_inner = mobile_page.evaluate("() => window.innerWidth")
        print(f"Mobile ScrollWidth: {m_scroll}, InnerWidth: {m_inner}")
        assert m_scroll <= m_inner, f"FAIL: Mobile overflow detected! scrollWidth ({m_scroll}) > innerWidth ({m_inner})"
        print("ASSERT PASS Mobile: Zero Overflow-X (scrollWidth <= innerWidth)")

        # Chụp ảnh Mobile
        screenshot_mobile = ARTIFACT_DIR / 'e2e_learning_materials_mobile.png'
        mobile_page.screenshot(path=str(screenshot_mobile), full_page=True)
        print(f"Captured mobile screenshot: {screenshot_mobile}")

        # Mở Mobile Drawer Sidebar kiểm tra menu
        menu_toggle = mobile_page.locator('.ant-btn').filter(has=mobile_page.locator('.anticon-menu')).first
        if menu_toggle.is_visible():
            menu_toggle.click()
            mobile_page.wait_for_timeout(800)
            drawer_menu_item = mobile_page.locator('.ant-drawer .ant-menu-item').filter(has_text='Tài Liệu Học Tập').or_(
                mobile_page.locator('.ant-drawer .ant-menu-item').filter(has_text='Learning Materials')
            )
            assert drawer_menu_item.count() > 0, "Menu item must be visible in mobile drawer!"
            print(f"ASSERT PASS Mobile: Found menu item in Drawer: '{drawer_menu_item.first.inner_text().strip()}'")

            screenshot_drawer = ARTIFACT_DIR / 'e2e_learning_materials_mobile_drawer.png'
            mobile_page.screenshot(path=str(screenshot_drawer))
            print(f"Captured mobile drawer screenshot: {screenshot_drawer}")

        mobile_page.close()
        browser.close()

        print("\n=======================================================")
        print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFICATION PASSED")
        print("=======================================================\n")

if __name__ == '__main__':
    main()
