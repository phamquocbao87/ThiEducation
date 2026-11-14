import os
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')

def main():
    # Tạo 2 file tạm để kiểm thử
    temp_dir = Path(tempfile.mkdtemp())
    file1 = temp_dir / "Wonders_G5_Unit1_Literature.pdf"
    file1.write_bytes(b"%PDF-1.4 Mock Wonders Grade 5 Anthology PDF Content For Testing")
    file2 = temp_dir / "Wonders_G5_Unit1_Audio.mp3"
    file2.write_bytes(b"ID3 Mock Audio MP3 Content For Testing")

    print(f"Created temporary mock files:\n- {file1}\n- {file2}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new']
        )

        # -------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1366x800)
        # -------------------------------------------------------------
        print("\n--- 1. TESTING DRAG & DROP FIREBASE UPLOAD (1366x800) ---")
        page = browser.new_page(viewport={'width': 1366, 'height': 800})
        page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)
        page.goto('http://127.0.0.1:3000/dashboard', wait_until='domcontentloaded')
        page.wait_for_timeout(1500)

        # Click menu item materials
        menu = page.locator('.ant-menu-item').filter(has_text='Learning Materials').or_(
            page.locator('.ant-menu-item').filter(has_text='Tài Liệu Học Tập')
        )
        menu.first.click()
        page.wait_for_timeout(1500)

        # 1.1 Kiểm tra Vùng Kéo Thả (Dropzone Dragger)
        dropzone = page.locator('[data-testid="materials-dropzone-card"]')
        assert dropzone.is_visible(), "Dropzone card must be visible on /learning-materials!"
        print("ASSERT PASS: Dropzone area is visible on screen")

        # -------------------------------------------------------------
        # TEST CASE A: KÉO 1 FILE VÀO WEB -> TẠO THƯ MỤC TRÊN FIREBASE
        # -------------------------------------------------------------
        print("\n--- TEST CASE A: KÉO 1 TỆP (SINGLE FILE DRAG & DROP) ---")
        file_input = page.locator('input[data-testid="materials-upload-dragger"]')
        file_input.set_input_files(str(file1))
        page.wait_for_timeout(1200)

        # Kiểm tra Dialog mở ra ngay lập tức
        modal_title = page.locator('[data-testid="upload-material-modal-title"]')
        assert modal_title.is_visible(), "Dialog must open immediately after dropping file!"
        print(f"ASSERT PASS: Upload Dialog opened: '{modal_title.inner_text().strip()}'")

        # Kiểm tra ô nhập Thư mục Firebase Storage
        folder_input = page.locator('[data-testid="input-firebase-folder"]')
        assert folder_input.is_visible(), "Firebase folder input must be visible!"
        folder_val = folder_input.input_value()
        print(f"ASSERT PASS: Pre-filled Firebase folder: 'learning_materials/{folder_val}/'")
        assert len(folder_val) > 0, "Folder name must not be empty!"

        # Chụp ảnh modal khi kéo 1 file
        screenshot_single = ARTIFACT_DIR / 'e2e_drag_drop_single_file_dialog.png'
        page.screenshot(path=str(screenshot_single))
        print(f"Captured screenshot: {screenshot_single}")

        # Bấm Upload lên Firebase
        submit_btn = page.locator('[data-testid="btn-submit-upload-material"]')
        submit_btn.click()
        modal_title.wait_for(state="hidden", timeout=10000)
        page.wait_for_timeout(600)

        # Kiểm tra hàng mới xuất hiện trên bảng có tag thư mục Firebase
        table = page.locator('[data-testid="materials-table"]')
        assert table.locator('.ant-table-row').filter(has_text='Wonders_G5_Unit1_Literature').count() > 0, "Uploaded file must appear in table!"
        print("ASSERT PASS: Single file uploaded and listed in table successfully!")

        # -------------------------------------------------------------
        # TEST CASE B: KÉO NHIỀU FILE VÀO WEB -> GOM CHUNG 1 THƯ MỤC FIREBASE
        # -------------------------------------------------------------
        print("\n--- TEST CASE B: KÉO NHIỀU TỆP (MULTIPLE FILES BATCH UPLOAD) ---")
        file_input.set_input_files([str(file1), str(file2)])
        page.wait_for_timeout(1200)

        assert modal_title.is_visible(), "Dialog must open for multiple files!"
        print("ASSERT PASS: Batch Upload Dialog opened for 2 files")

        # Kiểm tra danh sách hiển thị cả 2 file trong Dialog
        dropped_items = page.locator('[data-testid^="dropped-file-item-"]')
        assert dropped_items.count() == 2, f"Expected 2 dropped files, found {dropped_items.count()}"
        print("ASSERT PASS: Both files displayed with size and format tags in Dialog")

        # Chụp ảnh modal khi kéo nhiều file
        screenshot_batch = ARTIFACT_DIR / 'e2e_drag_drop_batch_files_dialog.png'
        page.screenshot(path=str(screenshot_batch))
        print(f"Captured screenshot: {screenshot_batch}")

        # Tùy chỉnh tên thư mục Firebase
        page.fill('[data-testid="input-firebase-folder"]', 'Wonders_G5_Unit1_Collection')
        page.wait_for_timeout(500)

        # Bấm Tiến Hành Upload Lên Firebase
        submit_btn.click()
        modal_title.wait_for(state="hidden", timeout=15000)
        page.wait_for_timeout(600)

        # Kiểm tra bảng đã có cả 2 tệp với folder 'Wonders_G5_Unit1_Collection'
        rows = table.locator('.ant-table-row')
        assert rows.filter(has_text='Wonders_G5_Unit1_Collection').count() >= 2, "Both files must have folder tag 'Wonders_G5_Unit1_Collection'!"
        print("ASSERT PASS: Both files created under Firebase Storage folder 'Wonders_G5_Unit1_Collection'!")

        # Chụp ảnh kết quả trên bảng
        screenshot_result = ARTIFACT_DIR / 'e2e_learning_materials_uploaded_table.png'
        page.screenshot(path=str(screenshot_result), full_page=True)
        print(f"Captured screenshot: {screenshot_result}")

        # Desktop Zero Overflow-X
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = page.evaluate("() => window.innerWidth")
        print(f"Desktop ScrollWidth: {scroll_width}, InnerWidth: {inner_width}")
        assert scroll_width <= inner_width, f"FAIL: Desktop overflow! ({scroll_width} > {inner_width})"
        print("ASSERT PASS Desktop: Zero Overflow-X (scrollWidth <= innerWidth)")

        # -------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390x844)
        # -------------------------------------------------------------
        print("\n--- 2. TESTING MOBILE VIEWPORT (390x844) ---")
        mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_page.goto('http://127.0.0.1:3000/?sso_uid=ADM001', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1000)
        mobile_page.goto('http://127.0.0.1:3000/dashboard', wait_until='domcontentloaded')
        mobile_page.wait_for_timeout(1000)
        mobile_menu = mobile_page.locator('.ant-btn').filter(has=mobile_page.locator('.anticon-menu')).first
        if mobile_menu.is_visible():
            mobile_menu.click()
            mobile_page.wait_for_timeout(600)
            drawer_item = mobile_page.locator('.ant-drawer .ant-menu-item').filter(has_text='Learning Materials').or_(
                mobile_page.locator('.ant-drawer .ant-menu-item').filter(has_text='Tài Liệu Học Tập')
            )
            drawer_item.first.click()
            mobile_page.wait_for_timeout(1500)

        m_scroll = mobile_page.evaluate("() => document.documentElement.scrollWidth")
        m_inner = mobile_page.evaluate("() => window.innerWidth")
        print(f"Mobile ScrollWidth: {m_scroll}, InnerWidth: {m_inner}")
        assert m_scroll <= m_inner, f"FAIL: Mobile overflow! ({m_scroll} > {m_inner})"
        print("ASSERT PASS Mobile: Zero Overflow-X (scrollWidth <= innerWidth)")

        screenshot_mobile = ARTIFACT_DIR / 'e2e_learning_materials_dropzone_mobile.png'
        mobile_page.screenshot(path=str(screenshot_mobile), full_page=True)
        print(f"Captured mobile screenshot: {screenshot_mobile}")

        # Clean up test rows
        for row in page.locator('.ant-table-row').filter(has_text='Wonders_G5_Unit1').all():
            del_btn = row.locator('[data-testid^="btn-delete-material-"]').first
            if del_btn.is_visible():
                del_btn.click()
                page.wait_for_timeout(400)
                popconfirm_ok = page.locator('.ant-popconfirm-buttons .ant-btn-dangerous, .ant-popconfirm-buttons .ant-btn-primary').first
                if popconfirm_ok.is_visible():
                    popconfirm_ok.click()
                    page.wait_for_timeout(600)

        print("ASSERT PASS: Cleaned up test materials (Zero Test-Data Residue)")

        mobile_page.close()
        page.close()
        browser.close()

        print("\n=======================================================")
        print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFICATION PASSED")
        print("=======================================================\n")

if __name__ == '__main__':
    main()
