import sys
import time
from playwright.sync_api import sync_playwright

def run_student_cards_e2e_test():
    print("🚀 Bắt đầu Kiểm thử E2E: Quản Lý Học Viên Riêng Biệt tại Route /students")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        
        # 1. Desktop Test (1366x800)
        context_desktop = browser.new_context(viewport={"width": 1366, "height": 800})
        page_desktop = context_desktop.new_page()
        
        print("\n--- [Desktop 1366x800] 1. Kiểm tra Điều hướng Menu Sidebar sang /students ---")
        login_url = "http://127.0.0.1:3000/?sso_uid=ADM001"
        page_desktop.goto(login_url, wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)
        page_desktop.goto("http://127.0.0.1:3000/dashboard", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)
        
        # Kiểm tra Menu Sidebar
        sidebar_menu = page_desktop.locator(".ant-layout-sider")
        assert sidebar_menu.is_visible(), "Sidebar phải hiển thị trên Desktop"
        
        # Kiểm tra menu Quản Lý Học Viên
        student_menu_item = page_desktop.locator(".ant-menu-item").filter(has_text="Quản Lý Học Viên").or_(
            page_desktop.locator(".ant-menu-item").filter(has_text="Students")
        )
        assert student_menu_item.count() > 0, "Menu Quản Lý Học Viên phải tồn tại trên Sidebar"
        print(f"✅ Sidebar có menu Quản Lý Học Viên: '{student_menu_item.first.inner_text().strip()}'")
        
        # Click menu Quản Lý Học Viên -> Phải đến thẳng /students
        student_menu_item.first.click()
        page_desktop.wait_for_timeout(2000)
        
        current_url = page_desktop.url
        print(f"URL sau khi bấm menu Sidebar: {current_url}")
        assert current_url.endswith("/students") or "/students" in current_url, f"URL phải là /students, hiện tại: {current_url}"
        print("✅ ĐÃ XÁC THỰC: Bấm menu Sidebar điều hướng thẳng đến /students!")
        
        # 1.1 Kiểm tra Chế độ xem Quản Lý Học Viên Riêng Biệt (DEDICATED VIEW)
        print("\n--- [Desktop 1366x800] 1.1 Kiểm tra KHÔNG CÒN CÁC TAB KHÓA HỌC / LỚP HỌC / CẤP ĐỘ ---")
        dedicated_view = page_desktop.locator("[data-testid='dedicated-student-management-view']")
        assert dedicated_view.is_visible(), "Chế độ xem riêng biệt Quản Lý Học Viên phải hiển thị"
        
        # ASSERT KHÔNG CÒN CÁC TAB CỦA KHÓA HỌC & LỚP HỌC
        classes_tab = page_desktop.locator(".ant-tabs-tab:has-text('Quản Lý Lớp Học'), .ant-tabs-tab:has-text('Classes')")
        assert classes_tab.count() == 0, "LỖI: Tab Quản Lý Lớp Học vẫn còn xuất hiện!"
        
        courses_tab = page_desktop.locator(".ant-tabs-tab:has-text('Danh Mục Khóa Học'), .ant-tabs-tab:has-text('Course')")
        assert courses_tab.count() == 0, "LỖI: Tab Danh Mục Khóa Học vẫn còn xuất hiện!"
        
        curriculum_tab = page_desktop.locator(".ant-tabs-tab:has-text('Cấp Độ Giáo Trình'), .ant-tabs-tab:has-text('Curriculum')")
        assert curriculum_tab.count() == 0, "LỖI: Tab Cấp Độ Giáo Trình vẫn còn xuất hiện!"
        print("✅ ASSERT PASS: Hoàn toàn không còn các tab Quản Lý Lớp Học, Danh Mục Khóa Học, Cấp Độ Giáo Trình!")
        
        # Kiểm tra Tiêu đề trang Quản Lý Học Viên
        header_title = page_desktop.locator("h3").first.inner_text()
        print(f"Tiêu đề trang: {header_title}")
        assert "Quản Lý Học Viên" in header_title or "Student Management" in header_title, "Tiêu đề phải là Quản Lý Học Viên"
        
        print("\n--- [Desktop 1366x800] 2. Kiểm tra Thống kê & 15 Thẻ Học Viên Thật ---")
        container = page_desktop.locator("[data-testid='student-management-card-grid-container']")
        assert container.is_visible(), "Container StudentCardGrid phải hiển thị"
        
        student_cards = page_desktop.locator("[data-testid^='student-card-']")
        card_count = student_cards.count()
        print(f"Số lượng thẻ học viên thực tế hiển thị: {card_count}")
        assert card_count >= 15, f"Hệ thống phải hiển thị đầy đủ 15 học viên thật (thực tế: {card_count})"
        
        # Kiểm tra chi tiết thẻ HV151
        card_hv151 = page_desktop.locator("[data-testid='student-card-HV151']")
        assert card_hv151.is_visible(), "Thẻ học viên HV151 (Vivian - Tường Vi) phải hiển thị"
        hv151_text = card_hv151.inner_text()
        assert "Vivian" in hv151_text, "Phải hiển thị tên tiếng Anh Vivian"
        assert "HV151" in hv151_text, "Phải hiển thị mã HV151"
        assert "0786436333" in hv151_text or "0786" in hv151_text, "Phải hiển thị số điện thoại phụ huynh"
        
        # Kiểm tra nút Zalo và Gọi điện
        zalo_btn = page_desktop.locator("[data-testid='btn-zalo-student-HV151']")
        assert zalo_btn.is_visible(), "Nút Zalo 1 chạm phải hiển thị"
        zalo_href = zalo_btn.get_attribute("href")
        assert "zalo.me" in zalo_href, "Liên kết Zalo phải trỏ đến zalo.me"
        
        call_btn = page_desktop.locator("[data-testid='btn-call-student-HV151']")
        assert call_btn.is_visible(), "Nút Gọi điện thoại phải hiển thị"
        call_href = call_btn.get_attribute("href")
        assert "tel:" in call_href, "Liên kết Gọi điện phải có tel:"
        
        print("\n--- [Desktop 1366x800] 3. Kiểm tra Tìm kiếm 2 chiều & Bộ lọc ---")
        search_input = page_desktop.locator("[data-testid='input-search-student-cards']")
        assert search_input.is_visible(), "Ô tìm kiếm học viên phải hiển thị"
        
        # Tìm kiếm theo tên tiếng Anh: "Vivian"
        search_input.fill("Vivian")
        page_desktop.wait_for_timeout(600)
        filtered_count = page_desktop.locator("[data-testid^='student-card-']").count()
        assert filtered_count == 1, f"Chỉ có 1 thẻ Vivian (thực tế: {filtered_count})"
        
        # Tìm kiếm theo tên tiếng Việt không dấu: "Tuong Vi"
        search_input.fill("Tuong Vi")
        page_desktop.wait_for_timeout(600)
        filtered_vi = page_desktop.locator("[data-testid^='student-card-']").count()
        assert filtered_vi == 1, "Tìm tiếng Việt không dấu phải trả về đúng Vivian (Tường Vi)"
        
        # Xóa tìm kiếm
        search_input.fill("")
        page_desktop.wait_for_timeout(600)
        reset_count = page_desktop.locator("[data-testid^='student-card-']").count()
        assert reset_count >= 15, "Sau khi xóa tìm kiếm phải hiển thị lại tất cả thẻ"
        
        print("\n--- [Desktop 1366x800] 4. Kiểm tra Phản hồi Tức thì 0ms (Optimistic Status Switch) ---")
        switch_hv151 = page_desktop.locator("[data-testid='switch-status-student-HV151']")
        assert switch_hv151.is_visible(), "Switch trạng thái học viên HV151 phải hiển thị"
        initial_checked = switch_hv151.get_attribute("aria-checked")
        
        switch_hv151.click()
        page_desktop.wait_for_timeout(300)
        new_checked = switch_hv151.get_attribute("aria-checked")
        assert new_checked != initial_checked, "Trạng thái Switch phải đổi ngay tức thì (0ms)"
        
        switch_hv151.click()
        page_desktop.wait_for_timeout(500)
        
        print("\n--- [Desktop 1366x800] 5. Kiểm toán Kỹ thuật: Zero Overflow-X & Card Width ---")
        overflow_desktop = page_desktop.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_desktop, "LỖI: Desktop bị tràn ngang (Overflow-X)!"
        
        card_box = card_hv151.bounding_box()
        assert card_box['width'] >= 280, f"Card Desktop phải có độ thở >= 280px (hiện tại: {card_box['width']}px)"
        
        # Chụp ảnh minh chứng Desktop
        desktop_screenshot = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_student_cards_desktop.png"
        page_desktop.screenshot(path=desktop_screenshot, full_page=False)
        print(f"📸 Đã lưu ảnh Desktop: {desktop_screenshot}")
        
        # 1.2 Kiểm tra khi quay lại Khóa Học & Lớp Học: 3 Tab vẫn đầy đủ và KHÔNG có tab học viên
        print("\n--- [Desktop 1366x800] 5.1 Kiểm tra trang Khóa Học & Lớp Học khi quay lại ---")
        page_desktop.goto("http://127.0.0.1:3000/courses-classes", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)
        
        all_tabs = page_desktop.locator(".ant-tabs-tab").all_inner_texts()
        print(f"Danh sách Tabs thực tế trên /courses-classes: {all_tabs}")
        assert len(all_tabs) == 3, f"Phải có đúng 3 tab trên trang Khóa Học (thực tế: {len(all_tabs)})"
        
        student_tab_in_courses = page_desktop.locator(".ant-tabs-tab:has-text('Quản Lý Học Viên'), .ant-tabs-tab:has-text('Student Management')")
        assert student_tab_in_courses.count() == 0, "LỖI: Tab Học Viên không được nằm chung trong trang Khóa Học!"
        print("✅ Trang Khóa Học & Lớp Học có đúng 3 tab chuẩn (Lớp Học, Khóa Học, Cấp Độ), đã tách riêng Học Viên!")
        
        # 1.3 Kiểm tra Redirect từ legacy URL ?tab=students sang /students
        print("\n--- [Desktop 1366x800] 5.2 Kiểm tra Redirect từ /courses-classes?tab=students ---")
        page_desktop.goto("http://127.0.0.1:3000/courses-classes?tab=students", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)
        redirected_url = page_desktop.url
        print(f"URL sau khi vào /courses-classes?tab=students: {redirected_url}")
        assert redirected_url.endswith("/students") or "/students" in redirected_url, f"Phải tự động redirect sang /students, hiện tại: {redirected_url}"
        print("✅ Redirect từ /courses-classes?tab=students sang /students thành công!")
        
        context_desktop.close()
        
        # 2. Mobile Test (390x844)
        print("\n--- [Mobile 390x844] 6. Kiểm tra Trải nghiệm Mobile First tại /students ---")
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_mobile = context_mobile.new_page()
        
        page_mobile.goto("http://127.0.0.1:3000/?sso_uid=ADM001", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(1500)
        page_mobile.goto("http://127.0.0.1:3000/students", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(2000)
        
        container_mobile = page_mobile.locator("[data-testid='student-management-card-grid-container']")
        assert container_mobile.is_visible(), "Container phải hiển thị hoàn hảo trên Mobile"
        
        # Xác nhận Mobile cũng KHÔNG có 3 tab kia
        assert page_mobile.locator(".ant-tabs-tab").count() == 0, "Mobile không được chứa tab Khóa Học / Lớp Học!"
        
        cards_mobile = page_mobile.locator("[data-testid^='student-card-']")
        assert cards_mobile.count() >= 15, "Mobile phải hiển thị danh sách thẻ đầy đủ"
        
        overflow_mobile = page_mobile.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_mobile, "LỖI: Mobile bị tràn ngang (Overflow-X)!"
        
        # Chụp ảnh minh chứng Mobile
        mobile_screenshot = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_student_cards_mobile.png"
        page_mobile.screenshot(path=mobile_screenshot, full_page=False)
        print(f"📸 Đã lưu ảnh Mobile: {mobile_screenshot}")
        context_mobile.close()
        
        browser.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ PLAYWRIGHT E2E ĐÃ ĐẠT 100% PASS!")

if __name__ == "__main__":
    run_student_cards_e2e_test()
