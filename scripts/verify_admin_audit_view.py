import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def run_audit_verification():
    print("🚀 Bắt đầu kiểm toán Playwright: Xác minh hiển thị Người Tạo & Người Cập Nhật (Admin View vs Non-Admin)...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ==========================================
        # 👑 PHẦN 1: KIỂM TOÁN VỚI VAI TRÒ ADMIN (ADM001)
        # ==========================================
        print("\n👑 [1/2] Kiểm tra với vai trò Quản trị viên IT (ADM001)...")
        admin_context = browser.new_context(
            viewport={"width": 1366, "height": 850},
            ignore_https_errors=True
        )
        admin_context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        admin_page = admin_context.new_page()

        # 1.1 Kiểm tra Người Dùng (/user-management)
        print("  -> Mở /user-management...")
        admin_page.goto(f"{BASE_URL}/user-management", wait_until="domcontentloaded")
        admin_page.wait_for_timeout(2500)
        admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_users.png", full_page=True)
        users_has_audit = admin_page.locator("th:has-text('Nhật Ký Quản Trị')").is_visible() or admin_page.locator("text='Tạo:'").first.is_visible()
        print(f"     ✅ Người Dùng hiển thị cột Audit: {users_has_audit}")
        assert users_has_audit, "FAIL: Cột audit không hiển thị trên bảng Người Dùng cho Admin"

        # 1.2 Kiểm tra Chi Tiết Người Dùng (/user-management/HV214)
        print("  -> Mở /user-management/HV214...")
        admin_page.goto(f"{BASE_URL}/user-management/HV214", wait_until="domcontentloaded")
        admin_page.wait_for_timeout(2000)
        admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_user_detail.png", full_page=True)
        user_detail_has_audit = admin_page.locator("text='Nhật Ký Kiểm Toán Hệ Thống'").is_visible() or admin_page.locator("text='Người khởi tạo:'").is_visible()
        print(f"     ✅ Chi tiết Người Dùng hiển thị Audit Banner: {user_detail_has_audit}")
        assert user_detail_has_audit, "FAIL: Khối audit banner không hiển thị trên trang chi tiết user"

        # 1.3 Kiểm tra Cấp Độ Giáo Trình (/curriculum-levels)
        print("  -> Mở /curriculum-levels...")
        admin_page.goto(f"{BASE_URL}/curriculum-levels", wait_until="domcontentloaded")
        admin_page.wait_for_timeout(2000)
        admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_curriculum.png", full_page=True)
        curriculum_has_audit = admin_page.locator("th:has-text('Khởi Tạo / Sửa Đổi')").is_visible() or admin_page.locator("text='Tạo:'").first.is_visible()
        print(f"     ✅ Cấp Độ Giáo Trình hiển thị cột Audit: {curriculum_has_audit}")
        assert curriculum_has_audit, "FAIL: Cột audit không hiển thị trên bảng Cấp Độ Giáo Trình cho Admin"

        # 1.4 Kiểm tra Khóa Học (/courses-classes)
        print("  -> Mở /courses-classes (Tab Khóa Học)...")
        admin_page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        admin_page.wait_for_timeout(2500)
        admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_courses.png", full_page=True)
        course_cards_has_audit = admin_page.locator("text='Tạo bởi:'").first.is_visible()
        print(f"     ✅ Thẻ Khóa Học hiển thị Audit: {course_cards_has_audit}")
        assert course_cards_has_audit, "FAIL: Audit không hiển thị trên thẻ Khóa Học cho Admin"

        # 1.5 Kiểm tra Lớp Học (Tab Class Management)
        print("  -> Chuyển sang Tab Lớp Học...")
        class_tab = admin_page.locator(".ant-tabs-tab").filter(has_text="Lớp Học").first
        if class_tab.is_visible():
            class_tab.click()
            admin_page.wait_for_timeout(1500)
            admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_classes.png", full_page=True)
            col_lh001 = admin_page.locator(".ant-col:has-text('LH001')").first
            class_card_has_audit = col_lh001.locator("text='Tạo bởi:'").is_visible()
            print(f"     ✅ Thẻ Lớp Học hiển thị Audit: {class_card_has_audit}")
            assert class_card_has_audit, "FAIL: Audit không hiển thị trên thẻ Lớp Học cho Admin"

            # 1.6 Mở Drawer Chi Tiết Lớp Học
            print("  -> Mở Drawer Chi Tiết Lớp Học...")
            details_btn = col_lh001.locator("button:has-text('Chi Tiết')")
            if details_btn.is_visible():
                details_btn.click()
                admin_page.wait_for_timeout(1200)
                admin_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_admin_audit_class_drawer.png")
                drawer = admin_page.locator(".ant-drawer")
                drawer_has_audit = drawer.locator("text='Người khởi tạo:'").is_visible()
                print(f"     ✅ Drawer Lớp Học hiển thị Audit Banner: {drawer_has_audit}")
                assert drawer_has_audit, "FAIL: Audit banner không hiển thị trong Drawer Lớp Học"

        admin_context.close()

        # ==========================================
        # 🎓 PHẦN 2: KIỂM TOÁN VỚI VAI TRÒ GIÁO VỤ (ACA545 - Non-Admin)
        # ==========================================
        print("\n🎓 [2/2] Kiểm tra với vai trò Giáo vụ (ACA545 - Non-Admin)...")
        academic_context = browser.new_context(
            viewport={"width": 1366, "height": 850},
            ignore_https_errors=True
        )
        academic_context.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ACA545');
            localStorage.setItem('lak_app_language', 'vi');
        """)
        academic_page = academic_context.new_page()

        # 2.1 Kiểm tra Người Dùng (/user-management)
        print("  -> Mở /user-management với quyền ACA545...")
        academic_page.goto(f"{BASE_URL}/user-management", wait_until="domcontentloaded")
        academic_page.wait_for_timeout(2500)
        academic_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_nonadmin_audit_users.png", full_page=True)
        nonadmin_users_audit_visible = academic_page.locator("th:has-text('Nhật Ký Quản Trị')").is_visible()
        print(f"     🔒 Non-admin KHÔNG thấy cột Audit User: {not nonadmin_users_audit_visible}")
        assert not nonadmin_users_audit_visible, "FAIL: Cột audit bị rò rỉ cho Non-Admin trên Người Dùng"

        # 2.2 Kiểm tra Cấp Độ Giáo Trình (/curriculum-levels)
        print("  -> Mở /curriculum-levels với quyền ACA545...")
        academic_page.goto(f"{BASE_URL}/curriculum-levels", wait_until="domcontentloaded")
        academic_page.wait_for_timeout(2000)
        academic_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_nonadmin_audit_curriculum.png", full_page=True)
        nonadmin_curriculum_audit_visible = academic_page.locator("th:has-text('Khởi Tạo / Sửa Đổi')").is_visible()
        print(f"     🔒 Non-admin KHÔNG thấy cột Audit Curriculum: {not nonadmin_curriculum_audit_visible}")
        assert not nonadmin_curriculum_audit_visible, "FAIL: Cột audit bị rò rỉ cho Non-Admin trên Cấp Độ Giáo Trình"

        # 2.3 Kiểm tra Khóa Học & Lớp Học (/courses-classes)
        print("  -> Mở /courses-classes với quyền ACA545...")
        academic_page.goto(f"{BASE_URL}/courses-classes", wait_until="domcontentloaded")
        academic_page.wait_for_timeout(2500)
        academic_page.screenshot(path=f"{ARTIFACTS_DIR}/proof_nonadmin_audit_courses.png", full_page=True)
        audit_count = academic_page.locator("text='Tạo bởi:'").count()
        nonadmin_course_audit_visible = audit_count > 0 and academic_page.locator("text='Tạo bởi:'").first.is_visible()
        print(f"     🔒 Non-admin KHÔNG thấy tag Audit Course (count={audit_count}): {not nonadmin_course_audit_visible}")
        assert not nonadmin_course_audit_visible, "FAIL: Thẻ audit bị rò rỉ cho Non-Admin trên Khóa Học"

        academic_context.close()
        browser.close()

    print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM TOÁN PLAYWRIGHT ĐỀU ĐẠT CHUẨN 100%!")

if __name__ == "__main__":
    run_audit_verification()
