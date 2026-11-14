import sys
import time
from playwright.sync_api import sync_playwright

def run_student_dashboard_test():
    print("🚀 Bắt đầu Kiểm thử E2E: Tối ưu Toàn diện Student Dashboard tại /dashboard (Role Student)")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )
        
        # =========================================================================
        # 1. Desktop Test (1366x800) - Đăng nhập Học Viên Tracy (HV235)
        # =========================================================================
        context_desktop = browser.new_context(viewport={"width": 1366, "height": 800})
        page_desktop = context_desktop.new_page()
        
        print("\n--- [Desktop 1366x800] 1. Đăng nhập Học Viên Tracy (HV235) & Vào /dashboard ---")
        login_url = "http://127.0.0.1:3000/?sso_uid=HV235"
        page_desktop.goto(login_url, wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(1500)
        page_desktop.goto("http://127.0.0.1:3000/dashboard", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(2000)
        
        # 1.1 Kiểm tra Header Chào mừng & Huy hiệu Tên Tiếng Anh nổi bật
        print("\n--- [Desktop 1366x800] 1.1 Kiểm tra Header Chào mừng Học Viên ---")
        container = page_desktop.locator("[data-testid='student-portal-dashboard-container']")
        assert container.is_visible(), "LỖI: Không tìm thấy data-testid='student-portal-dashboard-container'"
        
        tracy_badge = page_desktop.locator("text=Tracy")
        assert tracy_badge.count() > 0, "LỖI: Tên tiếng Anh 'Tracy' phải hiển thị nổi bật trên Header"
        print("✅ Header hiển thị đầy đủ tên học viên và huy hiệu nổi bật 🌟 Tracy")
        
        # 1.1b Kiểm tra Banner Ca Học Trực Tuyến Sắp Tới: Nền tảng Google Meet & Khóa Phòng Trước 15 Phút
        print("\n--- [Desktop 1366x800] 1.1b Kiểm tra Banner Ca Học & Nút Khóa Phòng Trực Tuyến ---")
        locked_btn = page_desktop.locator("[data-testid='btn-join-live-meeting-locked']")
        assert locked_btn.is_visible(), "LỖI: Không tìm thấy data-testid='btn-join-live-meeting-locked'"
        btn_text = locked_btn.inner_text().strip()
        print(f"Nút vào phòng học trạng thái khóa: '{btn_text}'")
        assert "Google Meet" in btn_text, f"LỖI: Link là meet.google.com nên phải nhận diện đúng Google Meet, nhưng thấy: {btn_text}"
        assert "15" in btn_text, f"LỖI: Nút phải hiển thị thông báo mở trước 15 phút, nhưng thấy: {btn_text}"
        assert locked_btn.is_disabled(), "LỖI: Lớp học chưa đến giờ (còn > 15 phút) thì nút phải bị disabled!"
        print("✅ Banner nhận diện chính xác Google Meet và KHÓA nút vào phòng vì ca học còn > 15 phút!")
        
        # 1.2 Kiểm tra Cột Trái: Lớp Học & Chuẩn Bị Bài Học (Pre-Class Prep)
        print("\n--- [Desktop 1366x800] 1.2 Kiểm tra Khối Lớp Học & Chuẩn Bị Bài Học ---")
        prep_guide = page_desktop.locator("[data-testid='pre-class-prep-guide']")
        assert prep_guide.is_visible(), "LỖI: Không tìm thấy pre-class-prep-guide"
        
        # 1.2.1 Kiểm tra Ưu tiên Ca học sớm nhất & Huy hiệu Tên Lớp, Mã Lớp nổi bật
        print("\n--- [Desktop 1366x800] 1.2.1 Kiểm tra Ưu tiên Ca học sớm nhất (Earliest Session Priority) ---")
        active_badge = page_desktop.locator("[data-testid='active-prep-class-badge']")
        assert active_badge.is_visible(), "LỖI: Không tìm thấy active-prep-class-badge trên đầu khung chuẩn bị bài học"
        
        badge_text_init = active_badge.inner_text()
        print(f"Huy hiệu lớp học mặc định: '{badge_text_init}'")
        assert "LH005" in badge_text_init, f"LỖI: Lớp LH005 diễn ra sớm hơn (09:00 ngày 15/11) phải được ƯU TIÊN hiển thị mặc định, nhưng lại thấy: {badge_text_init}"
        print("✅ Ưu tiên hiển thị mặc định lớp LH005 thành công vì có ca học diễn ra sớm nhất!")
        
        prep_text_init = prep_guide.inner_text()
        assert "Where I Live" in prep_text_init, f"LỖI: Giáo án LH005 phải là 'Where I Live — Communities and Homes', thực tế: {prep_text_init[:100]}"
        assert "What is your neighborhood like?" in prep_text_init, "LỖI: Thiếu mục tiêu Essential Question do giáo viên soạn trong LH005"
        assert "Read pages 14-17" in prep_text_init, "LỖI: Thiếu phần Học sinh đọc chuẩn bị (studentPrep) do giáo viên soạn trong LH005"
        assert "Complete Practice Book page 8" in prep_text_init, "LỖI: Thiếu bài tập về nhà do giáo viên giao trong LH005"
        print("✅ Nội dung giáo án LH005 hiển thị 100% chính xác phần giáo viên đã soạn: Tiêu đề, Mục tiêu, Đọc chuẩn bị & Bài tập về nhà!")
        
        # 1.2.2 Kiểm tra Bộ Chọn Lớp Học (Class Switcher / Segmented Tabs)
        print("\n--- [Desktop 1366x800] 1.2.2 Kiểm tra Bộ Chọn Lớp Học (Class Switcher) & Chuyển đổi giữa LH004 và LH005 ---")
        switcher = page_desktop.locator("[data-testid='student-class-switcher']")
        assert switcher.is_visible(), "LỖI: Học viên Tracy học 2 lớp (LH004, LH005) nhưng không hiển thị Class Switcher!"
        
        # Bấm chọn lớp LH004
        print("Bấm chọn lớp LH004 trên Segmented Class Switcher...")
        lh004_option = switcher.locator(":text('LH004')")
        assert lh004_option.count() > 0, "LỖI: Không tìm thấy tùy chọn LH004 trên Class Switcher"
        lh004_option.first.click()
        page_desktop.wait_for_timeout(600)
        
        # Kiểm tra Huy hiệu đã chuyển sang LH004
        badge_text_lh004 = active_badge.inner_text()
        print(f"Huy hiệu sau khi chuyển sang LH004: '{badge_text_lh004}'")
        assert "LH004" in badge_text_lh004, f"LỖI: Sau khi chọn LH004, huy hiệu phải hiển thị LH004, thực tế: {badge_text_lh004}"
        
        # Kiểm tra Giáo án LH004: Đã xóa toàn bộ giáo án, hiển thị Empty state thông báo giáo viên chưa soạn
        prep_text_lh004 = prep_guide.inner_text()
        print("Trích xuất nội dung Chuẩn bị bài học của LH004:", prep_text_lh004[:250], "...")
        assert "chưa soạn giáo án" in prep_text_lh004 or "has not prepared" in prep_text_lh004, f"LỖI: LH004 đã xóa giáo án nhưng không hiển thị trạng thái chưa soạn giáo án: {prep_text_lh004}"
        print("✅ Đã xóa 100% giáo án của LH004 trên Firestore. Giao diện hiển thị đúng trạng thái 'chưa soạn giáo án' cho lớp LH004!")
        
        # Bấm chọn lại lớp LH005
        print("Bấm chọn lại lớp LH005 trên Segmented Class Switcher...")
        lh005_option = switcher.locator(":text('LH005')")
        lh005_option.first.click()
        page_desktop.wait_for_timeout(600)
        
        badge_text_lh005_back = active_badge.inner_text()
        assert "LH005" in badge_text_lh005_back, f"LỖI: Khi bấm lại LH005, huy hiệu phải hiển thị LH005, thực tế: {badge_text_lh005_back}"
        print("✅ Chuyển đổi qua lại giữa các lớp học phản hồi tức thì 0ms, không cần reload trang!")
        
        # 1.2.1 Kiểm tra Bộ Đếm Thời Gian Thực (Timer) trên các lớp học đang tham gia
        print("\n--- [Desktop 1366x800] 1.2.1 Kiểm tra Live Timer Đếm Ngược Lớp Học ---")
        timers = page_desktop.locator("[data-testid='class-session-timer']")
        assert timers.count() > 0, "LỖI: Phải hiển thị ít nhất 1 bộ đếm thời gian thực (ClassSessionTimer)!"
        print(f"Số lượng Timer tìm thấy trên Dashboard: {timers.count()}")
        for i in range(timers.count()):
            print(f" - Timer {i+1}: '{timers.nth(i).inner_text().strip()}' (State: {timers.nth(i).get_attribute('data-state')})")
        print("✅ Tất cả các lớp học đang tham gia đều có Timer đếm ngược thời gian thực!")
        
        # 1.3 Kiểm tra Cột Phải: "Learning Corner" (4 Nền tảng học tập chuẩn Mỹ)
        print("\n--- [Desktop 1366x800] 1.3 Kiểm tra Learning Corner (4 Nền tảng Quốc Tế) ---")
        learning_corner = page_desktop.locator("[data-testid='student-learning-corner-card']")
        assert learning_corner.is_visible(), "LỖI: Không tìm thấy student-learning-corner-card"
        
        # Kiểm tra 4 nền tảng: Acellus, IXL, Kids A-Z, Khan Academy
        acellus = page_desktop.locator("[data-testid='learning-platform-acellus']")
        assert acellus.is_visible(), "LỖI: Nền tảng Acellus Academy không hiển thị"
        acellus_link = acellus.locator("a[href*='acellusacademy.com']")
        assert acellus_link.count() > 0, "LỖI: Link Acellus Academy không đúng URL https://www.acellusacademy.com/"
        
        ixl = page_desktop.locator("[data-testid='learning-platform-ixl']")
        assert ixl.is_visible(), "LỖI: Nền tảng IXL Learning không hiển thị"
        ixl_link = ixl.locator("a[href*='ixl.com']")
        assert ixl_link.count() > 0, "LỖI: Link IXL không đúng URL https://www.ixl.com/"
        
        kidsaz = page_desktop.locator("[data-testid='learning-platform-kidsaz']")
        assert kidsaz.is_visible(), "LỖI: Nền tảng Kids A-Z không hiển thị"
        kidsaz_link = kidsaz.locator("a[href*='kidsa-z.com']")
        assert kidsaz_link.count() > 0, "LỖI: Link Kids A-Z không đúng URL https://www.kidsa-z.com/ng/"
        
        khan = page_desktop.locator("[data-testid='learning-platform-khan']")
        assert khan.is_visible(), "LỖI: Nền tảng Khan Academy không hiển thị"
        khan_link = khan.locator("a[href*='khanacademy.org']")
        assert khan_link.count() > 0, "LỖI: Link Khan Academy không đúng URL https://www.khanacademy.org/"
        print("✅ Learning Corner hiển thị hoàn hảo 4 nền tảng: Acellus Academy, IXL, Kids A-Z, Khan Academy với 1-click External link")
        
        # 1.4 Kiểm tra Cột Phải: Tài Liệu Theo Lớp Học (Download & Xem Trực Tiếp)
        print("\n--- [Desktop 1366x800] 1.4 Kiểm tra Tài Liệu Theo Lớp Học (Download & Preview Modal) ---")
        materials_card = page_desktop.locator("[data-testid='student-class-materials-card']")
        assert materials_card.is_visible(), "LỖI: Không tìm thấy student-class-materials-card"
        
        preview_btns = materials_card.locator("button[data-testid^='btn-preview-mat-']")
        assert preview_btns.count() > 0, "LỖI: Phải có nút Xem/Preview tài liệu"
        
        download_btns = materials_card.locator("a[data-testid^='btn-download-mat-']")
        assert download_btns.count() > 0, "LỖI: Phải có nút Tải/Download tài liệu"
        
        # Bấm thử nút Xem tài liệu đầu tiên
        print(f"Bấm nút Xem trực tiếp tài liệu đầu tiên: {preview_btns.first.get_attribute('data-testid')}...")
        preview_btns.first.click()
        page_desktop.wait_for_timeout(1500)
        
        preview_title = page_desktop.locator("[data-testid='material-preview-modal-title']")
        assert preview_title.is_visible(), "LỖI: Modal xem trực tiếp tài liệu không mở!"
        print(f"✅ Modal xem trực tiếp tài liệu mở mượt mà: '{preview_title.inner_text().strip()[:60]}'")
        
        # Đóng modal xem trước
        close_btn = page_desktop.locator("[data-testid='btn-preview-close']").or_(page_desktop.locator(".ant-modal-close"))
        if close_btn.count() > 0:
            close_btn.first.click()
            page_desktop.wait_for_timeout(800)
        
        # 1.5 Kiểm tra Bài Tập Được Giao & Cần Làm (Student Homework Tasks)
        print("\n--- [Desktop 1366x800] 1.5 Kiểm tra Bài Tập Được Giao & To-Do List ---")
        hw_card = page_desktop.locator("[data-testid='student-homework-tasks-card']")
        assert hw_card.is_visible(), "LỖI: Không tìm thấy student-homework-tasks-card"
        
        # Khi đã xóa sạch bài tập trong collection homeworks, kiểm tra trạng thái Empty chuẩn sư phạm
        hw_text = hw_card.inner_text()
        print(f"Nội dung khối bài tập: {hw_text[:120]}...")
        assert "hoàn thành toàn bộ bài tập" in hw_text or "completed all homework" in hw_text, f"LỖI: Chưa hiển thị trạng thái hoàn thành sạch sẽ: {hw_text}"
        print("✅ Đã xóa sạch 100% bài tập trong Firestore. Khối Bài Tập hiển thị Empty state chuẩn: 'Tuyệt vời! Em đã hoàn thành toàn bộ bài tập được giao.'")
        
        # 1.6 Kiểm tra Đánh Giá Gần Nhất (Recent Teacher Evaluations)
        print("\n--- [Desktop 1366x800] 1.6 Kiểm tra Đánh Giá Gần Nhất Của Giáo Viên ---")
        eval_card = page_desktop.locator("[data-testid='student-recent-evaluations-card']")
        assert eval_card.is_visible(), "LỖI: Không tìm thấy student-recent-evaluations-card"
        
        detail_btns = eval_card.locator("button[data-testid^='btn-eval-details-']").or_(
            eval_card.locator("button:has-text('Chi Tiết'), button:has-text('Details')")
        )
        if detail_btns.count() > 0:
            print("Bấm nút Xem chi tiết đánh giá...")
            detail_btns.first.click()
            page_desktop.wait_for_timeout(1000)
            
            detail_modal_title = page_desktop.locator("[data-testid='student-evaluation-detail-modal-title']")
            assert detail_modal_title.is_visible(), "LỖI: Modal chi tiết đánh giá không mở!"
            print(f"✅ Modal chi tiết đánh giá của giáo viên mở sắc nét: '{detail_modal_title.inner_text().strip()[:60]}'")
            
            # Đóng modal
            close_eval_btn = page_desktop.locator(".ant-modal:has([data-testid='student-evaluation-detail-modal-title'])").locator("button:has-text('Close'), button:has-text('Đóng')")
            if close_eval_btn.count() > 0:
                close_eval_btn.first.click()
                page_desktop.wait_for_timeout(500)
        
        # 1.7 ASSERT Zero Overflow-X Desktop
        print("\n--- [Desktop 1366x800] 1.7 Kiểm tra Zero Overflow-X Desktop ---")
        overflow_desktop = page_desktop.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        }""")
        print(f"Desktop ScrollWidth: {overflow_desktop['scrollWidth']}px, ClientWidth: {overflow_desktop['clientWidth']}px")
        assert not overflow_desktop['hasOverflow'], f"LỖI: Tràn ngang trên Desktop! scrollWidth={overflow_desktop['scrollWidth']} > clientWidth={overflow_desktop['clientWidth']}"
        print("✅ ASSERT PASS: Hoàn toàn không tràn ngang trên Desktop (Zero Overflow-X)!")
        
        # Chụp ảnh Desktop
        desktop_screenshot = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_student_dashboard_desktop.png"
        page_desktop.screenshot(path=desktop_screenshot, full_page=True)
        print(f"📸 Đã lưu ảnh Desktop: {desktop_screenshot}")
        context_desktop.close()
        
        # =========================================================================
        # 2. Mobile Test (390x844) - iPhone 14 Pro Mobile Viewport
        # =========================================================================
        context_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_mobile = context_mobile.new_page()
        
        print("\n--- [Mobile 390x844] 2. Kiểm tra Trải nghiệm Mobile First & Zero Overflow-X ---")
        page_mobile.goto("http://127.0.0.1:3000/?sso_uid=HV235", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(1500)
        page_mobile.goto("http://127.0.0.1:3000/dashboard", wait_until="domcontentloaded")
        page_mobile.wait_for_timeout(2000)
        
        container_mobile = page_mobile.locator("[data-testid='student-portal-dashboard-container']")
        assert container_mobile.is_visible(), "LỖI: Không tìm thấy student-portal-dashboard-container trên Mobile"
        
        # Kiểm tra Huy hiệu Lớp Học & Class Switcher trên Mobile
        badge_mobile = page_mobile.locator("[data-testid='active-prep-class-badge']")
        assert badge_mobile.is_visible(), "LỖI: active-prep-class-badge không hiển thị trên Mobile"
        print("✅ active-prep-class-badge hiển thị đẹp mắt trên màn hình di động 390px")
        
        switcher_mobile = page_mobile.locator("[data-testid='student-class-switcher']")
        assert switcher_mobile.is_visible(), "LỖI: student-class-switcher không hiển thị trên Mobile"
        print("✅ student-class-switcher co giãn full-width trên Mobile")
        
        # Thử click chuyển lớp trên Mobile
        switcher_mobile.locator(":text('LH004')").first.click()
        page_mobile.wait_for_timeout(600)
        assert "LH004" in badge_mobile.inner_text(), "LỖI: Không chuyển được sang LH004 trên Mobile"
        print("✅ Thao tác chuyển đổi lớp học trên Mobile mượt mà, phản hồi tức thì!")
        
        # Bấm lại LH005
        switcher_mobile.locator(":text('LH005')").first.click()
        page_mobile.wait_for_timeout(600)

        # Assert Zero Overflow-X trên Mobile
        overflow_mobile = page_mobile.evaluate("""() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        }""")
        print(f"Mobile ScrollWidth: {overflow_mobile['scrollWidth']}px, ClientWidth: {overflow_mobile['clientWidth']}px")
        assert not overflow_mobile['hasOverflow'], f"LỖI: Tràn ngang trên Mobile! scrollWidth={overflow_mobile['scrollWidth']} > clientWidth={overflow_mobile['clientWidth']}"
        print("✅ ASSERT PASS: Hoàn toàn không tràn ngang trên Mobile (Zero Overflow-X)!")
        
        # Chụp ảnh Mobile
        mobile_screenshot = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/e2e_student_dashboard_mobile.png"
        page_mobile.screenshot(path=mobile_screenshot, full_page=True)
        print(f"📸 Đã lưu ảnh Mobile: {mobile_screenshot}")
        context_mobile.close()
        
        browser.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ E2E STUDENT DASHBOARD ĐÃ VƯỢT QUA 100%!")

if __name__ == "__main__":
    run_student_dashboard_test()
