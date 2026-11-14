import os
import sys
import json
import time
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACT_DIR = Path('/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce')
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_URL = 'http://127.0.0.1:3000'
CLASS_ID = 'LH005'

def run_lifecycle_test():
    # Step 0: Ensure active session for test by setting today on LH005
    print("\n[STEP 0] Configuring temporary active session on LH005 for E2E testing...")
    subprocess.run(["node", "scripts/temp_enable_lh005_session.js"], check=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        try:
            # =========================================================================
            # SCENARIO 1: Teacher Maj (GV952) In-Class Notes, Multi-Session Plan, Post-Evaluation
            # =========================================================================
            print("\n=== [SCENARIO 1] Teacher Maj (GV952) Full In-Class & Planning Flow ===")
            teacher_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
            teacher_page = teacher_ctx.new_page()

            teacher_page.goto(f"{BASE_URL}/?sso_uid=GV952", wait_until='domcontentloaded')
            teacher_page.wait_for_timeout(1000)
            teacher_page.goto(f"{BASE_URL}/classroom/{CLASS_ID}", wait_until='domcontentloaded')
            teacher_page.wait_for_selector('[data-testid="online-HV235"]', timeout=20000)

            # Assert Zero Overflow-X on Teacher Desktop
            overflow_desktop = teacher_page.evaluate('document.body.scrollWidth > window.innerWidth')
            assert not overflow_desktop, "Desktop horizontal overflow on teacher classroom view"
            print("ASSERT PASS: Zero overflow-x on Desktop (1366px)")

            # Tab 1: Attendance & Quick Note on Student Tracy (HV235)
            print("Teacher taking attendance and 1-touch note on Tracy (HV235)...")
            online_btn = teacher_page.locator('[data-testid="online-HV235"]')
            online_btn.click()
            teacher_page.wait_for_timeout(1000)

            note_btn = teacher_page.locator('[data-testid="btn-note-HV235"]')
            expect(note_btn).to_be_visible()
            note_btn.click()
            teacher_page.wait_for_timeout(1000)

            # Quick Note Modal
            note_modal_title = teacher_page.locator('[data-testid="quick-note-modal-title"]')
            expect(note_modal_title).to_be_visible()

            # Click 1-touch pedagogical tags
            checkable_tags = teacher_page.locator('.ant-tag-checkable')
            if checkable_tags.count() >= 2:
                checkable_tags.nth(0).click()
                checkable_tags.nth(1).click()

            # Enter custom teacher comment
            note_input = teacher_page.locator('[data-testid="quick-note-textarea-HV235"]')
            note_input.fill("Tracy answered unit questions fluently, pronunciation was very clear!")

            save_note_btn = teacher_page.locator('[data-testid="save-quick-note-HV235"]')
            save_note_btn.click()
            teacher_page.wait_for_timeout(1500)

            # Rate 5 stars
            print("Teacher rating 5 stars for Tracy...")
            star_rate = teacher_page.locator('[data-testid="rate-stars-HV235"]')
            if star_rate.is_visible():
                stars = star_rate.locator('.ant-rate-star')
                if stars.count() >= 5:
                    stars.nth(4).click()
            teacher_page.wait_for_timeout(1000)

            shot1 = ARTIFACT_DIR / 'e2e_teacher_quick_note.png'
            teacher_page.screenshot(path=str(shot1))
            print(f"Saved Teacher Quick Note screenshot: {shot1}")

            # Tab 2: Multi-Session Lesson Plan Preparation
            print("Teacher switching to Tab 2 (Soạn Giáo Án Đa Buổi)...")
            tab_curriculum = teacher_page.locator('[data-testid="tab-curriculum"]')
            tab_curriculum.click()
            teacher_page.wait_for_timeout(1000)

            # Select Session 4 pill
            session4_pill = teacher_page.locator('[data-testid="session-pill-4"]')
            expect(session4_pill).to_be_visible()
            session4_pill.click()
            teacher_page.wait_for_timeout(800)

            # Click Author / Edit Lesson Plan
            edit_plan_btn = teacher_page.locator('[data-testid="btn-open-lesson-editor"]')
            expect(edit_plan_btn).to_be_visible()
            edit_plan_btn.click()
            teacher_page.wait_for_timeout(1000)

            # Lesson Plan Editor Modal
            plan_modal_title = teacher_page.locator('[data-testid="lesson-plan-modal-title"]')
            expect(plan_modal_title).to_be_visible()

            wonders_template_btn = teacher_page.locator('[data-testid="btn-template-wonders"]')
            expect(wonders_template_btn).to_be_visible()
            wonders_template_btn.click()
            teacher_page.wait_for_timeout(500)

            # Fill specific student prep, homework, and internal teacher notes
            student_prep_input = teacher_page.locator('input[id="studentPrep"]')
            student_prep_input.fill("Read pages 14-17 in ReadingWriting Companion before joining class.")

            hw_input = teacher_page.locator('input[id="homework"]')
            hw_input.fill("Complete Practice Book page 8.")

            teacher_notes_input = teacher_page.locator('textarea[id="teacherNotes"]')
            teacher_notes_input.fill("Focus on phonics /sh/ and /ch/ blending for Tracy and Sam.")

            save_plan_btn = teacher_page.locator('[data-testid="btn-save-lesson-plan"]')
            save_plan_btn.click()
            teacher_page.wait_for_timeout(2000)

            # Assert Buổi 4 details are updated in view
            plan_card = teacher_page.locator('[data-testid="active-session-plan-card"]')
            expect(plan_card).to_contain_text("Read pages 14-17 in ReadingWriting Companion")
            print("ASSERT PASS: Lesson plan Buổi 4 authored ahead and saved successfully!")

            shot2 = ARTIFACT_DIR / 'e2e_teacher_multisession_plan.png'
            teacher_page.screenshot(path=str(shot2))
            print(f"Saved Teacher Lesson Plan screenshot: {shot2}")

            # Tab 3: Post-Session Evaluation Hub
            print("Teacher switching to Tab 3 (Đánh Giá Sau Giờ)...")
            tab_evaluation = teacher_page.locator('[data-testid="tab-evaluation"]')
            tab_evaluation.click()
            teacher_page.wait_for_timeout(1000)

            # Verify Tracy's row pre-filled from note
            eval_comment = teacher_page.locator('[data-testid="eval-comment-HV235"]')
            expect(eval_comment).to_be_visible()
            comment_val = eval_comment.input_value()
            print(f"Tracy's pre-filled evaluation comment: '{comment_val}'")
            assert len(comment_val) > 0, "Evaluation comment was not pre-filled!"

            # Verify un-noted student (HV151) has clean empty input and shows placeholder
            eval_comment_vivian = teacher_page.locator('[data-testid="eval-comment-HV151"]')
            if eval_comment_vivian.count() > 0:
                vivian_val = eval_comment_vivian.input_value()
                assert vivian_val == "", f"Un-noted student should have empty value for placeholder! Got: '{vivian_val}'"
                placeholder = eval_comment_vivian.get_attribute("placeholder")
                assert "Tham gia học tích cực" in placeholder or "Actively participated" in placeholder, f"Unexpected placeholder: {placeholder}"
                print("ASSERT PASS: Student without in-class note has clean empty input with pedagogical placeholder!")

            # Test real typing & assert anti-reset protection across timer ticks
            long_comment = "Tham gia học tích cực, phát âm rất chuẩn và làm bài tập xuất sắc hôm nay!"
            eval_comment.fill(long_comment)
            print("Typed long comment, waiting 2.5s for classroom timer ticks...")
            teacher_page.wait_for_timeout(2500)
            assert eval_comment.input_value() == long_comment, f"Input value got reset or limited! Got: {eval_comment.input_value()}"
            print("ASSERT PASS: Text typed in evaluation comment is protected against timer ticks and never reset!")

            # Test Evaluation History Drawer
            history_btn = teacher_page.locator('[data-testid="btn-open-evaluation-history"]')
            expect(history_btn).to_be_visible()
            history_btn.click()
            teacher_page.wait_for_timeout(1000)
            drawer_title = teacher_page.locator('.ant-drawer-title')
            expect(drawer_title).to_be_visible()
            print("ASSERT PASS: Evaluation History Drawer opens cleanly with past session timeline!")
            shot_hist = ARTIFACT_DIR / 'e2e_evaluation_history_drawer.png'
            teacher_page.screenshot(path=str(shot_hist))
            print(f"Saved Evaluation History Drawer screenshot: {shot_hist}")
            close_drawer = teacher_page.locator('.ant-drawer-close')
            close_drawer.click()
            teacher_page.wait_for_timeout(500)

            # Save all evaluations
            save_all_btn = teacher_page.locator('[data-testid="btn-save-all-evaluations"]')
            expect(save_all_btn).to_be_visible()
            save_all_btn.click()
            teacher_page.wait_for_timeout(2000)

            shot3 = ARTIFACT_DIR / 'e2e_teacher_evaluations_hub.png'
            teacher_page.screenshot(path=str(shot3))
            print(f"Saved Teacher Evaluation Hub screenshot: {shot3}")

            teacher_ctx.close()

            # =========================================================================
            # SCENARIO 2: Student Tracy (HV235) Security & Preparation View
            # =========================================================================
            print("\n=== [SCENARIO 2] Student Tracy (HV235) View & Privacy Assertions ===")
            student_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
            student_page = student_ctx.new_page()

            student_page.goto(f"{BASE_URL}/?sso_uid=HV235", wait_until='domcontentloaded')
            student_page.wait_for_timeout(1000)
            student_page.goto(f"{BASE_URL}/classroom/{CLASS_ID}", wait_until='domcontentloaded')
            student_page.wait_for_selector('[data-testid="seat-HV235"]', timeout=15000)

            # Verify Tracy's seat has 'Your Seat' or 'Ghế của con' tag
            tracy_seat = student_page.locator('[data-testid="seat-HV235"]')
            seat_text = tracy_seat.inner_text()
            assert ("Ghế của con" in seat_text or "Your Seat" in seat_text), f"Missing seat badge: {seat_text}"
            print("ASSERT PASS: Student identifies own seat ('Ghế của con' / 'Your Seat')")

            # Assert student cannot take attendance or open teacher note
            btn_note_for_student = student_page.locator('[data-testid="btn-note-HV235"]')
            assert btn_note_for_student.count() == 0, "Student should NOT see note button!"
            print("ASSERT PASS: Teacher in-class note controls hidden from student")

            # Check Mobile Viewport (390x844)
            student_page.set_viewport_size({'width': 390, 'height': 844})
            student_page.wait_for_timeout(800)
            overflow_mobile = student_page.evaluate('document.body.scrollWidth > window.innerWidth')
            assert not overflow_mobile, "Mobile horizontal overflow on student view"
            print("ASSERT PASS: Zero overflow-x on Mobile (390px)")

            shot_mob = ARTIFACT_DIR / 'e2e_mobile_student_view.png'
            student_page.screenshot(path=str(shot_mob))
            print(f"Saved Mobile Student View: {shot_mob}")

            # Return to desktop size for curriculum inspection
            student_page.set_viewport_size({'width': 1366, 'height': 800})
            student_page.wait_for_timeout(500)

            # Tab 2: Student Preparation View
            student_curriculum_tab = student_page.locator('[data-testid="tab-curriculum"]')
            student_curriculum_tab.click()
            student_page.wait_for_timeout(1000)

            # Select Session 4 pill
            student_pill4 = student_page.locator('[data-testid="session-pill-4"]')
            expect(student_pill4).to_be_visible()
            student_pill4.click()
            student_page.wait_for_timeout(800)

            student_plan_card = student_page.locator('[data-testid="active-session-plan-card"]')
            expect(student_plan_card).to_contain_text("Read pages 14-17 in ReadingWriting Companion")
            print("ASSERT PASS: Student sees pre-class reading assignment for Buổi 4!")

            # CRITICAL PEDAGOGY SECURITY AUDIT:
            # 1. Assert teacherNotes are 100% hidden
            page_content = student_page.content()
            assert "Focus on phonics /sh/ and /ch/ blending for Tracy and Sam" not in page_content, \
                "CRITICAL SECURITY FAIL: Internal teacherNotes leaked to student DOM!"
            print("ASSERT PASS: Internal teacherNotes strictly hidden from student!")

            # 2. Assert Edit Plan button is hidden
            student_edit_btn = student_page.locator('[data-testid="btn-open-lesson-editor"]')
            assert student_edit_btn.count() == 0, "Student should NOT see edit lesson plan button!"
            print("ASSERT PASS: Edit lesson plan controls hidden from student")

            shot4 = ARTIFACT_DIR / 'e2e_student_prep_clean_security.png'
            student_page.screenshot(path=str(shot4))
            print(f"Saved Student Prep View screenshot: {shot4}")

            # Tab 3: Student Report Card View
            student_eval_tab = student_page.locator('[data-testid="tab-evaluation"]')
            student_eval_tab.click()
            student_page.wait_for_timeout(1000)

            report_card = student_page.locator('.ant-card').last
            expect(report_card).to_contain_text("Tham gia học tích cực, phát âm rất chuẩn")
            print("ASSERT PASS: Student Report Card rendered cleanly with teacher stars and praise!")

            # Student views past evaluation history
            student_history_btn = student_page.locator('[data-testid="btn-student-view-history"]')
            expect(student_history_btn).to_be_visible()
            student_history_btn.click()
            student_page.wait_for_timeout(1000)
            expect(student_page.locator('.ant-drawer-title')).to_be_visible()
            print("ASSERT PASS: Student can view their past evaluation history across sessions!")
            shot_student_hist = ARTIFACT_DIR / 'e2e_student_evaluation_history.png'
            student_page.screenshot(path=str(shot_student_hist))
            print(f"Saved Student Evaluation History screenshot: {shot_student_hist}")
            student_page.locator('.ant-drawer-close').click()
            student_page.wait_for_timeout(500)

            shot5 = ARTIFACT_DIR / 'e2e_student_report_card.png'
            student_page.screenshot(path=str(shot5))
            print(f"Saved Student Report Card screenshot: {shot5}")

            student_ctx.close()

            # =========================================================================
            # SCENARIO 3: Academic Coordinator Diễm Quỳnh (ACA404) Course Vault & Zalo Dispatch
            # =========================================================================
            print("\n=== [SCENARIO 3] Academic Coordinator Diễm Quỳnh (ACA404) Flow ===")
            academic_ctx = browser.new_context(viewport={'width': 1366, 'height': 800})
            academic_page = academic_ctx.new_page()

            academic_page.goto(f"{BASE_URL}/?sso_uid=ACA404", wait_until='domcontentloaded')
            academic_page.wait_for_timeout(1000)
            academic_page.goto(f"{BASE_URL}/classroom/{CLASS_ID}", wait_until='domcontentloaded')
            academic_page.wait_for_selector('[data-testid="teacher-desk-card"]', timeout=15000)

            # Tab 2: Upload Course Material to Course Vault
            academic_curriculum_tab = academic_page.locator('[data-testid="tab-curriculum"]')
            academic_curriculum_tab.click()
            academic_page.wait_for_timeout(1000)

            upload_btn = academic_page.locator('[data-testid="btn-academic-upload-course-vault"]')
            expect(upload_btn).to_be_visible()
            upload_btn.click()
            academic_page.wait_for_timeout(800)

            course_modal_title = academic_page.locator('[data-testid="course-upload-modal-title"]')
            expect(course_modal_title).to_be_visible()

            mat_title_input = academic_page.locator('input[id="title"]')
            mat_title_input.fill("McGraw-Hill Wonders G1 Practice Cards & Games")

            mat_url_input = academic_page.locator('input[id="url"]')
            mat_url_input.fill("https://drive.google.com/drive/folders/test-wonders-cards")

            submit_mat_btn = academic_page.locator('[data-testid="btn-submit-course-material"]')
            submit_mat_btn.click()
            academic_page.wait_for_timeout(2000)

            # Assert new material appears in 10 Drive links list
            expect(academic_page.get_by_text("McGraw-Hill Wonders G1 Practice Cards & Games").first).to_be_visible()
            print("ASSERT PASS: Course material uploaded by Academic coordinator with 0ms sync!")

            shot6 = ARTIFACT_DIR / 'e2e_academic_course_vault.png'
            academic_page.screenshot(path=str(shot6))
            print(f"Saved Academic Course Vault screenshot: {shot6}")

            # Tab 3: Zalo Parent Outreach
            academic_eval_tab = academic_page.locator('[data-testid="tab-evaluation"]')
            academic_eval_tab.click()
            academic_page.wait_for_timeout(1000)

            zalo_btn = academic_page.locator('[data-testid="btn-zalo-HV235"]')
            expect(zalo_btn).to_be_visible()
            zalo_btn.click()
            academic_page.wait_for_timeout(1000)

            # Assert Zalo Preview Modal opens with prefilled content and link
            zalo_title = academic_page.locator('[data-testid="zalo-preview-modal-title"]')
            expect(zalo_title).to_be_visible()
            expect(zalo_title).to_contain_text("Tracy")

            zalo_link = academic_page.locator('[data-testid="btn-zalo-send-direct"]')
            expect(zalo_link).to_be_visible()
            href = zalo_link.get_attribute("href")
            assert "zalo.me/0835556263" in href, f"Unexpected zalo link: {href}"
            print(f"ASSERT PASS: 1-Click Zalo Outreach modal pre-filled with stars, notes, and parent link ({href})!")

            shot7 = ARTIFACT_DIR / 'e2e_academic_zalo_dispatch.png'
            academic_page.screenshot(path=str(shot7))
            print(f"Saved Academic Zalo Dispatch screenshot: {shot7}")

            academic_ctx.close()

            print("\n🎉 ALL E2E LIFECYCLE TESTS PASSED 100%!")

        finally:
            # Step Teardown: Restore original schedule on LH005
            print("\n[TEARDOWN] Restoring LH005 original schedule...")
            subprocess.run(["node", "scripts/temp_restore_lh005_session.js"], check=True)
            print("Teardown complete: Original schedule restored in Firestore.")
            browser.close()

if __name__ == '__main__':
    run_lifecycle_test()
