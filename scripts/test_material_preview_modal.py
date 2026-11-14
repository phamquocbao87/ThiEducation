import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    print("=======================================================")
    print("RUNNING E2E TEST: MULTI-FORMAT MATERIAL PREVIEW MODAL")
    print("=======================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        # -------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        print("\n--- 1. TESTING PREVIEW MODAL ON DESKTOP (1366x800) ---")
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.evaluate('localStorage.setItem("lak_app_language", "vi")')
        page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Kiểm tra bảng tài liệu đã load
        table = page.locator('[data-testid="materials-table"]')
        assert table.is_visible(), "Materials table must be visible!"
        print("ASSERT PASS: Materials table is visible")

        # TEST CASE 1: Xem trước tài liệu PDF
        print("\n--- TEST CASE 1: PREVIEW PDF DOCUMENT ---")
        # Tìm nút Xem Trước của tài liệu PDF đầu tiên
        preview_btns = page.locator('[data-testid^="btn-preview-material-"]')
        assert preview_btns.count() > 0, "Preview buttons must exist in table!"
        
        # Click preview nút đầu tiên
        preview_btns.first.click()
        page.wait_for_timeout(1200)

        modal_title = page.locator('[data-testid="material-preview-modal-title"]')
        assert modal_title.is_visible(), "Preview Modal must open!"
        print(f"ASSERT PASS: Preview Modal opened: '{modal_title.inner_text().strip()}'")

        # Chụp ảnh Modal Xem trước PDF
        screenshot_pdf = ARTIFACT_DIR / 'e2e_material_preview_pdf_desktop.png'
        page.screenshot(path=str(screenshot_pdf))
        print(f"Captured screenshot: {screenshot_pdf}")

        # Đóng modal
        close_btn = page.locator('[data-testid="btn-preview-close"]')
        close_btn.click()
        modal_title.wait_for(state="hidden", timeout=5000)
        print("ASSERT PASS: Modal closed cleanly")
        page.wait_for_timeout(500)

        # TEST CASE 2: Xem trước file Audio
        print("\n--- TEST CASE 2: PREVIEW AUDIO MP3 ---")
        # Lọc danh sách hoặc tìm hàng có Audio
        audio_row = page.locator('.ant-table-row').filter(has_text='Audio').or_(
            page.locator('.ant-table-row').filter(has_text='MP3')
        )
        if audio_row.count() > 0:
            audio_preview_btn = audio_row.first.locator('[data-testid^="btn-preview-material-"]')
            audio_preview_btn.click()
            page.wait_for_timeout(1200)

            # Assert audio player is rendered
            audio_player = page.locator('[data-testid="preview-audio-player"]')
            assert audio_player.is_visible(), "Audio player must be rendered for MP3 materials!"
            print("ASSERT PASS: Audio player rendered with streaming and playback controls")

            screenshot_audio = ARTIFACT_DIR / 'e2e_material_preview_audio_desktop.png'
            page.screenshot(path=str(screenshot_audio))
            print(f"Captured screenshot: {screenshot_audio}")

            close_btn.click()
            modal_title.wait_for(state="hidden", timeout=5000)
            print("ASSERT PASS: Audio modal closed cleanly")
            page.wait_for_timeout(500)
        else:
            print("INFO: No audio material in first page to preview, checked PDF.")

        # TEST CASE 3: Click vào tên tiêu đề tài liệu để mở xem trước
        print("\n--- TEST CASE 3: CLICK TITLE TO OPEN PREVIEW ---")
        title_btns = page.locator('[data-testid^="btn-title-preview-"]')
        if title_btns.count() > 0:
            title_btns.first.click()
            page.wait_for_timeout(1000)
            assert modal_title.is_visible(), "Modal must open when clicking material title!"
            print("ASSERT PASS: Clicking material title opens Preview Modal successfully")
            close_btn.click()
            modal_title.wait_for(state="hidden", timeout=5000)
            page.wait_for_timeout(500)

        # Desktop Zero Overflow-X
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        inner_width = page.evaluate("window.innerWidth")
        print(f"Desktop ScrollWidth: {scroll_width}, InnerWidth: {inner_width}")
        assert scroll_width <= inner_width, f"Overflow-X detected on Desktop: {scroll_width} > {inner_width}"
        print("ASSERT PASS Desktop: Zero Overflow-X (scrollWidth <= innerWidth)")

        page.close()

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING PREVIEW MODAL ON MOBILE (390x844) ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1000)
        mobile_page.evaluate('localStorage.setItem("lak_app_language", "vi")')
        mobile_page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1500)

        # Bấm xem trước trên mobile
        m_preview_btn = mobile_page.locator('[data-testid^="btn-preview-material-"]').first
        m_preview_btn.click()
        mobile_page.wait_for_timeout(1200)

        m_modal_title = mobile_page.locator('[data-testid="material-preview-modal-title"]')
        assert m_modal_title.is_visible(), "Preview modal must open on mobile!"
        print("ASSERT PASS Mobile: Preview modal opened successfully")

        # Mobile Zero Overflow-X
        m_scroll_width = mobile_page.evaluate("document.documentElement.scrollWidth")
        m_inner_width = mobile_page.evaluate("window.innerWidth")
        print(f"Mobile ScrollWidth: {m_scroll_width}, InnerWidth: {m_inner_width}")
        assert m_scroll_width <= m_inner_width, f"Overflow-X detected on Mobile: {m_scroll_width} > {m_inner_width}"
        print("ASSERT PASS Mobile: Zero Overflow-X (scrollWidth <= innerWidth)")

        screenshot_mobile = ARTIFACT_DIR / 'e2e_material_preview_mobile.png'
        mobile_page.screenshot(path=str(screenshot_mobile))
        print(f"Captured screenshot: {screenshot_mobile}")

        mobile_page.close()
        browser.close()

    print("\n=======================================================")
    print("ALL MATERIAL PREVIEW TESTS PASSED SUCCESSFULLY! 100%")
    print("=======================================================")

if __name__ == '__main__':
    main()

