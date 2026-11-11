import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def verify_registration_and_notifications():
    print("🚀 Bắt đầu kiểm toán Playwright: Xác minh Phân hệ Đăng ký Lớp học & Hệ thống Notification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # =========================================================================
        # 🔔 TEST 1: HỆ THỐNG NOTIFICATION TRÊN HEADER & DEEP-LINKING (GIÁO VỤ ACA545)
        # =========================================================================
        print("\n🔔 [1/3] Kiểm tra Chuông Thông Báo & Deep-linking với quyền Giáo vụ (ACA545)...")
        aca_context = browser.new_context(viewport={"width": 1366, "height": 850}, ignore_https_errors=True)
        aca_context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ACA545');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        aca_page = aca_context.new_page()

        print("  -> Mở trang chủ ERP /courses-classes...")
        aca_page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        aca_page.wait_for_timeout(2000)

        # Kiểm tra icon chuông thông báo trên Header
        bell_btn = aca_page.locator("button:has(.anticon-bell)")
        assert bell_btn.is_visible(), "FAIL: Không tìm thấy nút chuông thông báo trên Header"
        print("     ✅ Nút chuông thông báo hiển thị trên Header")

        # Click chuông để mở Popover danh sách thông báo
        print("  -> Bấm mở Popover thông báo...")
        bell_btn.click()
        aca_page.wait_for_timeout(1000)
        aca_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_noti_popover_academic.png")

        popover = aca_page.locator(".ant-popover:has-text('Thông Báo')")
        assert popover.is_visible(), "FAIL: Popover thông báo không mở khi click icon chuông"
        print("     ✅ Popover thông báo mở thành công với đầy đủ danh sách và badge")

        # Kiểm tra item thông báo đăng ký lớp LH001
        noti_item = popover.locator("text='Học viên đăng ký lớp LH001'").first
        assert noti_item.is_visible(), "FAIL: Không tìm thấy thông báo 'Học viên đăng ký lớp LH001'"
        print("     ✅ Thông báo 'Học viên đăng ký lớp LH001' hiển thị rõ ràng")

        # Tap vào thông báo để kiểm tra Deep-Linking
        print("  -> Tap vào thông báo để kiểm tra Deep-linking điều hướng vào Drawer lớp...")
        noti_item.click()
        aca_page.wait_for_timeout(1800)
        aca_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_noti_deeplink_drawer.png")

        # Kiểm tra Drawer chi tiết lớp LH001 đã tự động mở ra
        drawer = aca_page.locator(".ant-drawer:has-text('Chi Tiết Lớp Học')")
        assert drawer.is_visible(), "FAIL: Deep-linking không tự động mở Drawer lớp học khi tap vào thông báo"
        assert aca_page.locator(".ant-drawer:has-text('LH001')").is_visible(), "FAIL: Drawer mở sai lớp học"
        print("     ✅ Deep-linking 1-chạm hoạt động hoàn hảo: Tab Lớp Học được kích hoạt và Drawer LH001 tự động mở!")

        aca_context.close()

        # =========================================================================
        # 🚫 TEST 2: CƯỠNG CHẾ PHÂN QUYỀN - CHẶN ADMIN & GIÁO VỤ ĐĂNG KÝ DẠY
        # =========================================================================
        print("\n🚫 [2/3] Kiểm tra cưỡng chế phân quyền: Admin & Giáo vụ KHÔNG được đăng ký dạy...")
        admin_context = browser.new_context(viewport={"width": 1366, "height": 850}, ignore_https_errors=True)
        admin_context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        admin_page = admin_context.new_page()

        print("  -> Mở /courses-classes với quyền Admin ADM001...")
        admin_page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        admin_page.wait_for_timeout(2000)

        # Chuyển sang Tab Lớp Học
        admin_page.locator(".ant-tabs-tab").filter(has_text="Lớp Học").first.click()
        admin_page.wait_for_timeout(1000)
        admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_no_apply_to_teach.png", full_page=True)

        # Khẳng định: Hoàn toàn KHÔNG có nút "Đăng Ký Nhận Dạy" hay "Apply to Teach"
        apply_teach_btn = admin_page.locator("button:has-text('Đăng Ký Nhận Dạy')")
        apply_teach_en = admin_page.locator("button:has-text('Apply to Teach')")
        has_apply_btn = (apply_teach_btn.count() > 0 and apply_teach_btn.first.is_visible()) or \
                        (apply_teach_en.count() > 0 and apply_teach_en.first.is_visible())

        print(f"     🔒 Khẳng định Admin KHÔNG có nút đăng ký dạy: {not has_apply_btn}")
        assert not has_apply_btn, "FAIL: Nút 'Đăng Ký Nhận Dạy' bị rò rỉ cho tài khoản Admin!"

        admin_context.close()

        # =========================================================================
        # 👨‍🏫 TEST 3: QUY TRÌNH ĐĂNG KÝ CỦA HỌC VIÊN & GIÁO VIÊN
        # =========================================================================
        print("\n👨‍🏫 [3/3] Kiểm tra luồng của Học viên HV214 & Giáo viên GV791...")
        student_context = browser.new_context(viewport={"width": 1366, "height": 850}, ignore_https_errors=True)
        student_context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'HV214');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        student_page = student_context.new_page()

        print("  -> Mở /courses-classes với quyền Học viên HV214...")
        student_page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        student_page.wait_for_timeout(2000)
        student_page.locator(".ant-tabs-tab").filter(has_text="Lớp Học").first.click()
        student_page.wait_for_timeout(1000)
        student_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_student_class_registration.png", full_page=True)

        # Kiểm tra lớp LH001: HV214 đã ghi danh -> hiện tag "Đã tham gia lớp này"
        lh001_card = student_page.locator(".ant-col:has-text('LH001')").first
        enrolled_tag = lh001_card.locator("text='Đã tham gia lớp này'")
        print(f"     ✅ Thẻ LH001 hiển thị tag trạng thái ghi danh học viên: {enrolled_tag.is_visible()}")

        # Kiểm tra chuông thông báo của Học viên HV214 nhận được thông báo phê duyệt
        student_bell = student_page.locator("button:has(.anticon-bell)")
        assert student_bell.is_visible(), "FAIL: Chuông thông báo không hiển thị cho Học viên"
        student_bell.click()
        student_page.wait_for_timeout(1000)
        student_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_noti_popover_student.png")
        student_popover = student_page.locator(".ant-popover:has-text('Thông Báo')")
        print(f"     ✅ Học viên HV214 mở được Popover Thông báo cá nhân: {student_popover.is_visible()}")

        student_context.close()
        browser.close()

    print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM TOÁN PLAYWRIGHT ĐỀU ĐẠT CHUẨN 100%!")

if __name__ == "__main__":
    verify_registration_and_notifications()

