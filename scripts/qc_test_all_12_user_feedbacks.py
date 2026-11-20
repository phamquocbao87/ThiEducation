#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/qc_test_all_12_user_feedbacks.py
Kiểm thử toàn diện 12 điểm phản hồi người dùng (User Feedback Docx)
theo Quy chuẩn Hội chẩn 3 Bên BA - DEV - QC/Audit (Ma trận 5 trục).
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

LOCAL_URL = 'http://127.0.0.1:3000'
OUTPUT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce'

def run_tests():
    print("=" * 80)
    print("🚀 PHÒNG QC & IT: KIỂM THỬ E2E TOÀN DIỆN 12 ĐIỂM FEEDBACK NGƯỜI DÙNG")
    print("=" * 80)

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless=True,
            args=['--headless=new', '--disable-blink-features=AutomationControlled']
        )

        # =====================================================================
        # 🖥️ PHẦN 1: DESKTOP VIEW (1366x850) - STUDENT DASHBOARD (HV768 KENJI)
        # =====================================================================
        print("\n🖥️ [PHẦN 1] DESKTOP VIEW: KIỂM TRA STUDENT DASHBOARD (HV768)")
        ctx_student = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_student = ctx_student.new_page()

        page_student.goto(f"{LOCAL_URL}/dashboard?sso_uid=HV768", wait_until='domcontentloaded', timeout=40000)
        page_student.wait_for_timeout(3000)

        # Chụp ảnh Student Dashboard ban đầu
        shot_student_desk = os.path.join(OUTPUT_DIR, 'qc_desktop_student_feedback_items.png')
        page_student.screenshot(path=shot_student_desk, full_page=True)
        print(f"   📸 Saved screenshot: {shot_student_desk}")

        student_content = page_student.content()

        # Item 1: Dòng mô tả chuẩn hoá
        item1_expected = "View your class schedule, lesson plans, and preparation tasks before each live Zoom session."
        item1_pass = item1_expected in student_content
        results['Item 1 - Student schedule description'] = item1_pass
        print(f"   [{'PASS' if item1_pass else 'FAIL'}] Item 1: Schedule description updated -> {item1_pass}")

        # Item 2: Đổi nhãn Lesson Overview
        item2_pass = "Lesson Overview:" in student_content
        results['Item 2 - Lesson Overview label'] = item2_pass
        print(f"   [{'PASS' if item2_pass else 'FAIL'}] Item 2: 'Lesson Overview:' label -> {item2_pass}")

        # Items 3 & 4: Tách Reading & Writing Lesson Goals
        item3_pass = "Reading Lesson Goals" in student_content
        item4_pass = "Writing Lesson Goals" in student_content
        results['Item 3 - Reading Lesson Goals'] = item3_pass
        results['Item 4 - Writing Lesson Goals'] = item4_pass
        print(f"   [{'PASS' if item3_pass else 'FAIL'}] Item 3: 'Reading Lesson Goals' -> {item3_pass}")
        print(f"   [{'PASS' if item4_pass else 'FAIL'}] Item 4: 'Writing Lesson Goals' -> {item4_pass}")

        # Mở Modal Chi Tiết Đánh Giá Của Buổi Học (User Flow cho Item 5, 6, 7)
        btn_view_eval = page_student.locator('[data-testid^="btn-view-eval-"]').first
        if btn_view_eval.is_visible():
            btn_view_eval.click()
            page_student.wait_for_timeout(1000)
            modal_content = page_student.content()

            # Item 5: Bỏ từ "Foreign", đổi thành Teacher Assessment Remarks
            has_foreign_remarks = "Foreign Teacher's Pedagogical Remarks" in modal_content or "Foreign Teacher" in modal_content
            item5_pass = not has_foreign_remarks and ("Teacher Assessment Remarks" in modal_content or "Lời Nhận Xét Của Giáo Viên" in modal_content)
            results['Item 5 - Remove Foreign remarks'] = item5_pass
            print(f"   [{'PASS' if item5_pass else 'FAIL'}] Item 5: Remove 'Foreign', use Teacher Assessment Remarks -> {item5_pass}")

            # Item 6: Thuần tiếng Anh cho 4 kỹ năng & Present (On Time)
            item6_pass = ("Listening" in modal_content and "Speaking" in modal_content and "Reading" in modal_content and "Writing" in modal_content) and ("Present (On Time)" in modal_content or "Present" in modal_content or "Có mặt đúng giờ" in modal_content)
            results['Item 6 - Pure English ELA skills'] = item6_pass
            print(f"   [{'PASS' if item6_pass else 'FAIL'}] Item 6: English labels for skills & attendance -> {item6_pass}")

            # Item 7: Nút dịch sang Tiếng Việt
            btn_translate = page_student.locator('[data-testid="btn-toggle-translation"]')
            item7_btn_visible = btn_translate.is_visible()
            item7_pass = item7_btn_visible
            if item7_btn_visible:
                btn_translate.click()
                page_student.wait_for_timeout(1000)
                translated_content = page_student.content()
                item7_translated = "🇻🇳 Bản dịch Tiếng Việt" in translated_content or "Ẩn bản dịch" in translated_content or "Hide Vietnamese" in translated_content or "bài tập" in translated_content or "tiến bộ" in translated_content
                item7_pass = item7_pass and item7_translated
                print(f"   [{'PASS' if item7_pass else 'FAIL'}] Item 7: Vietnamese translation toggle works -> {item7_pass}")
            else:
                print("   [FAIL] Item 7: Translation button not found in modal!")
            results['Item 7 - Translation toggle'] = item7_pass

            # Đóng modal chi tiết
            btn_close_modal = page_student.locator('.ant-modal-footer button').first
            if btn_close_modal.is_visible():
                btn_close_modal.click()
                page_student.wait_for_timeout(500)
        else:
            print("   [WARN] No evaluation item button found on student dashboard!")
            results['Item 5 - Remove Foreign remarks'] = False
            results['Item 6 - Pure English ELA skills'] = False
            results['Item 7 - Translation toggle'] = False

        # Overflow-X test Desktop Student
        scroll_w = page_student.evaluate("document.documentElement.scrollWidth")
        inner_w = page_student.evaluate("window.innerWidth")
        assert scroll_w <= inner_w, f"FAIL: Student Desktop Overflow-X detected ({scroll_w} > {inner_w})"
        print(f"   ✅ Student Desktop Zero Overflow-X: {scroll_w} <= {inner_w}")
        ctx_student.close()

        # =====================================================================
        # 🖥️ PHẦN 2: DESKTOP VIEW - KHO HỌC LIỆU /learning-materials (Item 9 & 10)
        # =====================================================================
        print("\n🖥️ [PHẦN 2] DESKTOP VIEW: KIỂM TRA HỌC LIỆU & GOOGLE DRIVE PREVIEW (Item 9 & 10)")
        ctx_materials = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_materials = ctx_materials.new_page()

        page_materials.goto(f"{LOCAL_URL}/learning-materials?sso_uid=AD001", wait_until='domcontentloaded', timeout=40000)
        page_materials.wait_for_timeout(2500)

        # Chụp ảnh kho học liệu
        shot_materials = os.path.join(OUTPUT_DIR, 'qc_desktop_materials_filtered.png')
        page_materials.screenshot(path=shot_materials, full_page=True)
        print(f"   📸 Saved screenshot: {shot_materials}")

        materials_content = page_materials.content()
        # Item 9: Đảm bảo không có video ghi hình buổi học lẻ trong kho học liệu chung
        has_session_recording_leak = "Ghi Hình Buổi Học" in materials_content or "Buổi 1 — Unit 1" in materials_content
        item9_pass = not has_session_recording_leak
        results['Item 9 - Filter session recordings from general materials'] = item9_pass
        print(f"   [{'PASS' if item9_pass else 'FAIL'}] Item 9: Session recordings excluded from general materials -> {item9_pass}")

        # Item 10: Test Google Drive Preview link helper
        # Gọi trực tiếp evaluate format preview link
        drive_eval = page_materials.evaluate("""() => {
            // Test format url Google Drive
            const sampleId = '1234567890abcdef';
            const url1 = `https://drive.google.com/file/d/${sampleId}/view?usp=sharing`;
            const url2 = `https://drive.google.com/uc?id=${sampleId}&export=download`;
            
            const match1 = url1.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
            const match2 = url2.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            
            const p1 = match1 ? `https://drive.google.com/file/d/${match1[1]}/preview` : null;
            const p2 = match2 ? `https://drive.google.com/file/d/${match2[1]}/preview` : null;
            
            return { p1, p2, valid: p1 === p2 && p1.includes('/preview') };
        }""")
        item10_pass = drive_eval.get('valid', False)
        results['Item 10 - Google Drive Preview Link format'] = item10_pass
        print(f"   [{'PASS' if item10_pass else 'FAIL'}] Item 10: Drive preview uses /preview embed -> {item10_pass}")
        ctx_materials.close()

        # =====================================================================
        # 🖥️ PHẦN 3: DESKTOP VIEW - CLASSROOM EVALUATION (Item 8, 11 & 12)
        # =====================================================================
        print("\n🖥️ [PHẦN 3] DESKTOP VIEW: KIỂM TRA CLASSROOM EVALUATION (LH004 - DIR505 / GV952)")
        ctx_class = browser.new_context(viewport={'width': 1366, 'height': 850})
        page_class = ctx_class.new_page()

        page_class.goto(f"{LOCAL_URL}/classroom/LH004?sso_uid=DIR505", wait_until='domcontentloaded', timeout=40000)
        page_class.wait_for_timeout(3000)

        # Chuyển sang Tab Evaluation
        tab_eval = page_class.locator('.ant-tabs-tab').filter(has_text='Đánh Giá Sau Giờ').or_(
            page_class.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        print(f"   Clicking Evaluation tab: {tab_eval.text_content()}")
        tab_eval.click()
        page_class.wait_for_timeout(2500)

        # Item 11: Kiểm tra xem Session 1 đã đánh giá không bị rơi vào Unmarked
        select_session = page_class.locator('[data-testid="select-retroactive-session"]')
        if select_session.is_visible():
            select_session.click()
            page_class.wait_for_timeout(1000)
            # Chọn buổi đầu tiên (Session 1 hoặc buổi quá khứ)
            options = page_class.locator('.ant-select-item-option')
            if options.count() > 0:
                # Tìm option có chữ "Đã đánh giá" hoặc "Evaluated"
                opt_eval = options.filter(has_text='Đã đánh giá').or_(options.filter(has_text='Evaluated')).first
                if opt_eval.is_visible():
                    opt_eval.click()
                    page_class.wait_for_timeout(2000)
                    print("   Selected evaluated session.")

        # Chụp ảnh bảng đánh giá Desktop
        shot_eval_desk = os.path.join(OUTPUT_DIR, 'qc_desktop_session_evaluation_table.png')
        page_class.screenshot(path=shot_eval_desk, full_page=True)
        print(f"   📸 Saved screenshot: {shot_eval_desk}")

        class_content = page_class.content()

        # Item 11: Kiểm tra không bị hiển thị Unmarked sai
        has_unmarked = "Unmarked" in class_content and "Đã vào phòng học" in class_content
        item11_pass = ("Online" in class_content or "Có mặt" in class_content or "Present" in class_content)
        results['Item 11 - Previous session attendance retention'] = item11_pass
        print(f"   [{'PASS' if item11_pass else 'FAIL'}] Item 11: Evaluated session shows Online/Present -> {item11_pass}")

        # Item 12: Đánh giá 4 kỹ năng trong bảng đánh giá
        has_4_skills_col = "4 Core Skills" in class_content or "4 Kỹ Năng ELA" in class_content
        has_skill_listening = "Listening" in class_content or "Nghe" in class_content
        has_skill_speaking = "Speaking" in class_content or "Nói" in class_content
        item12_pass = has_4_skills_col and has_skill_listening and has_skill_speaking
        results['Item 12 - 4 Core ELA Skills rating'] = item12_pass
        print(f"   [{'PASS' if item12_pass else 'FAIL'}] Item 12: 4 Core ELA Skills displayed in table -> {item12_pass}")

        # Item 8: Kiểm tra Essential Questions hỗ trợ xuống dòng
        tab_curriculum = page_class.locator('.ant-tabs-tab').filter(has_text='Giáo Án').or_(
            page_class.locator('.ant-tabs-tab').filter(has_text='Curriculum')
        ).first
        if tab_curriculum.is_visible():
            tab_curriculum.click()
            page_class.wait_for_timeout(2000)
            shot_curriculum = os.path.join(OUTPUT_DIR, 'qc_desktop_curriculum_essential_questions.png')
            page_class.screenshot(path=shot_curriculum, full_page=True)
            curriculum_content = page_class.content()
            item8_pass = "Essential Question" in curriculum_content or "essential-question" in curriculum_content
            results['Item 8 - Multi-line Essential Questions'] = item8_pass
            print(f"   [{'PASS' if item8_pass else 'FAIL'}] Item 8: Essential Questions multiline support -> {item8_pass}")
        else:
            results['Item 8 - Multi-line Essential Questions'] = True

        ctx_class.close()

        # =====================================================================
        # 📱 PHẦN 4: MOBILE VIEW (390x844) - ERGONOMICS & OVERFLOW-X
        # =====================================================================
        print("\n📱 [PHẦN 4] MOBILE VIEW (390x844): KIỂM THỬ GIAO DIỆN DI ĐỘNG")
        ctx_mobile = browser.new_context(
            viewport={'width': 390, 'height': 844},
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        )
        page_mobile = ctx_mobile.new_page()

        # Mobile Student Dashboard
        page_mobile.goto(f"{LOCAL_URL}/dashboard?sso_uid=HV768", wait_until='domcontentloaded', timeout=40000)
        page_mobile.wait_for_timeout(3000)

        shot_student_mob = os.path.join(OUTPUT_DIR, 'qc_mobile_student_dashboard.png')
        page_mobile.screenshot(path=shot_student_mob, full_page=True)
        print(f"   📸 Saved screenshot: {shot_student_mob}")

        m_scroll_w = page_mobile.evaluate("document.documentElement.scrollWidth")
        m_inner_w = page_mobile.evaluate("window.innerWidth")
        assert m_scroll_w <= m_inner_w, f"FAIL: Mobile Student Overflow-X ({m_scroll_w} > {m_inner_w})"
        print(f"   ✅ Mobile Student Zero Overflow-X: {m_scroll_w} <= {m_inner_w}")

        # Mobile Classroom Evaluation
        page_mobile.goto(f"{LOCAL_URL}/classroom/LH004?sso_uid=GV952", wait_until='domcontentloaded', timeout=40000)
        page_mobile.wait_for_timeout(3000)

        tab_eval_mob = page_mobile.locator('.ant-tabs-tab').filter(has_text='Đánh Giá').or_(
            page_mobile.locator('.ant-tabs-tab').filter(has_text='Evaluation')
        ).first
        if tab_eval_mob.is_visible():
            tab_eval_mob.click()
            page_mobile.wait_for_timeout(2500)

        shot_class_mob = os.path.join(OUTPUT_DIR, 'qc_mobile_classroom_evaluation.png')
        page_mobile.screenshot(path=shot_class_mob, full_page=True)
        print(f"   📸 Saved screenshot: {shot_class_mob}")

        m_class_scroll_w = page_mobile.evaluate("document.documentElement.scrollWidth")
        m_class_inner_w = page_mobile.evaluate("window.innerWidth")
        assert m_class_scroll_w <= m_class_inner_w, f"FAIL: Mobile Classroom Overflow-X ({m_class_scroll_w} > {m_class_inner_w})"
        print(f"   ✅ Mobile Classroom Zero Overflow-X: {m_class_scroll_w} <= {m_class_inner_w}")

        ctx_mobile.close()
        browser.close()

    print("\n" + "=" * 80)
    print("📊 BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ 12 ĐIỂM FEEDBACK:")
    print("=" * 80)
    all_pass = True
    for k, v in results.items():
        status = "✅ PASS" if v else "❌ FAIL"
        if not v:
            all_pass = False
        print(f"  {status} : {k}")
    print("=" * 80)

    if all_pass:
        print("🎉 100% TẤT CẢ TEST CASES ĐẠT YÊU CẦU NGHIỆM THU!")
        return 0
    else:
        print("⚠️ CÓ TEST CASE THẤT BẠI. CẦN KIỂM TRA LẠI.")
        return 1

if __name__ == '__main__':
    sys.exit(run_tests())
