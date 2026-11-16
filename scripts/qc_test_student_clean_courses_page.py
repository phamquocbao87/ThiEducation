import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("🚀 Bắt đầu kiểm thử E2E: Tinh gọn giao diện Khóa học & Lớp học đối với Học viên (HV151)")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # =========================================================================
        # 1. HỌC VIÊN (HV151): DESKTOP VIEWPORT (1366x800)
        # =========================================================================
        print("\n--- 1. STUDENT (HV151): DESKTOP VIEWPORT (1366x800) ---")
        ctx_s = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_s = ctx_s.new_page()

        page_s.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page_s.wait_for_timeout(1000)
        page_s.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_s.wait_for_selector('.ant-card', timeout=15000)
        page_s.wait_for_timeout(1500)

        # Assert Zero Overflow-X
        overflow_s_dt = page_s.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Student Desktop Overflow-X: {overflow_s_dt}")
        assert not overflow_s_dt, "FAIL: Student Desktop has overflow-x!"

        # Assert NO Student Management button
        student_mgmt_count = page_s.locator('button:has-text("Student Management"), button:has-text("Quản Lý Học Viên")').count()
        print(f"Student Management button count: {student_mgmt_count}")
        assert student_mgmt_count == 0, f"FAIL: Expected 0 Student Management buttons, found {student_mgmt_count}!"

        # Assert NO 4 KPI Cards (Statistic)
        kpi_count = page_s.locator('.ant-statistic').count()
        print(f"Student KPI Cards count: {kpi_count}")
        assert kpi_count == 0, f"FAIL: Expected 0 KPI cards for student, found {kpi_count}!"

        # Assert Friendly Title
        page_title = page_s.locator('h3').first.inner_text()
        print(f"Student Page Title: '{page_title}'")
        assert "My Classes & Courses" in page_title or "Lớp Học & Khóa Học Của Con" in page_title, f"Unexpected title: {page_title}"

        # Chụp ảnh nghiệm thu Desktop
        ss_student_dt = os.path.join(OUTPUT_DIR, 'student_courses_classes_clean_desktop.png')
        page_s.screenshot(path=ss_student_dt, full_page=False)
        print(f"Saved Desktop screenshot: {ss_student_dt}")

        # =========================================================================
        # 2. HỌC VIÊN (HV151): MOBILE VIEWPORT (390x844)
        # =========================================================================
        print("\n--- 2. STUDENT (HV151): MOBILE VIEWPORT (390x844) ---")
        ctx_s_mb = browser.new_context(viewport={'width': 390, 'height': 844})
        page_s_mb = ctx_s_mb.new_page()

        page_s_mb.goto(f"{BASE_URL}/?sso_uid=HV151", wait_until='domcontentloaded')
        page_s_mb.wait_for_timeout(1000)
        page_s_mb.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_s_mb.wait_for_selector('.ant-card', timeout=15000)
        page_s_mb.wait_for_timeout(1500)

        # Assert Zero Overflow-X
        overflow_s_mb = page_s_mb.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Student Mobile Overflow-X: {overflow_s_mb}")
        assert not overflow_s_mb, "FAIL: Student Mobile has overflow-x!"

        # Assert clean on Mobile
        mb_mgmt_count = page_s_mb.locator('button:has-text("Student Management"), button:has-text("Quản Lý Học Viên")').count()
        mb_kpi_count = page_s_mb.locator('.ant-statistic').count()
        assert mb_mgmt_count == 0, "FAIL: Mobile still has Student Management button!"
        assert mb_kpi_count == 0, "FAIL: Mobile still has KPI cards!"

        # Chụp ảnh nghiệm thu Mobile
        ss_student_mb = os.path.join(OUTPUT_DIR, 'student_courses_classes_clean_mobile.png')
        page_s_mb.screenshot(path=ss_student_mb, full_page=False)
        print(f"Saved Mobile screenshot: {ss_student_mb}")

        # =========================================================================
        # 3. BẢO TOÀN CHO ADMIN (ADM001)
        # =========================================================================
        print("\n--- 3. REGRESSION CHECK: ADMIN (ADM001) STILL HAS MANAGEMENT CONTROLS ---")
        ctx_a = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_a = ctx_a.new_page()

        page_a.goto(f"{BASE_URL}/?sso_uid=ADM001", wait_until='domcontentloaded')
        page_a.wait_for_timeout(1000)
        page_a.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_a.wait_for_selector('.ant-card', timeout=15000)
        page_a.wait_for_timeout(1500)

        admin_mgmt_count = page_a.locator('button:has-text("Student Management"), button:has-text("Quản Lý Học Viên")').count()
        admin_kpi_count = page_a.locator('.ant-statistic').count()
        print(f"Admin controls: Management button={admin_mgmt_count}, KPI cards={admin_kpi_count}")
        assert admin_mgmt_count > 0, "FAIL: Management button was accidentally removed for Admin!"
        assert admin_kpi_count == 4, f"FAIL: Expected 4 KPI cards for Admin, got {admin_kpi_count}!"

        ss_admin = os.path.join(OUTPUT_DIR, 'admin_courses_classes_kpi_preserved.png')
        page_a.screenshot(path=ss_admin, full_page=False)
        print(f"Saved Admin screenshot: {ss_admin}")

        browser.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ PLAYWRIGHT E2E ĐỀU ĐẠT TIÊU CHUẨN 100%!")

if __name__ == '__main__':
    run_tests()
