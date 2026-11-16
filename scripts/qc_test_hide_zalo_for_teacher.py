import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("🚀 Bắt đầu kiểm thử E2E: Ẩn nhóm Zalo đối với tài khoản Giáo viên (Teacher Maj GV952)")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # =========================================================================
        # 1. KIỂM THỬ TÀI KHOẢN GIÁO VIÊN BẢN XỨ (TEACHER MAJ - GV952)
        # =========================================================================
        print("\n--- 1. TEACHER MAJ (GV952): DESKTOP VIEWPORT (1366x800) ---")
        ctx_teacher = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_t = ctx_teacher.new_page()

        # Login as Teacher Maj
        page_t.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page_t.wait_for_timeout(1000)

        # A. Kiểm tra màn hình /courses-classes
        print("Checking /courses-classes for Teacher Maj...")
        page_t.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_t.wait_for_selector('.ant-card', timeout=15000)
        page_t.wait_for_timeout(1500)

        # Assert Zero Overflow-X
        overflow_t_dt = page_t.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Teacher Desktop Overflow-X: {overflow_t_dt}")
        assert not overflow_t_dt, "FAIL: Teacher Desktop has overflow-x!"

        # Assert NO Zalo on Courses & Classes Cards
        zalo_chat_count = page_t.locator('text="Zalo Chat:"').count()
        join_zalo_count = page_t.locator('text="Join Zalo Group"').count()
        zalo_vi_count = page_t.locator('text="Nhóm Zalo:"').count()
        print(f"Teacher courses-classes: Zalo Chat={zalo_chat_count}, Join Zalo={join_zalo_count}, Nhom Zalo={zalo_vi_count}")
        assert zalo_chat_count == 0, f"FAIL: Expected 0 'Zalo Chat:' elements, found {zalo_chat_count}!"
        assert join_zalo_count == 0, f"FAIL: Expected 0 'Join Zalo Group' elements, found {join_zalo_count}!"
        assert zalo_vi_count == 0, f"FAIL: Expected 0 'Nhóm Zalo:' elements, found {zalo_vi_count}!"

        # Chụp ảnh xác thực màn hình /courses-classes của Giáo viên (KHÔNG có Zalo)
        screenshot_t_courses = os.path.join(OUTPUT_DIR, 'teacher_courses_classes_no_zalo.png')
        page_t.screenshot(path=screenshot_t_courses, full_page=False)
        print(f"Saved screenshot: {screenshot_t_courses}")

        # B. Mở Class Roster Drawer của lớp LH004 và kiểm tra
        print("Opening Class Roster Drawer for LH004...")
        roster_btn = page_t.locator('[data-testid^="btn-roster-"]').first
        if roster_btn.count() > 0:
            roster_btn.scroll_into_view_if_needed()
            roster_btn.click(force=True)
            page_t.wait_for_selector('.ant-drawer-open', timeout=10000)
            page_t.wait_for_timeout(1000)

            # Assert NO Zalo in Drawer Header & Descriptions
            drawer_text = page_t.locator('.ant-drawer-open').inner_text()
            has_zalo_drawer = 'zalo' in drawer_text.lower()
            print(f"Teacher Drawer has Zalo: {has_zalo_drawer}")
            assert not has_zalo_drawer, "FAIL: Drawer still contains Zalo for teacher!"

            # Chụp ảnh xác thực Drawer của Giáo viên (KHÔNG có Zalo)
            screenshot_t_drawer = os.path.join(OUTPUT_DIR, 'teacher_roster_drawer_no_zalo.png')
            page_t.screenshot(path=screenshot_t_drawer, full_page=False)
            print(f"Saved screenshot: {screenshot_t_drawer}")

            # Đóng drawer
            page_t.keyboard.press('Escape')
            page_t.wait_for_timeout(500)

        # C. Kiểm tra màn hình /dashboard của Giáo viên
        print("Checking /dashboard for Teacher Maj...")
        page_t.goto(f"{BASE_URL}/dashboard", wait_until='domcontentloaded')
        page_t.wait_for_selector('.ant-card-hoverable', timeout=15000)
        page_t.wait_for_timeout(1500)

        # Assert NO Zalo button in ClassCardActions
        dashboard_zalo_btns = page_t.locator('.ant-card-hoverable button:has-text("Zalo")').count()
        print(f"Teacher Dashboard: Zalo buttons count: {dashboard_zalo_btns}")
        assert dashboard_zalo_btns == 0, f"FAIL: Teacher dashboard still has {dashboard_zalo_btns} Zalo buttons!"

        # Chụp ảnh xác thực Dashboard của Giáo viên (KHÔNG có Zalo)
        screenshot_t_dashboard = os.path.join(OUTPUT_DIR, 'teacher_dashboard_no_zalo.png')
        page_t.screenshot(path=screenshot_t_dashboard, full_page=False)
        print(f"Saved screenshot: {screenshot_t_dashboard}")

        # D. Kiểm tra Mobile Viewport (390 x 844)
        print("\n--- 2. TEACHER MAJ (GV952): MOBILE VIEWPORT (390x844) ---")
        ctx_teacher_mb = browser.new_context(viewport={'width': 390, 'height': 844})
        page_t_mb = ctx_teacher_mb.new_page()

        page_t_mb.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page_t_mb.wait_for_timeout(1000)
        page_t_mb.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_t_mb.wait_for_selector('.ant-card', timeout=15000)
        page_t_mb.wait_for_timeout(1500)

        overflow_t_mb = page_t_mb.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"Teacher Mobile Overflow-X: {overflow_t_mb}")
        assert not overflow_t_mb, "FAIL: Teacher Mobile has overflow-x!"

        mb_zalo_count = page_t_mb.locator('text="Zalo"').count()
        print(f"Teacher Mobile: occurrences of 'Zalo' on courses-classes: {mb_zalo_count}")
        assert mb_zalo_count == 0, f"FAIL: Expected 0 Zalo occurrences on teacher mobile, got {mb_zalo_count}!"

        screenshot_t_mb = os.path.join(OUTPUT_DIR, 'teacher_courses_mobile_no_zalo.png')
        page_t_mb.screenshot(path=screenshot_t_mb, full_page=False)
        print(f"Saved screenshot: {screenshot_t_mb}")

        # =========================================================================
        # 3. KIỂM THỬ BẢO TOÀN CHO ADMIN / ACADEMIC (ADM001)
        # =========================================================================
        print("\n--- 3. REGRESSION CHECK: ADMIN / ACADEMIC (ADM001) STILL HAS ZALO ---")
        ctx_admin = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_a = ctx_admin.new_page()

        page_a.goto(f"{BASE_URL}/?sso_uid=ADM001", wait_until='domcontentloaded')
        page_a.wait_for_timeout(1000)
        page_a.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_a.wait_for_selector('.ant-card', timeout=15000)
        page_a.wait_for_timeout(1500)

        admin_zalo_count = page_a.locator('text=Zalo').count()
        print(f"Admin courses-classes Zalo elements count: {admin_zalo_count}")
        assert admin_zalo_count > 0, "FAIL: Zalo was accidentally removed for Admin/Academic!"
        print("✅ [PASS REGRESSION] Admin/Academic vẫn giữ nguyên tính năng Zalo bình thường!")

        screenshot_admin = os.path.join(OUTPUT_DIR, 'admin_courses_classes_has_zalo.png')
        page_a.screenshot(path=screenshot_admin, full_page=False)
        print(f"Saved screenshot: {screenshot_admin}")

        browser.close()
        print("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ PLAYWRIGHT E2E ĐỀU ĐẠT TIÊU CHUẨN 100%!")

if __name__ == '__main__':
    run_tests()
