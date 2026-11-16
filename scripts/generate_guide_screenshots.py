import os
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = '/Volumes/DATA/projects/ThiEducation/public/user-guide/images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

BASE_URL = 'http://127.0.0.1:3000'

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled'],
        )

        # -------------------------------------------------------------
        # 0. LOGIN & GENERAL
        # -------------------------------------------------------------
        print(">>> CAPTURING LOGIN SCREEN...")
        ctx_login = browser.new_context(viewport={'width': 1366, 'height': 800})
        page_login = ctx_login.new_page()
        page_login.goto(f'{BASE_URL}/login', wait_until='domcontentloaded')
        page_login.wait_for_timeout(2000)
        page_login.screenshot(path=f'{OUTPUT_DIR}/01_login_portal.png')
        ctx_login.close()

        # -------------------------------------------------------------
        # 1. STUDENT ROLE (HV151)
        # -------------------------------------------------------------
        print(">>> CAPTURING STUDENT ROLE...")
        ctx_st = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_st.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'HV151');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_st = ctx_st.new_page()

        # Dashboard
        page_st.goto(f'{BASE_URL}/dashboard', wait_until='domcontentloaded')
        page_st.wait_for_timeout(2500)
        page_st.screenshot(path=f'{OUTPUT_DIR}/student_01_dashboard.png')

        # Courses & Classes
        page_st.goto(f'{BASE_URL}/courses-classes', wait_until='domcontentloaded')
        page_st.wait_for_timeout(2500)
        page_st.screenshot(path=f'{OUTPUT_DIR}/student_02_classes.png')

        # Class Roster Drawer
        roster_btn = page_st.locator('button:has-text("Roster"), button:has-text("Danh Sách")').first
        if roster_btn.count() > 0:
            roster_btn.click()
            page_st.wait_for_timeout(1500)
            page_st.screenshot(path=f'{OUTPUT_DIR}/student_03_roster_drawer.png')
            # Close drawer
            close_btn = page_st.locator('.ant-drawer-close').first
            if close_btn.count() > 0:
                close_btn.click()
                page_st.wait_for_timeout(500)

        # Homework / Exercises
        page_st.goto(f'{BASE_URL}/homework', wait_until='domcontentloaded')
        page_st.wait_for_timeout(2500)
        page_st.screenshot(path=f'{OUTPUT_DIR}/student_04_homework.png')

        # Attendance & Evaluation
        page_st.goto(f'{BASE_URL}/class-attendance-evaluation', wait_until='domcontentloaded')
        page_st.wait_for_timeout(2500)
        page_st.screenshot(path=f'{OUTPUT_DIR}/student_05_evaluations.png')

        # Tuition Billing
        page_st.goto(f'{BASE_URL}/tuition-billing', wait_until='domcontentloaded')
        page_st.wait_for_timeout(2500)
        page_st.screenshot(path=f'{OUTPUT_DIR}/student_06_tuition.png')

        ctx_st.close()

        # -------------------------------------------------------------
        # 2. TEACHER ROLE (GV952)
        # -------------------------------------------------------------
        print(">>> CAPTURING TEACHER ROLE...")
        ctx_tc = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_tc.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'GV952');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_tc = ctx_tc.new_page()

        # Teacher Dashboard
        page_tc.goto(f'{BASE_URL}/dashboard', wait_until='domcontentloaded')
        page_tc.wait_for_timeout(2500)
        page_tc.screenshot(path=f'{OUTPUT_DIR}/teacher_01_dashboard.png')

        # Teacher Courses/Classes (Fee hidden)
        page_tc.goto(f'{BASE_URL}/courses-classes', wait_until='domcontentloaded')
        page_tc.wait_for_timeout(2500)
        page_tc.screenshot(path=f'{OUTPUT_DIR}/teacher_02_classes.png')

        # Teacher Students (Masked phone & note relay)
        page_tc.goto(f'{BASE_URL}/students', wait_until='domcontentloaded')
        page_tc.wait_for_timeout(2500)
        page_tc.screenshot(path=f'{OUTPUT_DIR}/teacher_03_students_privacy.png')

        # Teacher Attendance & Session Evaluations
        page_tc.goto(f'{BASE_URL}/class-attendance-evaluation', wait_until='domcontentloaded')
        page_tc.wait_for_timeout(2500)
        page_tc.screenshot(path=f'{OUTPUT_DIR}/teacher_04_attendance_eval.png')

        # Teacher Homework Panel
        page_tc.goto(f'{BASE_URL}/homework', wait_until='domcontentloaded')
        page_tc.wait_for_timeout(2500)
        page_tc.screenshot(path=f'{OUTPUT_DIR}/teacher_05_homework.png')

        ctx_tc.close()

        # -------------------------------------------------------------
        # 3. ACADEMIC ROLE (ACA101)
        # -------------------------------------------------------------
        print(">>> CAPTURING ACADEMIC ROLE...")
        ctx_ac = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_ac.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'ACA101');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_ac = ctx_ac.new_page()

        # Academic Dashboard
        page_ac.goto(f'{BASE_URL}/dashboard', wait_until='domcontentloaded')
        page_ac.wait_for_timeout(2500)
        page_ac.screenshot(path=f'{OUTPUT_DIR}/academic_01_dashboard.png')

        # Academic Courses & Classes Management
        page_ac.goto(f'{BASE_URL}/courses-classes', wait_until='domcontentloaded')
        page_ac.wait_for_timeout(2500)
        page_ac.screenshot(path=f'{OUTPUT_DIR}/academic_02_courses_classes.png')

        # Academic Students Roster & Admissions
        page_ac.goto(f'{BASE_URL}/students', wait_until='domcontentloaded')
        page_ac.wait_for_timeout(2500)
        page_ac.screenshot(path=f'{OUTPUT_DIR}/academic_03_students.png')

        # Academic Live Zoom Schedules
        page_ac.goto(f'{BASE_URL}/zoom-schedules', wait_until='domcontentloaded')
        page_ac.wait_for_timeout(2500)
        page_ac.screenshot(path=f'{OUTPUT_DIR}/academic_04_schedules.png')

        # Academic Learning Materials Hub
        page_ac.goto(f'{BASE_URL}/learning-materials', wait_until='domcontentloaded')
        page_ac.wait_for_timeout(2500)
        page_ac.screenshot(path=f'{OUTPUT_DIR}/academic_05_materials.png')

        ctx_ac.close()

        # -------------------------------------------------------------
        # 4. ACCOUNTANT ROLE (ACC330)
        # -------------------------------------------------------------
        print(">>> CAPTURING ACCOUNTANT ROLE...")
        ctx_acc = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_acc.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'ACC330');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_acc = ctx_acc.new_page()

        # Tuition Billing & Invoices
        page_acc.goto(f'{BASE_URL}/tuition-billing', wait_until='domcontentloaded')
        page_acc.wait_for_timeout(2500)
        page_acc.screenshot(path=f'{OUTPUT_DIR}/accountant_01_tuition.png')

        # Teacher Payrolls
        page_acc.goto(f'{BASE_URL}/teacher-contracts', wait_until='domcontentloaded')
        page_acc.wait_for_timeout(2500)
        page_acc.screenshot(path=f'{OUTPUT_DIR}/accountant_02_payrolls.png')

        ctx_acc.close()

        # -------------------------------------------------------------
        # 5. DIRECTOR ROLE (DIR505)
        # -------------------------------------------------------------
        print(">>> CAPTURING DIRECTOR ROLE...")
        ctx_dir = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_dir.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'DIR505');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_dir = ctx_dir.new_page()

        # Executive Dashboard
        page_dir.goto(f'{BASE_URL}/dashboard', wait_until='domcontentloaded')
        page_dir.wait_for_timeout(2500)
        page_dir.screenshot(path=f'{OUTPUT_DIR}/director_01_dashboard.png')

        # Contracts Approval
        page_dir.goto(f'{BASE_URL}/teacher-contracts', wait_until='domcontentloaded')
        page_dir.wait_for_timeout(2500)
        page_dir.screenshot(path=f'{OUTPUT_DIR}/director_02_contracts.png')

        ctx_dir.close()

        # -------------------------------------------------------------
        # 6. ADMIN ROLE (ADM001)
        # -------------------------------------------------------------
        print(">>> CAPTURING ADMIN ROLE...")
        ctx_adm = browser.new_context(viewport={'width': 1366, 'height': 800})
        ctx_adm.add_init_script('''
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'vi');
        ''')
        page_adm = ctx_adm.new_page()

        # User Management & RBAC
        page_adm.goto(f'{BASE_URL}/user-management', wait_until='domcontentloaded')
        page_adm.wait_for_timeout(2500)
        page_adm.screenshot(path=f'{OUTPUT_DIR}/admin_01_user_management.png')

        # My Profile & Security
        page_adm.goto(f'{BASE_URL}/my-profile', wait_until='domcontentloaded')
        page_adm.wait_for_timeout(2500)
        page_adm.screenshot(path=f'{OUTPUT_DIR}/admin_02_my_profile.png')

        ctx_adm.close()
        browser.close()

    print(">>> ALL SCREENSHOTS CAPTURED SUCCESSFULLY IN:", OUTPUT_DIR)

if __name__ == '__main__':
    capture_all()
