#!/usr/bin/env python3
"""
qc_verify_student_consistency.py
Kiểm thử tự động E2E Playwright Headless kiểm toán tính nhất quán 2 chiều giữa các màn hình:
1. /students
2. /user-management/HV253 (Tab Nghiệp Vụ)
3. /user-management/HV253/edit (Tab Nghiệp Vụ)
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

def run_verification():
    print("==================================================================")
    print("🔍 PHÒNG QC & IT: KIỂM THỬ E2E TÍNH NHẤT QUÁN HAI CHIỀU HỌC VIÊN - LỚP HỌC")
    print("==================================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(viewport={"width": 1366, "height": 850})
        context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        page = context.new_page()

        try:
            # 1. Kiểm tra màn hình /students
            print("\n🎒 1. Điều hướng đến http://localhost:3000/students...")
            page.goto("http://localhost:3000/students", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Tìm kiếm HV253
            search_input = page.locator("input[placeholder*='Tìm kiếm'], input[placeholder*='Search']").first
            if search_input.is_visible():
                search_input.fill("HV253")
                page.wait_for_timeout(1000)

            students_screenshot = os.path.join(ARTIFACT_DIR, "qc_students_view_hv253.png")
            page.screenshot(path=students_screenshot, full_page=False)
            print(f"📸 Đã chụp ảnh màn hình /students: {students_screenshot}")

            page_text = page.locator("body").inner_text()
            assert "HV253" in page_text or "Melissa" in page_text, "LỖI: Không tìm thấy thẻ của học viên HV253 trên /students!"
            
            has_wp02 = "WP02" in page_text or "LH002" in page_text
            has_wp03 = "WP03" in page_text or "LH005" in page_text
            print(f"   - Thẻ HV253 chứa lớp WP02 (LH002): {has_wp02} (Kỳ vọng: TRUE)")
            print(f"   - Thẻ HV253 chứa lớp cũ WP03 (LH005): {has_wp03} (Kỳ vọng: FALSE)")
            assert has_wp02, "LỖI: HV253 phải có lớp WP02!"
            assert not has_wp03, "LỖI: HV253 không được còn lớp WP03!"
            print("   ✅ [PASS]: Màn hình /students hiển thị chính xác duy nhất 1 lớp WP02.")

            # 2. Điều hướng tới /user-management/HV253 (Xem chi tiết)
            print("\n👤 2. Điều hướng đến http://localhost:3000/user-management/HV253...")
            page.goto("http://localhost:3000/user-management/HV253", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Chuyển sang Tab 2: Nghiệp Vụ & Phân Quyền
            print("   👉 Chuyển sang Tab 'Nghiệp Vụ & Phân Quyền'...")
            page.evaluate("() => document.querySelectorAll('.ant-tabs-tab')[1].click()")
            page.wait_for_timeout(1200)

            detail_screenshot = os.path.join(ARTIFACT_DIR, "qc_user_detail_hv253.png")
            page.screenshot(path=detail_screenshot, full_page=False)
            print(f"📸 Đã chụp ảnh màn hình chi tiết: {detail_screenshot}")

            detail_text = page.locator("body").inner_text()
            has_wp02_detail = "WP02" in detail_text or "LH002" in detail_text
            has_wp03_detail = "WP03" in detail_text or "LH005" in detail_text
            print(f"   - Chi tiết HV253 chứa lớp WP02: {has_wp02_detail} (Kỳ vọng: TRUE)")
            print(f"   - Chi tiết HV253 chứa lớp WP03: {has_wp03_detail} (Kỳ vọng: FALSE)")
            assert has_wp02_detail, "LỖI: Màn hình chi tiết phải có WP02!"
            assert not has_wp03_detail, "LỖI: Màn hình chi tiết không được còn WP03!"
            print("   ✅ [PASS]: Màn hình chi tiết /user-management/HV253 hiển thị chính xác duy nhất 1 lớp WP02.")

            # 3. Điều hướng tới /user-management/HV253/edit (Chỉnh sửa)
            print("\n✏️ 3. Điều hướng đến http://localhost:3000/user-management/HV253/edit...")
            page.goto("http://localhost:3000/user-management/HV253/edit", wait_until="domcontentloaded")
            page.wait_for_timeout(2500)

            # Chuyển sang Tab 2: Nghiệp Vụ & Phân Quyền
            print("   👉 Chuyển sang Tab 'Nghiệp Vụ & Phân Quyền' trong Form Edit...")
            page.evaluate("() => document.querySelectorAll('.ant-tabs-tab')[1].click()")
            page.wait_for_timeout(1200)

            edit_screenshot = os.path.join(ARTIFACT_DIR, "qc_user_edit_hv253.png")
            page.screenshot(path=edit_screenshot, full_page=False)
            print(f"📸 Đã chụp ảnh màn hình Form Edit: {edit_screenshot}")

            # Đọc các tag đã chọn trong Ant Design Select
            selected_items = page.locator(".ant-select-selection-item-content").all_inner_texts()
            print(f"   - Các lớp được chọn trong Form Edit: {selected_items}")
            assert len(selected_items) == 1, f"LỖI: Form Edit phải có đúng 1 lớp được chọn! Hiện tại: {len(selected_items)}"
            assert any("WP02" in item or "LH002" in item for item in selected_items), f"LỖI: Lớp được chọn phải là WP02! ({selected_items})"
            print("   ✅ [PASS]: Form Edit /user-management/HV253/edit hiển thị chính xác duy nhất 1 lớp WP02.")

            print("\n==================================================================")
            print("🎉 TẤT CẢ 3/3 MÀN HÌNH ĐÃ ĐỒNG BỘ 100% NHẤT QUÁN TUYỆT ĐỐI (PASS)!")
            print("==================================================================")
            return True

        except Exception as e:
            print(f"\n❌ Kiểm thử E2E thất bại: {e}")
            err_shot = os.path.join(ARTIFACT_DIR, "qc_error_fail.png")
            page.screenshot(path=err_shot)
            return False
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    ok = run_verification()
    sys.exit(0 if ok else 1)
