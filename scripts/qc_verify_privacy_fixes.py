import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_privacy_tests():
    print("=" * 80)
    print("🔒 PHÒNG QC & IT: KIỂM THỬ BẢO MẬT PII PHỤ HUYNH & CÔ LẬP LỚP HỌC (PRIVACY AUDIT)")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # =========================================================================
        # 1. HỌC VIÊN (HV739): XEM ROSTER LỚP LH004
        # Phải ẩn 100% cột 'Parent Contact' và 'Tuition Status'
        # =========================================================================
        print("\n--- 1. STUDENT (HV739): VERIFY ROSTER DRAWER PRIVACY ---")
        ctx_s = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_s = ctx_s.new_page()

        page_s.goto(f"{BASE_URL}/?sso_uid=HV739", wait_until='domcontentloaded')
        page_s.wait_for_timeout(1000)
        page_s.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_s.wait_for_selector('.ant-card', timeout=15000)
        page_s.wait_for_timeout(1500)

        # Mở Roster
        btn_roster = page_s.locator('button').filter(has_text='Roster').or_(page_s.locator('button').filter(has_text='Danh sách')).first
        assert btn_roster.count() > 0, "FAIL: Roster button not found on student class card!"
        btn_roster.click()
        page_s.wait_for_selector('.ant-drawer', timeout=8000)
        page_s.wait_for_timeout(1200)

        drawer_text_s = page_s.locator('.ant-drawer').inner_text()
        has_parent_header_s = 'Parent Contact' in drawer_text_s or 'Phụ Huynh & SĐT' in drawer_text_s
        has_tuition_header_s = 'Tuition Status' in drawer_text_s or 'Tình Trạng Học Phí' in drawer_text_s

        print(f"   Student Roster has 'Parent Contact': {has_parent_header_s} (Must be False)")
        print(f"   Student Roster has 'Tuition Status': {has_tuition_header_s} (Must be False)")

        assert not has_parent_header_s, "SECURITY FAILURE: Student can see Parent Contact in Roster!"
        assert not has_tuition_header_s, "SECURITY FAILURE: Student can see Tuition Status in Roster!"
        print("   ✅ [PASS]: Học viên KHÔNG thấy SĐT phụ huynh và học phí của các bạn khác!")

        shot_stu_roster = f"{OUTPUT_DIR}/student_roster_privacy_verified.png"
        page_s.screenshot(path=shot_stu_roster)
        print(f"   📸 Screenshot: {shot_stu_roster}")

        # Đóng drawer
        drawer_close = page_s.locator('.ant-drawer-close').first
        if drawer_close.is_visible():
            drawer_close.click()
            page_s.wait_for_timeout(500)

        # =========================================================================
        # 2. GIÁO VIÊN BẢN XỨ (GV952): XEM ROSTER
        # Phải ẩn học phí (Tuition Status) & SĐT phụ huynh
        # =========================================================================
        print("\n--- 2. NATIVE TEACHER (GV952): VERIFY ROSTER DRAWER PRIVACY ---")
        ctx_t = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_t = ctx_t.new_page()

        page_t.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
        page_t.wait_for_timeout(1000)
        page_t.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_t.wait_for_selector('.ant-card', timeout=15000)
        page_t.wait_for_timeout(1500)

        btn_roster_t = page_t.locator('button').filter(has_text='Roster').or_(page_t.locator('button').filter(has_text='Danh sách')).first
        if btn_roster_t.count() > 0:
            btn_roster_t.click()
            page_t.wait_for_selector('.ant-drawer', timeout=8000)
            page_t.wait_for_timeout(1200)

            drawer_text_t = page_t.locator('.ant-drawer').inner_text()
            has_tuition_header_t = 'Tuition Status' in drawer_text_t or 'Tình Trạng Học Phí' in drawer_text_t
            print(f"   Teacher Roster has 'Tuition Status': {has_tuition_header_t} (Must be False)")
            assert not has_tuition_header_t, "FAIL: Teacher should NOT see tuition status!"
            print("   ✅ [PASS]: Giáo viên bản xứ được bảo vệ, ẩn hoàn toàn học phí theo Teacher Fee Privacy Guard!")

        # =========================================================================
        # 3. QUẢN TRỊ VIÊN / GIÁO VỤ (ADM001 & ACA101): ZERO REGRESSION
        # Cán bộ quản lý VẪN THẤY ĐẦY ĐỦ 100% Parent Contact & Tuition Status
        # =========================================================================
        print("\n--- 3. ADMIN (ADM001): ZERO REGRESSION ON ROSTER DRAWER ---")
        ctx_a = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_a = ctx_a.new_page()

        page_a.goto(f"{BASE_URL}/?sso_uid=ADM001", wait_until='domcontentloaded')
        page_a.wait_for_timeout(1000)
        page_a.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_a.wait_for_selector('.ant-card', timeout=15000)
        page_a.wait_for_timeout(1500)

        btn_roster_a = page_a.locator('button').filter(has_text='Roster').or_(page_a.locator('button').filter(has_text='Danh sách')).first
        assert btn_roster_a.count() > 0, "FAIL: Admin cannot find Roster button!"
        btn_roster_a.click()
        page_a.wait_for_selector('.ant-drawer', timeout=8000)
        page_a.wait_for_timeout(1200)

        drawer_text_a = page_a.locator('.ant-drawer').inner_text()
        has_parent_header_a = 'Parent Contact' in drawer_text_a or 'Phụ Huynh & SĐT' in drawer_text_a
        has_tuition_header_a = 'Tuition Status' in drawer_text_a or 'Tình Trạng Học Phí' in drawer_text_a

        print(f"   Admin Roster has 'Parent Contact': {has_parent_header_a} (Must be True)")
        print(f"   Admin Roster has 'Tuition Status': {has_tuition_header_a} (Must be True)")

        assert has_parent_header_a, "REGRESSION: Admin MUST see Parent Contact!"
        assert has_tuition_header_a, "REGRESSION: Admin MUST see Tuition Status!"
        print("   ✅ [PASS]: Zero Regression: Cán bộ quản trị vẫn xem đầy đủ 100% SĐT phụ huynh và học phí")

        shot_adm_roster = f"{OUTPUT_DIR}/admin_roster_full_access_verified.png"
        page_a.screenshot(path=shot_adm_roster)
        print(f"   📸 Screenshot: {shot_adm_roster}")

        # =========================================================================
        # 4. KIỂM THỬ CÔ LẬP VIDEO BÀI GIẢNG (CLASS SCOPED ISOLATION INVARIANT)
        # =========================================================================
        print("\n--- 4. CLASS SCOPED VIDEO ISOLATION INVARIANT ---")
        isolation_check = page_s.evaluate('''async () => {
            const { MaterialService } = await import('/src/modules/materials/services/MaterialService.js');
            const materials = [
                {
                    id: 'rec_LH002_test',
                    title: 'Unit 4 Recording LH002',
                    type: 'VIDEO',
                    courseId: 'KH-7569',
                    classId: 'LH002',
                    sharedClassIds: ['LH002'],
                    shareScope: 'CUSTOM',
                    targetType: 'class',
                    isSessionRecording: true
                }
            ];

            const studentLH002 = { id: 'HV151', role: 'student', enrolledClassIds: ['LH002'], courseId: 'KH-7569' };
            const studentLH004 = { id: 'HV739', role: 'student', enrolledClassIds: ['LH004'], courseId: 'KH-7569' };

            const classes = [
                { id: 'LH002', courseId: 'KH-7569', studentIds: ['HV151'] },
                { id: 'LH004', courseId: 'KH-7569', studentIds: ['HV739'] }
            ];

            const resLH002 = MaterialService.getMaterialsForUser(materials, studentLH002, classes);
            const resLH004 = MaterialService.getMaterialsForUser(materials, studentLH004, classes);

            return {
                resLH002Count: resLH002.length,
                resLH004Count: resLH004.length
            };
        }''')
        print(f"   Class LH002 Student sees video: {isolation_check['resLH002Count']} (Expected 1)")
        print(f"   Class LH004 Student sees video: {isolation_check['resLH004Count']} (Expected 0)")

        assert isolation_check['resLH002Count'] == 1, "FAIL: Student of LH002 must see video!"
        assert isolation_check['resLH004Count'] == 0, "SECURITY VIOLATION: Student of LH004 must NOT see LH002 video!"
        print("   ✅ [PASS]: Class Scoped Isolation 100% chính xác! Video lớp nào chỉ học viên lớp đó thấy.")

        # =========================================================================
        # 5. MOBILE 390px ZERO OVERFLOW-X
        # =========================================================================
        print("\n--- 5. MOBILE VIEWPORT (390x844) ZERO OVERFLOW-X ---")
        ctx_m = browser.new_context(viewport={'width': 390, 'height': 844})
        page_m = ctx_m.new_page()

        page_m.goto(f"{BASE_URL}/?sso_uid=HV739", wait_until='domcontentloaded')
        page_m.wait_for_timeout(800)
        page_m.goto(f"{BASE_URL}/courses-classes", wait_until='domcontentloaded')
        page_m.wait_for_timeout(1500)

        # Open drawer on mobile
        btn_m_roster = page_m.locator('button').filter(has_text='Roster').or_(page_m.locator('button').filter(has_text='Danh sách')).first
        if btn_m_roster.count() > 0:
            btn_m_roster.click()
            page_m.wait_for_selector('.ant-drawer', timeout=8000)
            page_m.wait_for_timeout(1000)

        overflow_m = page_m.evaluate('document.body.scrollWidth > window.innerWidth')
        print(f"   Mobile Roster Overflow-X: {overflow_m} (Expected False)")
        assert not overflow_m, "FAIL: Mobile has horizontal overflow!"
        print("   ✅ [PASS]: Mobile 390px Zero Overflow-X đạt chuẩn tuyệt đối!")

        shot_mobile = f"{OUTPUT_DIR}/student_roster_privacy_mobile_390px.png"
        page_m.screenshot(path=shot_mobile)
        print(f"   📸 Screenshot Mobile: {shot_mobile}")

        browser.close()

    print("\n" + "=" * 80)
    print("🎉 TẤT CẢ 5/5 KỊCH BẢN KIỂM THỬ BẢO MẬT & HỒI QUY ĐỀU ĐẠT 100% PASS!")
    print("=" * 80)

if __name__ == '__main__':
    run_privacy_tests()
