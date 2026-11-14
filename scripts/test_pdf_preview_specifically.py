import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    print("=======================================================")
    print("RUNNING SPECIFIC TEST: VERIFY REAL PDF PREVIEW IN MODAL")
    print("=======================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        page = browser.new_page(viewport={'width': 1366, 'height': 850})
        page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.evaluate('localStorage.setItem("lak_app_language", "vi")')
        page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Tìm các hàng PDF trong bảng
        pdf_rows = page.locator('.ant-table-row').filter(has_text='PDF')
        count = pdf_rows.count()
        print(f"Found {count} PDF rows in the table.")
        assert count > 0, "There must be at least one PDF row!"

        # Lấy hàng PDF đầu tiên và click nút Xem Trước
        first_pdf_row = pdf_rows.first
        preview_btn = first_pdf_row.locator('[data-testid^="btn-preview-material-"]')
        print("Clicking Preview button on first PDF row...")
        preview_btn.click()
        page.wait_for_timeout(2000)

        # Assert Modal is open
        modal_title = page.locator('[data-testid="material-preview-modal-title"]')
        assert modal_title.is_visible(), "Preview modal must be visible!"
        print(f"Preview modal visible: '{modal_title.inner_text().strip()}'")

        # Assert iframe is rendered
        iframe = page.locator('[data-testid="preview-pdf-iframe"]')
        assert iframe.is_visible(), "PDF iframe must be rendered!"
        iframe_src = iframe.get_attribute('src')
        print(f"PDF iframe src: {iframe_src}")
        assert 'drive.google.com' in iframe_src and 'preview' in iframe_src, f"Expected Google Drive preview URL, got {iframe_src}"

        # Đợi iframe tải
        page.wait_for_timeout(3500)

        # Chụp ảnh chứng minh
        screenshot_path = ARTIFACT_DIR / 'e2e_real_pdf_preview_verified.png'
        page.screenshot(path=str(screenshot_path))
        print(f"Captured screenshot to: {screenshot_path}")

        # Kiểm tra nút mở tab
        open_tab_btn = page.locator('[data-testid="btn-preview-open-tab"]')
        assert open_tab_btn.is_visible(), "Open tab button must be visible!"
        print(f"Open tab href: {open_tab_btn.get_attribute('href')}")

        # Đóng modal
        close_btn = page.locator('[data-testid="btn-preview-close"]')
        close_btn.click()
        modal_title.wait_for(state="hidden", timeout=5000)
        print("Modal closed cleanly.")

        browser.close()
    print("=======================================================")
    print("PDF PREVIEW VERIFICATION COMPLETED SUCCESSFULLY! 100%")
    print("=======================================================")

if __name__ == '__main__':
    main()
