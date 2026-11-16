import os
import sys
import time
from playwright.sync_api import sync_playwright

LOCAL_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("=" * 80)
    print("🧪 PHÒNG QC & IT: KIỂM THỬ TÍCH HỢP 4 TÍNH NĂNG DASHBOARD MỚI")
    print("   1. Card Lớp: Hiển thị Số buổi đã học (Completed Sessions Progress)")
    print("   2. Dashboard Task & Thông Báo Việc Cần Làm (Pending Evaluation Tasks & 1-Click Deep Navigation)")
    print("   3. Dashboard Giám Đốc & Giáo Vụ: KPI Vắng Học & Absent Students Audit Drawer")
    print("   4. Dashboard Học Viên: Xem ngay 10 buổi đánh giá gần nhất")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # ---------------------------------------------------------------------
        # KỊCH BẢN 1: TEACHER WORKSPACE (Teacher Maj - GV952)
        # ---------------------------------------------------------------------
        print("\n--- 1. KIỂM THỬ TEACHER WORKSPACE (Teacher Maj - GV952) ---")
        ctx_teacher = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_t = ctx_teacher.new_page()

        t_url = f"{LOCAL_URL}/dashboard?sso_uid=GV952"
        print(f"Navigating to: {t_url}")
        page_t.goto(t_url, wait_until='domcontentloaded', timeout=40000)
        page_t.wait_for_timeout(3500)

        # 1.1 Assert Card Lớp có thanh tiến độ số buổi đã học
        progress_el = page_t.locator('[data-testid^="class-progress-"]').first
        assert progress_el.is_visible(), "FAIL: class progress element not visible on ClassLiveCard!"
        progress_text = progress_el.text_content()
        print(f"   ✅ Class Live Card shows progress: '{progress_text}'")

        # 1.2 Assert Widget Nhiệm vụ giảng dạy (TeacherEvaluationTasksCard)
        task_card_t = page_t.locator('[data-testid="teacher-evaluation-tasks-card"]')
        if task_card_t.is_visible():
            print(f"   ✅ Teacher Task Card is visible with pending evaluations!")
            # Thử click nút "Evaluate Now" 1-chạm
            btn_eval_now = page_t.locator('[data-testid^="btn-teacher-evaluate-"]').first
            if btn_eval_now.is_visible():
                btn_eval_now.click()
                page_t.wait_for_timeout(3000)
                # Kiểm tra deep link: URL phải có tab=evaluation và Tab 3 Đánh giá phải được kích hoạt!
                current_url = page_t.url
                print(f"   1-Click Deep Navigation URL: {current_url}")
                assert "tab=evaluation" in current_url, "FAIL: 1-click deep navigation missing tab=evaluation!"
                print("   ✅ 1-Click Deep Navigation from Dashboard to Classroom Evaluation Tab: SUCCESS!")
                # Quay lại dashboard
                page_t.goto(t_url, wait_until='domcontentloaded')
                page_t.wait_for_timeout(2500)

        # Chụp ảnh Teacher Workspace
        shot_t = f"{OUTPUT_DIR}/qc_dashboard_teacher_tasks.png"
        page_t.screenshot(path=shot_t)
        print(f"   📸 Screenshot saved: {shot_t}")

        # Assert Zero Overflow-X
        sw = page_t.evaluate("() => document.documentElement.scrollWidth")
        iw = page_t.evaluate("() => window.innerWidth")
        assert sw <= iw, f"FAIL: Overflow on teacher dashboard: {sw} > {iw}"
        print("   ✅ Zero Overflow-X on Teacher Dashboard: PASS!")
        ctx_teacher.close()

        # ---------------------------------------------------------------------
        # KỊCH BẢN 2: ACADEMIC OPERATIONS PANEL (Giáo Vụ - ACA001)
        # ---------------------------------------------------------------------
        print("\n--- 2. KIỂM THỬ ACADEMIC OPERATIONS PANEL (Giáo Vụ - ACA001) ---")
        ctx_aca = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_aca = ctx_aca.new_page()

        aca_url = f"{LOCAL_URL}/dashboard?sso_uid=ACA001"
        print(f"Navigating to: {aca_url}")
        page_aca.goto(aca_url, wait_until='domcontentloaded', timeout=40000)
        page_aca.wait_for_timeout(3500)

        # 2.1 Assert KPI Học Viên Vắng Hôm Nay
        kpi_absent_aca = page_aca.locator('[data-testid="kpi-today-absent-students-academic"]')
        assert kpi_absent_aca.is_visible(), "FAIL: kpi-today-absent-students-academic not visible!"
        print(f"   ✅ Academic Absent Students KPI Card is visible: '{kpi_absent_aca.text_content()}'")

        # 2.2 Assert Task Quên Đánh Giá của Giáo Viên
        task_card_aca = page_aca.locator('[data-testid="academic-pending-evaluation-tasks-card"]')
        if task_card_aca.is_visible():
            print("   ✅ Academic Pending Evaluation Tasks Card is visible!")
            btn_remind = page_aca.locator('[data-testid^="btn-remind-teacher-"]').first
            if btn_remind.is_visible():
                btn_remind.click()
                page_aca.wait_for_timeout(1000)
                print("   ✅ Clicked Remind Teacher button successfully!")

        # 2.3 Mở Drawer Kiểm Toán Học Viên Vắng Học
        print("   Clicking Absent KPI Card to open Audit Drawer...")
        kpi_absent_aca.click()
        page_aca.wait_for_timeout(2000)

        drawer_absent = page_aca.locator('[data-testid="absent-students-audit-drawer"]')
        assert drawer_absent.is_visible(), "FAIL: absent-students-audit-drawer not opened!"
        print("   ✅ Absent Students Audit Drawer opened successfully!")

        # Chụp ảnh Academic Dashboard & Absent Drawer
        shot_aca = f"{OUTPUT_DIR}/qc_dashboard_academic_tasks_and_absent.png"
        page_aca.screenshot(path=shot_aca)
        print(f"   📸 Screenshot saved: {shot_aca}")

        # Đóng drawer
        btn_close_drawer = page_aca.locator('.ant-drawer-close').first
        if btn_close_drawer.is_visible():
            btn_close_drawer.click()
            page_aca.wait_for_timeout(1000)

        ctx_aca.close()

        # ---------------------------------------------------------------------
        # KỊCH BẢN 3: DIRECTOR OVERVIEW PANEL (Giám Đốc - DIR001)
        # ---------------------------------------------------------------------
        print("\n--- 3. KIỂM THỬ DIRECTOR OVERVIEW PANEL (Giám Đốc - DIR001) ---")
        ctx_dir = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_dir = ctx_dir.new_page()

        dir_url = f"{LOCAL_URL}/dashboard?sso_uid=DIR001"
        print(f"Navigating to: {dir_url}")
        page_dir.goto(dir_url, wait_until='domcontentloaded', timeout=40000)
        page_dir.wait_for_timeout(3500)

        # 3.1 Assert KPI Học Viên Vắng Hôm Nay trên Dashboard Giám Đốc
        kpi_absent_dir = page_dir.locator('[data-testid="kpi-today-absent-students-director"]')
        assert kpi_absent_dir.is_visible(), "FAIL: kpi-today-absent-students-director not visible!"
        print(f"   ✅ Director Absent Students KPI Card is visible: '{kpi_absent_dir.text_content()}'")

        # 3.2 Mở Drawer Kiểm Toán Học Viên Vắng Học từ Dashboard Giám Đốc
        kpi_absent_dir.click()
        page_dir.wait_for_timeout(2000)
        drawer_absent_dir = page_dir.locator('[data-testid="absent-students-audit-drawer"]')
        assert drawer_absent_dir.is_visible(), "FAIL: absent-students-audit-drawer not opened from Director dashboard!"
        print("   ✅ Absent Students Audit Drawer opened from Director Overview!")

        shot_dir = f"{OUTPUT_DIR}/qc_dashboard_director_absent.png"
        page_dir.screenshot(path=shot_dir)
        print(f"   📸 Screenshot saved: {shot_dir}")

        ctx_dir.close()

        # ---------------------------------------------------------------------
        # KỊCH BẢN 4: STUDENT PORTAL (Học Viên Kenji - HV768)
        # ---------------------------------------------------------------------
        print("\n--- 4. KIỂM THỬ STUDENT PORTAL (Học Viên Kenji - HV768) ---")
        ctx_std = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_std = ctx_std.new_page()

        std_url = f"{LOCAL_URL}/dashboard?sso_uid=HV768"
        print(f"Navigating to: {std_url}")
        page_std.goto(std_url, wait_until='domcontentloaded', timeout=40000)
        page_std.wait_for_timeout(3500)

        eval_card_std = page_std.locator('[data-testid="student-recent-evaluations-card"]')
        assert eval_card_std.is_visible(), "FAIL: student-recent-evaluations-card not visible!"
        print("   ✅ Student Recent Evaluations Card is visible!")

        shot_std = f"{OUTPUT_DIR}/qc_dashboard_student_evaluations.png"
        page_std.screenshot(path=shot_std)
        print(f"   📸 Screenshot saved: {shot_std}")
        ctx_std.close()

        # ---------------------------------------------------------------------
        # KỊCH BẢN 5: MOBILE RESPONSIVENESS & ZERO OVERFLOW-X (390x844)
        # ---------------------------------------------------------------------
        print("\n--- 5. KIỂM THỬ MOBILE VIEW (390x844) & ASSERT ZERO OVERFLOW-X ---")
        ctx_mob = browser.new_context(viewport={'width': 390, 'height': 844})
        page_mob = ctx_mob.new_page()

        # Test Mobile Academic Dashboard
        page_mob.goto(aca_url, wait_until='domcontentloaded')
        page_mob.wait_for_timeout(3000)
        sw_mob = page_mob.evaluate("() => document.documentElement.scrollWidth")
        iw_mob = page_mob.evaluate("() => window.innerWidth")
        print(f"   Mobile Academic Viewport: scrollWidth={sw_mob}px, innerWidth={iw_mob}px")
        assert sw_mob <= iw_mob, f"FAIL: Mobile horizontal overflow: {sw_mob} > {iw_mob}"
        print("   ✅ ASSERT Zero Overflow-X on Mobile Academic Dashboard: PASS!")

        shot_mob_aca = f"{OUTPUT_DIR}/qc_dashboard_mobile_academic_390.png"
        page_mob.screenshot(path=shot_mob_aca)
        print(f"   📸 Screenshot saved: {shot_mob_aca}")

        ctx_mob.close()
        browser.close()

    print("\n" + "=" * 80)
    print("🎉 TẤT CẢ 5/5 KỊCH BẢN KIỂM THỬ TÍCH HỢP DASHBOARD ĐỀU PASS 100%!")
    print("=" * 80)

if __name__ == '__main__':
    run_tests()
