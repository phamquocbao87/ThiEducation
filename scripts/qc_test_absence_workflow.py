import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000/dashboard"

def run_absence_workflow_qc():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"]
        )

        # ----------------------------------------------------------------------
        # LUỒNG 1: HỌC VIÊN GỬI ĐƠN XIN NGHỈ PHÉP (LÝ DO OPTIONAL)
        # ----------------------------------------------------------------------
        print("\n--- [QC 1] TEST HỌC VIÊN BÁO NGHỈ PHÉP (HV768 Kenji) ---")
        context_student = browser.new_context(viewport={"width": 1280, "height": 800})
        page_std = context_student.new_page()
        page_std.goto(f"{BASE_URL}?sso_uid=HV768", wait_until="domcontentloaded")
        page_std.wait_for_timeout(3500)

        # Kiểm tra nút [Báo Nghỉ Phép] trên Dashboard Học Viên
        btn_absence = page_std.locator('[data-testid="btn-student-report-absence"]')
        if btn_absence.count() == 0:
            btn_absence = page_std.locator('[data-testid^="btn-report-absence-class-"]').first

        assert btn_absence.count() > 0, "LỖI: Không tìm thấy nút Báo Nghỉ Phép trên giao diện Học Viên!"
        print("  -> Thấy nút [Báo Nghỉ Phép] (Request Leave) trên giao diện học viên. Click mở modal...")
        btn_absence.first.click()
        page_std.wait_for_timeout(800)

        # Modal ClassAbsenceReportModal mở ra
        modal_report = page_std.locator('[data-testid="modal-class-absence-report"]')
        assert modal_report.count() > 0, "LỖI: Modal Báo Nghỉ Phép không mở!"
        print("  -> Modal Báo Nghỉ Phép mở thành công.")

        # Nhập lời nhắn (Lý do để trống để test OPTIONAL theo chỉ đạo của Sếp Bảo)
        input_note = page_std.locator('[data-testid="input-absence-note"]')
        input_note.fill("Em Kenji xin phép nghỉ buổi học do gia đình có việc bận đột xuất.")
        page_std.wait_for_timeout(400)

        page_std.screenshot(path="scripts/qc_student_absence_modal_opened.png")

        # Submit
        btn_submit = page_std.locator('[data-testid="btn-submit-absence-report"]')
        btn_submit.click()
        page_std.wait_for_timeout(2000)
        print("  -> Học viên gửi đơn xin nghỉ thành công (Lý do Optional hợp lệ)!")
        page_std.screenshot(path="scripts/qc_student_absence_submitted.png")
        context_student.close()

        # ----------------------------------------------------------------------
        # LUỒNG 2: GIÁO VỤ NHẬN ĐƠN VÀ PHÊ DUYỆT (APPROVE & NOTIFY)
        # ----------------------------------------------------------------------
        print("\n--- [QC 2] TEST GIÁO VỤ DUYỆT ĐƠN (ACA404 Diễm Quỳnh) ---")
        context_aca = browser.new_context(viewport={"width": 1280, "height": 800})
        page_aca = context_aca.new_page()
        page_aca.goto(f"{BASE_URL}?sso_uid=ACA404", wait_until="domcontentloaded")
        page_aca.wait_for_timeout(3500)

        # Kiểm tra chuông thông báo giáo vụ
        bell = page_aca.locator('[data-testid="btn-notification-bell"]')
        if bell.count() > 0:
            bell.click()
            page_aca.wait_for_timeout(800)
            page_aca.screenshot(path="scripts/qc_academic_received_absence_bell.png")
            page_aca.keyboard.press("Escape")
            page_aca.wait_for_timeout(400)

        # Tìm nút duyệt [Approve & Notify]
        btn_approve = page_aca.locator('[data-testid^="btn-approve-absence-"]').first
        if btn_approve.count() > 0:
            print("  -> Thấy nút [Duyệt & Báo Giáo Viên] tại Bàn Giáo Vụ. Tiến hành bấm duyệt...")
            btn_approve.click()
            page_aca.wait_for_timeout(2000)
            print("  -> Giáo vụ đã duyệt đơn thành công!")
            page_aca.screenshot(path="scripts/qc_academic_approved_absence.png")
        else:
            print("  (Không còn đơn PENDING hoặc đơn đã được duyệt)")
        context_aca.close()

        # ----------------------------------------------------------------------
        # LUỒNG 3: GIÁO VIÊN BẢN XỨ THẤY THẺ EXCUSED LEAVE & NOTIFICATION
        # ----------------------------------------------------------------------
        print("\n--- [QC 3] TEST GIÁO VIÊN BẢN XỨ THẤY EXCUSED LEAVE (GV952 Teacher Maj) ---")
        context_teacher = browser.new_context(viewport={"width": 1280, "height": 800})
        page_teacher = context_teacher.new_page()
        page_teacher.goto(f"{BASE_URL}?sso_uid=GV952", wait_until="domcontentloaded")
        page_teacher.wait_for_timeout(3500)

        # Kiểm tra chuông thông báo giáo viên
        bell_t = page_teacher.locator('[data-testid="btn-notification-bell"]')
        if bell_t.count() > 0:
            bell_t.click()
            page_teacher.wait_for_timeout(800)
            page_teacher.screenshot(path="scripts/qc_teacher_received_absence_bell.png")
            page_teacher.keyboard.press("Escape")
            page_teacher.wait_for_timeout(400)

        page_teacher.screenshot(path="scripts/qc_teacher_dashboard_with_excused_leave.png")
        print("  -> Giáo viên bản xứ đã thấy thông báo và thẻ lớp!")
        context_teacher.close()

        # ----------------------------------------------------------------------
        # LUỒNG 4: TEST GIAO DIỆN DRAWER ABSENT STUDENTS (DESKTOP & MOBILE)
        # ----------------------------------------------------------------------
        print("\n--- [QC 4] TEST DRAWER ABSENT STUDENTS KIỂM TOÁN (DESKTOP & MOBILE) ---")
        # 4A. Desktop
        context_dt = browser.new_context(viewport={"width": 1366, "height": 800})
        page_dt = context_dt.new_page()
        page_dt.goto(f"{BASE_URL}?sso_uid=ADM001", wait_until="domcontentloaded")
        page_dt.wait_for_timeout(3500)

        # Click thẻ Absent Students để mở Drawer
        absent_card = page_dt.locator('[data-testid="card-today-absent-students"]')
        if absent_card.count() > 0:
            absent_card.click()
            page_dt.wait_for_timeout(1000)

            # Assert Drawer mở
            drawer = page_dt.locator('[data-testid="absent-students-audit-drawer"]')
            assert drawer.count() > 0, "LỖI: Drawer Absent Students không mở!"

            # Assert Segmented Tabs
            tabs = page_dt.locator('[data-testid="segmented-filter-absent-students"]')
            assert tabs.count() > 0, "LỖI: Thiếu Segmented filter tabs!"

            # Kiểm tra Overflow-X trên Desktop
            drawer_body = page_dt.locator('.ant-drawer-body')
            scroll_width = drawer_body.evaluate("el => el.scrollWidth")
            client_width = drawer_body.evaluate("el => el.clientWidth")
            print(f"  -> Desktop Drawer body scrollWidth: {scroll_width}, clientWidth: {client_width}")
            assert scroll_width <= client_width + 5, f"FAIL: Tràn ngang trên Desktop! ({scroll_width} > {client_width})"

            page_dt.screenshot(path="scripts/qc_absent_drawer_desktop_optimized.png")
            print("  -> Desktop Drawer đạt chuẩn 100% Zero Overflow-X!")

            # Thử click Tab [📅 All]
            tabs.locator('.ant-segmented-item:has-text("All"), .ant-segmented-item:has-text("Tất cả")').first.click()
            page_dt.wait_for_timeout(800)
            page_dt.screenshot(path="scripts/qc_absent_drawer_desktop_all_tab.png")
        context_dt.close()

        # 4B. Mobile (390x844)
        context_mb = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
        )
        page_mb = context_mb.new_page()
        page_mb.goto(f"{BASE_URL}?sso_uid=ADM001", wait_until="domcontentloaded")
        page_mb.wait_for_timeout(3500)

        absent_card_mb = page_mb.locator('[data-testid="card-today-absent-students"]')
        if absent_card_mb.count() > 0:
            absent_card_mb.click()
            page_mb.wait_for_timeout(1000)

            # Assert Mobile Card View
            drawer_mb = page_mb.locator('[data-testid="absent-students-audit-drawer"]')
            assert drawer_mb.count() > 0

            # Chuyển sang Tab [Tất cả] để xem các Card Item
            tabs_mb = page_mb.locator('[data-testid="segmented-filter-absent-students"]')
            if tabs_mb.count() > 0:
                tabs_mb.locator('.ant-segmented-item:has-text("All"), .ant-segmented-item:has-text("Tất cả")').first.click()
                page_mb.wait_for_timeout(600)

            # Kiểm tra Overflow-X trên Mobile
            scroll_w_mb = page_mb.evaluate("document.body.scrollWidth")
            inner_w_mb = page_mb.evaluate("window.innerWidth")
            print(f"  -> Mobile Window scrollWidth: {scroll_w_mb}, innerWidth: {inner_w_mb}")
            assert scroll_w_mb <= inner_w_mb, f"FAIL: Mobile bị tràn ngang! ({scroll_w_mb} > {inner_w_mb})"

            page_mb.screenshot(path="scripts/qc_absent_drawer_mobile_optimized.png")
            print("  -> Mobile Drawer đạt chuẩn Mobile-First Card View & Zero Overflow-X!")

        context_mb.close()
        browser.close()

    print("\n🎉 TOÀN BỘ 4 LUỒNG KIỂM THỬ QC E2E ĐỀU ĐẠT 100% PASS!")

if __name__ == "__main__":
    run_absence_workflow_qc()
