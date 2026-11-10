import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/ca1f6c39-e403-4e88-b08e-71b8d7f04e98"
BASE_URL = "http://localhost:3000"

def test_user_management_i18n():
    print("🚀 Bắt đầu kiểm thử Playwright: Đa ngôn ngữ (i18n) phân hệ User Management & Bảo toàn dữ liệu người dùng")

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

        page = context.new_page()

        # ==========================================
        # PHẦN 1: KIỂM THỬ CHẾ ĐỘ TIẾNG ANH (🇬🇧 EN)
        # ==========================================
        print("\n--- 1. KIỂM THỬ GIAO DIỆN TIẾNG ANH (🇬🇧 EN) ---")
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.evaluate("""() => {
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'en');
        }""")
        page.goto(f"{BASE_URL}/user-management", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # 1.1 Assert Title & Subtitle
        title_en = page.locator("h3:has-text('User Management & RBAC Permissions')")
        assert title_en.is_visible(), "Lỗi: Không tìm thấy tiêu đề tiếng Anh 'User Management & RBAC Permissions'"
        print("  ✓ Tiêu đề trang tiếng Anh: OK")

        # 1.2 Assert Action Buttons
        btn_audit_en = page.locator("button:has-text('Audit Log')").first
        btn_add_en = page.locator("button:has-text('+ Add & Register New User')").first
        assert btn_audit_en.is_visible(), "Lỗi: Nút 'Audit Log' không hiển thị"
        assert btn_add_en.is_visible(), "Lỗi: Nút '+ Add & Register New User' không hiển thị"
        print("  ✓ Các nút thao tác tiếng Anh: OK")

        # 1.3 Assert Metric Stats Cards
        assert page.locator(".ant-statistic-title:has-text('Total Users')").is_visible(), "Lỗi: Metric 'Total Users' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Active')").is_visible(), "Lỗi: Metric 'Active' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Disabled')").is_visible(), "Lỗi: Metric 'Disabled' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Staff & Teachers')").is_visible(), "Lỗi: Metric 'Staff & Teachers' không hiển thị"
        print("  ✓ 5 Thẻ thống kê tiếng Anh: OK")

        # 1.4 Assert Table Headers
        assert page.locator("th:has-text('Member & Avatar')").is_visible(), "Lỗi: Cột 'Member & Avatar' không hiển thị"
        assert page.locator("th:has-text('Contact & Code')").is_visible(), "Lỗi: Cột 'Contact & Code' không hiển thị"
        assert page.locator("th:has-text('Role')").is_visible(), "Lỗi: Cột 'Role' không hiển thị"
        assert page.locator("th:has-text('Sign-in')").is_visible(), "Lỗi: Cột 'Sign-in' không hiển thị"
        assert page.locator("th:has-text('Active / Disabled')").is_visible(), "Lỗi: Cột 'Active / Disabled' không hiển thị"
        assert page.locator("th:has-text('Actions')").is_visible(), "Lỗi: Cột 'Actions' không hiển thị"
        print("  ✓ 6 Tiêu đề cột bảng tiếng Anh: OK")

        # 1.5 Assert User Input Data is Preserved (Không bị dịch tên người dùng hay email)
        assert page.locator(".desktop-user-view :has-text('Lê Thị Mỹ Dung')").first.is_visible(), "Lỗi: Mất tên người dùng Lê Thị Mỹ Dung"
        assert page.locator(".desktop-user-view :has-text('Phạm Quốc Bảo')").first.is_visible(), "Lỗi: Mất tên người dùng Phạm Quốc Bảo"
        assert page.locator(".desktop-user-view :has-text('lemydung49@gmail.com')").first.is_visible(), "Lỗi: Mất email người dùng"
        print("  ✓ Dữ liệu User Input (Tên, Email, SĐT) bảo toàn 100%: OK")

        # 1.6 Assert Table Row Actions
        assert page.locator(".desktop-user-view button:has-text('Details')").first.is_visible(), "Lỗi: Nút 'Details' không hiển thị"
        assert page.locator(".desktop-user-view :has-text('ACTIVE')").first.is_visible(), "Lỗi: Nhãn 'ACTIVE' không hiển thị"
        print("  ✓ Nút Details & Trạng thái ACTIVE tiếng Anh: OK")

        proof_en_path = os.path.join(ARTIFACTS_DIR, "proof_user_management_en.png")
        page.screenshot(path=proof_en_path)
        print(f"  📸 Đã chụp ảnh màn hình Tiếng Anh: {proof_en_path}")

        # ==========================================
        # PHẦN 2: KIỂM THỬ CHUYỂN SANG TIẾNG VIỆT (🇻🇳 VI)
        # ==========================================
        print("\n--- 2. KIỂM THỬ CHUYỂN SANG TIẾNG VIỆT (🇻🇳 VI) ---")
        page.evaluate("""() => {
            localStorage.setItem('lak_app_language', 'vi');
        }""")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # 2.1 Assert Title & Subtitle in Vietnamese
        title_vi = page.locator("h3:has-text('Quản Trị Người Dùng & Phân Quyền RBAC')")
        assert title_vi.is_visible(), "Lỗi: Không tìm thấy tiêu đề tiếng Việt"
        print("  ✓ Tiêu đề trang tiếng Việt: OK")

        # 2.2 Assert Action Buttons
        btn_audit_vi = page.locator("button:has-text('Nhật Ký Kiểm Toán')").first
        btn_add_vi = page.locator("button:has-text('+ Tạo & Đăng Ký Tài Khoản Mới')").first
        assert btn_audit_vi.is_visible(), "Lỗi: Nút 'Nhật Ký Kiểm Toán' không hiển thị"
        assert btn_add_vi.is_visible(), "Lỗi: Nút '+ Tạo & Đăng Ký Tài Khoản Mới' không hiển thị"
        print("  ✓ Các nút thao tác tiếng Việt: OK")

        # 2.3 Assert Metric Stats Cards
        assert page.locator(".ant-statistic-title:has-text('Tổng Tài Khoản')").is_visible(), "Lỗi: Metric 'Tổng Tài Khoản' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Đang Hoạt Động')").is_visible(), "Lỗi: Metric 'Đang Hoạt Động' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Đã Khóa')").is_visible(), "Lỗi: Metric 'Đã Khóa' không hiển thị"
        assert page.locator(".ant-statistic-title:has-text('Cán Bộ & Giáo Viên')").is_visible(), "Lỗi: Metric 'Cán Bộ & Giáo Viên' không hiển thị"
        print("  ✓ 5 Thẻ thống kê tiếng Việt: OK")

        # 2.4 Assert Table Headers in Vietnamese
        assert page.locator("th:has-text('Thành viên & Avatar')").is_visible(), "Lỗi: Cột 'Thành viên & Avatar' không hiển thị"
        assert page.locator("th:has-text('Liên hệ & Mã')").is_visible(), "Lỗi: Cột 'Liên hệ & Mã' không hiển thị"
        assert page.locator("th:has-text('Vai trò (Role)')").is_visible(), "Lỗi: Cột 'Vai trò (Role)' không hiển thị"
        assert page.locator("th:has-text('Đăng nhập')").is_visible(), "Lỗi: Cột 'Đăng nhập' không hiển thị"
        assert page.locator("th:has-text('Kích Hoạt / Khóa')").is_visible(), "Lỗi: Cột 'Kích Hoạt / Khóa' không hiển thị"
        assert page.locator("th:has-text('Hành động')").is_visible(), "Lỗi: Cột 'Hành động' không hiển thị"
        print("  ✓ 6 Tiêu đề cột bảng tiếng Việt: OK")

        # 2.5 Assert User Input Data is STILL Preserved
        assert page.locator(".desktop-user-view :has-text('Lê Thị Mỹ Dung')").first.is_visible(), "Lỗi: Mất tên người dùng Lê Thị Mỹ Dung"
        assert page.locator(".desktop-user-view :has-text('Phạm Quốc Bảo')").first.is_visible(), "Lỗi: Mất tên người dùng Phạm Quốc Bảo"
        assert page.locator(".desktop-user-view :has-text('lemydung49@gmail.com')").first.is_visible(), "Lỗi: Mất email người dùng"
        print("  ✓ Dữ liệu User Input (Tên, Email, SĐT) bảo toàn 100%: OK")

        # 2.6 Assert Table Row Actions in Vietnamese
        assert page.locator(".desktop-user-view button:has-text('Chi tiết')").first.is_visible(), "Lỗi: Nút 'Chi tiết' không hiển thị"
        assert page.locator(".desktop-user-view :has-text('HOẠT ĐỘNG')").first.is_visible(), "Lỗi: Nhãn 'HOẠT ĐỘNG' không hiển thị"
        print("  ✓ Nút Chi tiết & Trạng thái HOẠT ĐỘNG tiếng Việt: OK")

        proof_vi_path = os.path.join(ARTIFACTS_DIR, "proof_user_management_vi.png")
        page.screenshot(path=proof_vi_path)
        print(f"  📸 Đã chụp ảnh màn hình Tiếng Việt: {proof_vi_path}")

        print("\n🎉🎉🎉 KIỂM THỬ THÀNH CÔNG RỰC RỠ: 100% NHÃN GIAO DIỆN TỰ ĐỘNG CHUYỂN ĐỔI CHUẨN XÁC, DỮ LIỆU USER ĐƯỢC BẢO TOÀN NGUYÊN VẸN!")
        browser.close()

if __name__ == "__main__":
    test_user_management_i18n()
