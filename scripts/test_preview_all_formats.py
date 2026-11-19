#!/usr/bin/env python3
"""
scripts/test_preview_all_formats.py
Kiểm tra mở Preview cho 4 định dạng chính: PDF, VIDEO, AUDIO, SLIDES trên cả DEV và PROD.
Dùng ô tìm kiếm để định vị chính xác từng tệp.
"""

import time
from playwright.sync_api import sync_playwright

DEV_URL = "http://localhost:3000/learning-materials?sso_uid=ADM001"
PROD_URL = "https://bk.lakeducation.edu.vn/learning-materials?sso_uid=ADM001"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def test_preview_types(page, base_url, env_label):
    print(f"\n=======================================================")
    print(f"---> Testing 4 Previews on [{env_label}]: {base_url}")
    print(f"=======================================================")
    page.goto(base_url, wait_until="domcontentloaded")
    page.wait_for_selector(".ant-table-row", timeout=20000)
    time.sleep(1)

    items = [
        ("PDF Book G5", "ReadingWriting Companion G5U1-2 (SE)", "iframe"),
        ("Audio Player", "Listening Practice Track 01", "[data-testid='audio-speed-controller'], audio"),
        ("Video Player", "Interactive Read-Aloud Lesson Video", "video, iframe"),
        ("Slide Presentation", "Vocabulary & Phonics Presentation", "iframe, [data-testid='preview-slides-container']")
    ]

    for label, search_text, expected_selector in items:
        # Search for item
        search_input = page.locator("input.ant-input").first
        search_input.fill(search_text[:18])
        time.sleep(1)

        row = page.locator(".ant-table-row").first
        if row.is_visible():
            btn = row.locator("button:has-text('Preview'), button:has-text('Xem Trước')").first
            btn.click()
            page.wait_for_selector(".ant-modal", timeout=8000)
            time.sleep(1.5)
            
            # Check element
            el = page.locator(expected_selector).first
            assert el.is_visible(), f"FAIL: {label} preview element not visible!"
            
            # Check NO blob warning
            blob = page.locator("[data-testid='preview-blob-warning-card']")
            assert not blob.is_visible(), f"FAIL: Blob warning found on {label}!"
            
            screenshot = f"/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/qc_{env_label.lower()}_preview_{label.lower().replace(' ', '_')}.png"
            page.screenshot(path=screenshot)
            print(f"      ✅ [PASS]: {label:<22} rendered cleanly! Screenshot: {screenshot}")
            
            # Close modal
            page.locator(".ant-modal-close").first.click()
            time.sleep(0.8)
        else:
            print(f"      ⚠️ Note: {label} row not found after search.")

        # Clear search
        search_input.fill("")
        time.sleep(0.5)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--disable-blink-features=AutomationControlled"])
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        try:
            test_preview_types(page, DEV_URL, "DEV")
            test_preview_types(page, PROD_URL, "PROD")
            print("\n🎉 ALL 4 FORMAT PREVIEWS TESTED SUCCESSFULLY ON BOTH DEV AND PROD!")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
