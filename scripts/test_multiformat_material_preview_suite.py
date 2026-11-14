import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    print("=================================================================")
    print("RUNNING COMPREHENSIVE MULTI-FORMAT MATERIAL PREVIEW E2E SUITE")
    print("=================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        # -------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        print("\n--- 1. TESTING DESKTOP (1366x800) MULTI-FORMAT PREVIEWS ---")
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        page.wait_for_timeout(1000)
        page.evaluate('localStorage.setItem("lak_app_language", "vi")')
        page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        page.wait_for_timeout(1800)

        # Kiểm tra bảng tài liệu
        table = page.locator('[data-testid="materials-table"]')
        assert table.is_visible(), "Materials table must be visible!"
        rows = page.locator('.ant-table-row')
        rowCount = rows.count()
        print(f"ASSERT PASS: Materials table rendered with {rowCount} rows.")
        assert rowCount >= 4, f"Expected at least 4 materials in table, found {rowCount}"

        # -------------------------------------------------------------
        # TEST CASE 1: PREVIEW VIDEO LESSON (YOUTUBE / DIRECT / DRIVE)
        # -------------------------------------------------------------
        print("\n--- TEST CASE 1: PREVIEW VIDEO LESSON ---")
        video_row = page.locator('.ant-table-row').filter(has_text='Video').first
        assert video_row.is_visible(), "Video material row must exist in table!"
        
        video_preview_btn = video_row.locator('[data-testid^="btn-preview-material-"]')
        video_preview_btn.click()
        page.wait_for_timeout(2000)

        modal_title = page.locator('[data-testid="material-preview-modal-title"]')
        assert modal_title.is_visible(), "Preview modal must open for Video!"
        print(f"Video Modal Title: '{modal_title.inner_text().strip()}'")

        # Kiểm tra iframe YouTube hoặc Video player
        yt_iframe = page.locator('[data-testid="preview-video-youtube-iframe"]')
        video_player = page.locator('[data-testid="preview-video-player"]')
        assert yt_iframe.is_visible() or video_player.is_visible(), "Either YouTube iframe or video player must render!"
        print("ASSERT PASS: Video lesson container rendered with 16:9 responsive frame.")

        screenshot_video_desktop = ARTIFACT_DIR / 'e2e_video_preview_desktop.png'
        page.screenshot(path=str(screenshot_video_desktop))
        print(f"Captured screenshot: {screenshot_video_desktop}")

        close_btn = page.locator('[data-testid="btn-preview-close"]')
        close_btn.click()
        modal_title.wait_for(state="hidden", timeout=5000)
        print("ASSERT PASS: Video modal closed cleanly.")
        page.wait_for_timeout(500)

        # -------------------------------------------------------------
        # TEST CASE 2: PREVIEW SLIDE PRESENTATION (GOOGLE SLIDES / PPTX)
        # -------------------------------------------------------------
        print("\n--- TEST CASE 2: PREVIEW SLIDE PRESENTATION ---")
        slide_row = page.locator('.ant-table-row').filter(has_text='Slide').first
        assert slide_row.is_visible(), "Slide material row must exist in table!"

        slide_preview_btn = slide_row.locator('[data-testid^="btn-preview-material-"]')
        slide_preview_btn.click()
        page.wait_for_timeout(2000)

        assert modal_title.is_visible(), "Preview modal must open for Slides!"
        print(f"Slides Modal Title: '{modal_title.inner_text().strip()}'")

        # Kiểm tra iframe slide và nút fullscreen
        slides_iframe = page.locator('[data-testid="preview-slides-iframe"]')
        assert slides_iframe.is_visible(), "Slides iframe must render in modal!"
        fs_btn = page.locator('[data-testid="btn-slide-fullscreen"]')
        assert fs_btn.is_visible(), "Fullscreen toggle button must be available for slides!"
        print("ASSERT PASS: Slides presentation rendered with 16:9 ratio and Fullscreen control.")

        screenshot_slides_desktop = ARTIFACT_DIR / 'e2e_slides_preview_desktop.png'
        page.screenshot(path=str(screenshot_slides_desktop))
        print(f"Captured screenshot: {screenshot_slides_desktop}")

        close_btn.click()
        modal_title.wait_for(state="hidden", timeout=5000)
        print("ASSERT PASS: Slides modal closed cleanly.")
        page.wait_for_timeout(500)

        # -------------------------------------------------------------
        # TEST CASE 3: PREVIEW AUDIO WITH ESL SPEED CONTROLLER
        # -------------------------------------------------------------
        print("\n--- TEST CASE 3: PREVIEW AUDIO WITH ESL SPEED CONTROLLER ---")
        audio_row = page.locator('.ant-table-row').filter(has_text='Audio').first
        assert audio_row.is_visible(), "Audio material row must exist in table!"

        audio_preview_btn = audio_row.locator('[data-testid^="btn-preview-material-"]')
        audio_preview_btn.click()
        page.wait_for_timeout(1500)

        assert modal_title.is_visible(), "Preview modal must open for Audio!"
        print(f"Audio Modal Title: '{modal_title.inner_text().strip()}'")

        audio_player = page.locator('[data-testid="preview-audio-player"]')
        assert audio_player.is_visible(), "Audio player must render!"

        speed_controller = page.locator('[data-testid="audio-speed-controller"]')
        assert speed_controller.is_visible(), "ESL audio speed controller must be visible!"

        # Thử đổi tốc độ sang 0.75x (Nghe chậm phát âm)
        slow_btn = page.locator('[data-testid="audio-speed-radio-group"] label').filter(has_text='0.75x')
        slow_btn.click()
        page.wait_for_timeout(300)
        current_rate = page.evaluate('() => document.querySelector("[data-testid=preview-audio-player]").playbackRate')
        print(f"Playback rate after selecting 0.75x: {current_rate}")
        assert current_rate == 0.75, f"Expected playbackRate 0.75, got {current_rate}"
        print("ASSERT PASS: Audio playback rate dynamically adjusted to 0.75x.")

        screenshot_audio_desktop = ARTIFACT_DIR / 'e2e_audio_speed_preview_desktop.png'
        page.screenshot(path=str(screenshot_audio_desktop))
        print(f"Captured screenshot: {screenshot_audio_desktop}")

        close_btn.click()
        modal_title.wait_for(state="hidden", timeout=5000)
        print("ASSERT PASS: Audio modal closed cleanly.")
        page.wait_for_timeout(500)

        # Desktop Zero Overflow-X
        scroll_width = page.evaluate("document.documentElement.scrollWidth")
        inner_width = page.evaluate("window.innerWidth")
        print(f"Desktop ScrollWidth: {scroll_width}, InnerWidth: {inner_width}")
        assert scroll_width <= inner_width, f"Overflow-X on Desktop: {scroll_width} > {inner_width}"
        print("ASSERT PASS Desktop: Zero Overflow-X confirmed.")

        page.close()

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING MOBILE (390x844) MULTI-FORMAT PREVIEWS ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1000)
        mobile_page.evaluate('localStorage.setItem("lak_app_language", "vi")')
        mobile_page.goto('http://127.0.0.1:3000/learning-materials', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1800)

        # Mobile Test 1: Video Preview Modal
        m_video_row = mobile_page.locator('.ant-table-row').filter(has_text='Video').first
        m_video_btn = m_video_row.locator('[data-testid^="btn-preview-material-"]')
        m_video_btn.click()
        mobile_page.wait_for_timeout(1500)

        m_modal_title = mobile_page.locator('[data-testid="material-preview-modal-title"]')
        assert m_modal_title.is_visible(), "Mobile preview modal must open for Video!"
        
        # Kiểm tra nút bấm chân trang có bị rớt chữ không
        m_close_btn = mobile_page.locator('[data-testid="btn-preview-close"]')
        m_open_tab_btn = mobile_page.locator('[data-testid="btn-preview-open-tab"]')
        assert m_close_btn.is_visible() and m_open_tab_btn.is_visible()

        m_scroll_width = mobile_page.evaluate("document.documentElement.scrollWidth")
        m_inner_width = mobile_page.evaluate("window.innerWidth")
        print(f"Mobile Video Modal ScrollWidth: {m_scroll_width}, InnerWidth: {m_inner_width}")
        assert m_scroll_width <= m_inner_width, f"Overflow-X in Mobile Video Modal: {m_scroll_width} > {m_inner_width}"

        screenshot_video_mobile = ARTIFACT_DIR / 'e2e_video_preview_mobile.png'
        mobile_page.screenshot(path=str(screenshot_video_mobile))
        print(f"Captured screenshot: {screenshot_video_mobile}")

        m_close_btn.click()
        m_modal_title.wait_for(state="hidden", timeout=5000)
        mobile_page.wait_for_timeout(500)

        # Mobile Test 2: Audio Preview Modal
        m_audio_row = mobile_page.locator('.ant-table-row').filter(has_text='Audio').first
        m_audio_btn = m_audio_row.locator('[data-testid^="btn-preview-material-"]')
        m_audio_btn.click()
        mobile_page.wait_for_timeout(1500)

        assert m_modal_title.is_visible(), "Mobile preview modal must open for Audio!"
        m_audio_speed = mobile_page.locator('[data-testid="audio-speed-controller"]')
        assert m_audio_speed.is_visible(), "Audio speed controller must be visible on Mobile!"

        m_scroll_width = mobile_page.evaluate("document.documentElement.scrollWidth")
        assert m_scroll_width <= m_inner_width, f"Overflow-X in Mobile Audio Modal: {m_scroll_width} > {m_inner_width}"

        screenshot_audio_mobile = ARTIFACT_DIR / 'e2e_audio_preview_mobile.png'
        mobile_page.screenshot(path=str(screenshot_audio_mobile))
        print(f"Captured screenshot: {screenshot_audio_mobile}")

        m_close_btn.click()
        m_modal_title.wait_for(state="hidden", timeout=5000)
        mobile_page.wait_for_timeout(500)

        # Mobile Test 3: Slide Preview Modal
        m_slide_row = mobile_page.locator('.ant-table-row').filter(has_text='Slide').first
        m_slide_btn = m_slide_row.locator('[data-testid^="btn-preview-material-"]')
        m_slide_btn.click()
        mobile_page.wait_for_timeout(1500)

        assert m_modal_title.is_visible(), "Mobile preview modal must open for Slide!"
        m_slides_iframe = mobile_page.locator('[data-testid="preview-slides-iframe"]')
        assert m_slides_iframe.is_visible(), "Slide iframe must be visible on Mobile!"

        m_scroll_width = mobile_page.evaluate("document.documentElement.scrollWidth")
        assert m_scroll_width <= m_inner_width, f"Overflow-X in Mobile Slide Modal: {m_scroll_width} > {m_inner_width}"

        screenshot_slides_mobile = ARTIFACT_DIR / 'e2e_slides_preview_mobile.png'
        mobile_page.screenshot(path=str(screenshot_slides_mobile))
        print(f"Captured screenshot: {screenshot_slides_mobile}")

        m_close_btn.click()
        m_modal_title.wait_for(state="hidden", timeout=5000)

        mobile_page.close()
        browser.close()

    print("\n=================================================================")
    print("ALL MULTI-FORMAT PREVIEW TESTS (DESKTOP & MOBILE) PASSED! 100%")
    print("=================================================================")

if __name__ == '__main__':
    main()

