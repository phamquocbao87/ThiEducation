import os
import shutil
from playwright.sync_api import sync_playwright

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
TMP_DIR = '/tmp/pw_proto_snap_user'
if os.path.exists(TMP_DIR):
    shutil.rmtree(TMP_DIR, ignore_errors=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME_PATH,
        headless=True,
        args=['--headless=new', '--disable-blink-features=AutomationControlled']
    )
    context = browser.new_context(viewport={'width': 1366, 'height': 850})
    page = context.new_page()
    page.goto('file:///Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/classroom_ui_ux_prototype.html', wait_until='domcontentloaded')
    page.wait_for_timeout(500)
    
    # 1. Switch to Student Role
    page.locator('#btnRoleStudent').click()
    page.wait_for_timeout(300)
    
    # View Tab 2: Student Prep & Materials View
    page.locator('#tabNav2').click()
    page.wait_for_timeout(400)
    page.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/proto_student_prep_view.png')
    print("1. Student prep view snapped")

    # View Tab 3: Student personal evaluation card
    page.locator('#tabNav3').click()
    page.wait_for_timeout(400)
    page.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/proto_student_report_card.png')
    print("2. Student report card snapped")

    # 2. Switch to Academic Role & open Course Program Upload Modal
    page.locator('#btnRoleAcademic').click()
    page.wait_for_timeout(300)
    page.locator('#tabNav2').click()
    page.wait_for_timeout(300)
    page.locator('#btnAcademicUploadVault').click()
    page.wait_for_timeout(400)
    page.screenshot(path='/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/proto_academic_course_upload.png')
    print("3. Academic course upload modal snapped")

    browser.close()
    print("ALL 3 SNAPSHOTS COMPLETED!")
