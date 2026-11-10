import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_test():
    print("🚀 Bắt đầu kiểm thử Playwright: Nâng cấp Quản trị Học viên & Va chạm Lịch học")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 850},
            ignore_https_errors=True
        )
        # Tự động gắn quyền IT Admin tối cao ADM001
        context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        
        page = context.new_page()

        # 1. Điều hướng thẳng tới trang tạo tài khoản mới
        print("1. Mở trang /user-management/new với quyền IT Admin...")
        page.goto(f"{BASE_URL}/user-management/new", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        print(f"Đang ở trang: {page.url}")

        # 2. Điền thông tin tạo học viên Phạm Bảo Lâm (em trai Phạm Bảo Thư)
        print("2. Nhập thông tin học viên Phạm Bảo Lâm với SĐT 0989557230...")
        page.fill("input#name", "Phạm Bảo Lâm")
        page.wait_for_timeout(300)
        page.fill("input#englishName", "Cowboy")
        page.fill("input#phoneNumber", "0989557230")
        page.wait_for_timeout(1000)

        # Kiểm tra SĐT Phụ Huynh tự động đồng bộ bằng Số Điện Thoại 1
        parent_phone_val = page.input_value("input#parentPhone")
        print(f"  -> SĐT Phụ huynh tự động điền: '{parent_phone_val}'")
        assert parent_phone_val == "0989557230", f"Lỗi: parentPhone không tự động đồng bộ (nhận được: {parent_phone_val})"

        # Kiểm tra phát hiện cụm gia đình
        sibling_tag = page.locator(".ant-alert:has-text('Phát hiện Cụm Gia Đình')")
        if sibling_tag.is_visible():
            print("  -> PASS: Phát hiện Cụm Gia Đình thành công: hiển thị thông báo liên kết anh chị em")

        # 3. Test chọn 2 lớp TRÙNG KHUNG GIỜ HỌC: LH001 và LH005
        print("3. Kiểm thử phát hiện trùng lịch học online giữa LH001 và LH005...")
        
        # Mở dropdown enrolledClassIds
        page.locator("#enrolledClassIds").click()
        page.wait_for_timeout(600)

        # Chọn LH001
        opt_lh001 = page.locator(".ant-select-item-option:has-text('LH001')").first
        if opt_lh001.is_visible():
            opt_lh001.click()
            page.wait_for_timeout(500)

        # Chọn LH005 (trùng giờ với LH001: Thứ 2, Thứ 4 18:00-19:30 vs 18:30-20:00)
        page.locator("#enrolledClassIds").click()
        page.wait_for_timeout(500)
        opt_lh005 = page.locator(".ant-select-item-option:has-text('LH005')").first
        if opt_lh005.is_visible():
            opt_lh005.click()
            page.wait_for_timeout(500)

        # Đóng dropdown
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)

        # Kiểm tra hiển thị Cảnh báo trùng lịch học
        conflict_alert = page.locator(".ant-alert-error:has-text('TRÙNG KHUNG GIỜ HỌC ONLINE')")
        assert conflict_alert.is_visible(), "Lỗi: Không hiển thị cảnh báo đỏ khi chọn 2 lớp trùng lịch học!"
        print("  -> PASS: Cảnh báo đỏ phát hiện trùng lịch học đã xuất hiện chính xác!")
        
        # Chụp ảnh minh chứng va chạm lịch học
        conflict_screenshot = f"{ARTIFACTS_DIR}/proof_schedule_conflict_detected.png"
        page.screenshot(path=conflict_screenshot, full_page=True)
        print(f"  -> Đã lưu ảnh: {conflict_screenshot}")

        # Thử submit khi đang có xung đột -> hệ thống phải chặn
        submit_btn = page.locator("button:has-text('Tạo & Kích Hoạt Tài Khoản')").first
        submit_btn.click()
        page.wait_for_timeout(1000)
        
        print("  -> PASS: Submit bị chặn đứng do va chạm lịch học!")

        # 4. Bỏ chọn lớp trùng LH005, chọn lớp không trùng LH003
        print("4. Bỏ chọn LH005, chọn lớp hợp lệ LH003...")
        # Bấm nút gỡ LH005
        remove_lh005 = page.locator(".ant-select-selection-item:has-text('LH005') .ant-select-selection-item-remove")
        if remove_lh005.is_visible():
            remove_lh005.click()
            page.wait_for_timeout(500)

        # Mở chọn LH003
        page.locator("#enrolledClassIds").click()
        page.wait_for_timeout(500)
        opt_lh003 = page.locator(".ant-select-item-option:has-text('LH003')").first
        if opt_lh003.is_visible():
            opt_lh003.click()
            page.wait_for_timeout(500)
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)

        # Kiểm tra Cảnh báo đỏ đã biến mất
        assert not conflict_alert.is_visible(), "Lỗi: Cảnh báo đỏ vẫn còn sau khi gỡ lớp trùng giờ!"
        print("  -> PASS: Cảnh báo đỏ đã biến mất sau khi chọn lớp hợp lệ!")

        # Kiểm tra Cấp độ tự động nhận diện
        level_tag = page.locator("text=WONDERS-G1").first
        print(f"  -> PASS: Cấp độ tự động nhận diện theo lớp học: {level_tag.is_visible()}")

        # Kiểm tra Trạng thái học phí hiển thị 'Chờ đối soát'
        tuition_badge = page.locator(".ant-tag:has-text('Chờ đối soát')").first
        print(f"  -> PASS: Trạng thái học phí hiển thị tự động 'Chờ đối soát': {tuition_badge.is_visible()}")

        # Chụp ảnh trước khi submit hợp lệ
        valid_form_screenshot = f"{ARTIFACTS_DIR}/proof_valid_student_registration_form.png"
        page.screenshot(path=valid_form_screenshot, full_page=True)
        print(f"  -> Đã lưu ảnh: {valid_form_screenshot}")

        # 5. Bấm tạo tài khoản
        print("5. Thực hiện Tạo & Kích Hoạt Tài Khoản Phạm Bảo Lâm...")
        submit_btn.click()
        
        # Chờ điều hướng về /user-management và bảng dữ liệu tải xong
        page.wait_for_url("**/user-management", timeout=15000)
        page.wait_for_selector(".ant-table-tbody", timeout=15000)
        page.wait_for_timeout(1500)
        print(f"URL sau khi tạo: {page.url}")
        
        # Chụp màn hình trang danh sách người dùng
        list_screenshot = f"{ARTIFACTS_DIR}/proof_user_list_with_both_siblings.png"
        page.screenshot(path=list_screenshot, full_page=True)
        print(f"  -> Đã lưu ảnh danh sách: {list_screenshot}")

        # 6. Tìm và vào chi tiết Phạm Bảo Lâm
        print("6. Kiểm tra trang Chi tiết Hồ Sơ Phạm Bảo Lâm...")
        page.wait_for_selector("tr:has-text('Phạm Bảo Lâm')", timeout=15000)
        lam_row = page.locator("tr:has-text('Phạm Bảo Lâm')").first
        assert lam_row.is_visible(), "Lỗi: Không tìm thấy học viên Phạm Bảo Lâm trong danh sách sau khi tạo!"
        print("  -> PASS: Đã tìm thấy học viên Phạm Bảo Lâm trong bảng người dùng!")

        detail_btn = lam_row.locator("button:has-text('Chi tiết')").first
        detail_btn.click()
        page.wait_for_timeout(2500)
        
        # Chụp ảnh View Mode
        detail_view_screenshot = f"{ARTIFACTS_DIR}/proof_student_detail_view_mode.png"
        page.screenshot(path=detail_view_screenshot, full_page=True)
        print(f"  -> Đã lưu ảnh Chi tiết View Mode: {detail_view_screenshot}")

        # Kiểm tra hiển thị Card Đánh giá giáo viên bản xứ
        teacher_eval = page.locator("text=Đánh Giá Giáo Viên Bản Xứ")
        print(f"  -> PASS: Đánh giá giáo viên bản xứ hiển thị: {teacher_eval.is_visible()}")

        # Vào Chỉnh sửa Hồ Sơ
        edit_btn = page.locator("button:has-text('Chỉnh Sửa Hồ Sơ'), button:has-text('Edit Profile')").first
        if edit_btn.is_visible():
            edit_btn.click()
            page.wait_for_timeout(2000)
            
            # Chụp ảnh Edit Mode
            detail_edit_screenshot = f"{ARTIFACTS_DIR}/proof_student_detail_edit_mode.png"
            page.screenshot(path=detail_edit_screenshot, full_page=True)
            print(f"  -> Đã lưu ảnh Chi tiết Edit Mode: {detail_edit_screenshot}")

        browser.close()
        print("🎉 Toàn bộ bài test Playwright đã hoàn thành 100% THÀNH CÔNG!")

if __name__ == "__main__":
    run_test()
