import os
import json
from playwright.sync_api import sync_playwright

RESULTS_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/audit_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

audit_report = {}

def run_scan():
    print("==================================================================")
    print("🚀 BẮT ĐẦU QUÉT THỰC TẾ LOCALHOST SO SÁNH VỚI BUGS-FU.DOCX")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        # -------------------------------------------------------------
        # ROLE 1: HỌC VIÊN HV151
        # -------------------------------------------------------------
        ctx_hv = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx_hv.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'HV151');
            localStorage.setItem('lak_app_language', 'en');
        """)
        page_hv = ctx_hv.new_page()

        # SCAN MỤC 2, 3, 4: DASHBOARD HỌC VIÊN
        print("\n--- [ROLE STUDENT HV151] QUÉT DASHBOARD ---")
        page_hv.goto("http://127.0.0.1:3000/dashboard", wait_until="domcontentloaded")
        page_hv.wait_for_timeout(2000)

        # Mục 2: 2 class vs classes & Zalo button
        classes_badge_text = page_hv.locator("div:has-text('Classes')").all_inner_texts()
        zalo_btn_en = page_hv.locator("button:has-text('Class Zalo Group')").count() > 0
        zalo_btn_raw = page_hv.locator("button:has-text('Zalo Lớp')").count() > 0
        audit_report["item_2"] = {
            "title": "Mục 2: Lỗi ngữ pháp 2 class & nút Zalo lớp",
            "status": "FIXED" if (zalo_btn_en and not zalo_btn_raw) else "NOT_FIXED",
            "evidence": f"Classes badge: {classes_badge_text[:1]}, Zalo EN: {zalo_btn_en}, Raw VI: {zalo_btn_raw}"
        }

        # Mục 3: Learning corner
        sub_k12 = page_hv.locator("text=Top 4 US K-12 & Supplemental Learning Platforms").count() > 0
        tag_acellus = page_hv.get_by_text("Accredited K-12", exact=True).count() > 0
        tag_ixl = page_hv.get_by_text("Comprehensive K-12 Curriculum", exact=True).count() > 0
        tag_khan = page_hv.get_by_text("Self-Paced Learning", exact=True).count() > 0
        audit_report["item_3"] = {
            "title": "Mục 3: Cập nhật 4 thẻ Learning Corner & CSS nút Open",
            "status": "FIXED" if (sub_k12 and tag_acellus and tag_ixl and tag_khan) else "NOT_FIXED",
            "evidence": f"Subtitle K12: {sub_k12}, Acellus: {tag_acellus}, IXL: {tag_ixl}, Khan: {tag_khan}"
        }

        # Mục 4: Class Learning Materials layout
        mat_count = page_hv.locator("[data-testid^='material-item-']").count()
        mat_item = page_hv.locator("[data-testid^='material-item-']").first
        mat_has_separate_rows = page_hv.locator("[data-testid^='btn-preview-mat-']").first.is_visible() if mat_count > 0 else False
        audit_report["item_4"] = {
            "title": "Mục 4: Role HS tài liệu bị lỗi font/format rớt chữ dọc",
            "status": "FIXED" if mat_has_separate_rows else "NOT_FIXED",
            "evidence": f"Materials count: {mat_count}, Separate rows: {mat_has_separate_rows}"
        }
        page_hv.screenshot(path=f"{RESULTS_DIR}/item_2_3_4_student_dashboard.png")

        # SCAN MỤC 5: HỌC VIÊN CHỈ THẤY LỚP ĐÃ ĐĂNG KÝ TRÊN /courses-classes
        print("\n--- [ROLE STUDENT HV151] QUÉT /courses-classes ---")
        page_hv.goto("http://127.0.0.1:3000/courses-classes", wait_until="domcontentloaded")
        page_hv.wait_for_timeout(2000)
        visible_classes_count = page_hv.locator("[data-testid^='class-card-']").count()
        enrolled_class = page_hv.locator("[data-testid='class-card-LH004']").count() > 0
        other_class = page_hv.locator("[data-testid='class-card-LH005']").count() > 0
        audit_report["item_5"] = {
            "title": "Mục 5: Học viên chỉ thấy lớp đã đăng ký",
            "status": "FIXED" if (visible_classes_count == 1 and enrolled_class and not other_class) else "NOT_FIXED",
            "evidence": f"Visible classes: {visible_classes_count}, LH004 enrolled: {enrolled_class}, LH005 hidden: {not other_class}"
        }
        page_hv.screenshot(path=f"{RESULTS_DIR}/item_5_student_scoped_classes.png")

        # SCAN MỤC 13: LEAD MINUTES VÀO PHÒNG HỌC 10 PHÚT
        print("\n--- [ROLE STUDENT HV151] QUÉT BADGE THỜI GIAN VÀO LỚP ---")
        badge_text = page_hv.locator("body").inner_text()
        has_10m = "10m" in badge_text or "10 phút" in badge_text or "10 min" in badge_text
        audit_report["item_13"] = {
            "title": "Mục 13: Học viên link mở trước 5-10 phút",
            "status": "FIXED" if has_10m else "NEED_IMPROVEMENT",
            "evidence": f"Lead window 10m mentioned in UI: {has_10m}"
        }

        # -------------------------------------------------------------
        # ROLE 2: GIÁO VIÊN BẢN XỨ GV952 (Teacher Maj)
        # -------------------------------------------------------------
        ctx_gv = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx_gv.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'GV952');
            localStorage.setItem('lak_app_language', 'en');
        """)
        page_gv = ctx_gv.new_page()

        # SCAN MỤC 6: GIÁO VIÊN KHÔNG THẤY FEE Ở CATALOG
        print("\n--- [ROLE TEACHER GV952] QUÉT FEE CATALOG ---")
        page_gv.goto("http://127.0.0.1:3000/courses-classes", wait_until="domcontentloaded")
        page_gv.wait_for_timeout(2000)
        tab_catalog = page_gv.locator(".ant-tabs-tab:has-text('Course Programs Catalog')").first
        if tab_catalog.is_visible():
            tab_catalog.click()
            page_gv.wait_for_timeout(1500)
        body_gv_courses = page_gv.locator("body").inner_text()
        has_fee_catalog = "Fee:" in body_gv_courses or "Học phí:" in body_gv_courses or "/month" in body_gv_courses or "Full Course Tuition" in body_gv_courses
        audit_report["item_6"] = {
            "title": "Mục 6: Account giáo viên không hiển thị các loại fee ở catalog",
            "status": "FIXED" if not has_fee_catalog else "NOT_FIXED",
            "evidence": f"Has fee in teacher catalog: {has_fee_catalog}"
        }
        page_gv.screenshot(path=f"{RESULTS_DIR}/item_6_teacher_catalog_no_fee.png")

        # SCAN MỤC 8 & 14: THÔNG TIN HỌC SINH Ở ACCOUNT GIÁO VIÊN
        print("\n--- [ROLE TEACHER GV952] QUÉT THÔNG TIN HỌC SINH /students ---")
        page_gv.goto("http://127.0.0.1:3000/students", wait_until="domcontentloaded")
        page_gv.wait_for_timeout(2500)
        body_students = page_gv.locator("body").inner_text()
        
        has_unmasked_phone = "0786436333" in body_students or "0835556263" in body_students
        has_call_btn = page_gv.locator("a[href^='tel:']").count() > 0 or page_gv.locator(".anticon-phone").count() > 0
        has_zalo_contact = page_gv.locator("a[href*='zalo.me/0']").count() > 0 or page_gv.locator(".anticon-message").count() > 0
        has_tuition_status = "Tuition Status" in body_students
        has_family_cluster = "Family Cluster" in body_students
        has_birth_or_age = "Birthday" in body_students or "Age" in body_students or "DOB" in body_students
        
        audit_report["item_8"] = {
            "title": "Mục 8: Thông tin học sinh ở account GV chỉ cần: Tên EN/VI, ngày sinh, giới tính",
            "status": "NOT_FIXED" if (has_tuition_status or has_family_cluster or not has_birth_or_age) else "FIXED",
            "evidence": f"Has tuition status: {has_tuition_status}, Has family cluster: {has_family_cluster}, Has DOB/Age: {has_birth_or_age}"
        }
        audit_report["item_14"] = {
            "title": "Mục 14: Role GV chỉ hiện 3 số đuôi SĐT PH (***333), cấm add Zalo/Call",
            "status": "NOT_FIXED" if (has_unmasked_phone or has_call_btn) else "FIXED",
            "evidence": f"Has unmasked phone (0786436333): {has_unmasked_phone}, Has call button: {has_call_btn}, Has Zalo direct chat: {has_zalo_contact}"
        }
        page_gv.screenshot(path=f"{RESULTS_DIR}/item_8_14_teacher_students_view.png")

        # -------------------------------------------------------------
        # ROLE 3: ADMIN / DIRECTOR / ACADEMIC (ADM001)
        # -------------------------------------------------------------
        ctx_admin = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx_admin.add_init_script("""
            localStorage.setItem('lak_authenticated_user_id', 'ADM001');
            localStorage.setItem('lak_app_language', 'en');
        """)
        page_admin = ctx_admin.new_page()

        # SCAN MỤC 1: DRAWER CHI TIẾT LỚP HỌC GOM 1 LINK ZOOM
        print("\n--- [ROLE ADMIN] QUÉT DRAWER CHI TIẾT LỚP HỌC ---")
        page_admin.goto("http://127.0.0.1:3000/courses-classes", wait_until="domcontentloaded")
        page_admin.wait_for_timeout(2000)
        btn_roster = page_admin.locator("[data-testid='btn-roster-LH002']").first
        if btn_roster.is_visible():
            btn_roster.click(force=True)
            page_admin.wait_for_timeout(1500)
        single_link_count = page_admin.locator("text=Online Classroom Link").count()
        old_host_count = page_admin.locator("text=Zoom Link for Teacher (Host)").count()
        old_join_count = page_admin.locator("text=Zoom Link for Students (Join)").count()
        audit_report["item_1"] = {
            "title": "Mục 1: Host và HS dùng chung 1 link, gom thành 1 link",
            "status": "FIXED" if (single_link_count == 1 and old_host_count == 0 and old_join_count == 0) else "NOT_FIXED",
            "evidence": f"Single link count: {single_link_count}, Old Host count: {old_host_count}, Old Join count: {old_join_count}"
        }
        page_admin.screenshot(path=f"{RESULTS_DIR}/item_1_class_drawer_single_link.png")

        # SCAN MỤC 9: SIDEBAR MENU EXERCISES
        print("\n--- [ROLE ADMIN] QUÉT MENU SIDEBAR ---")
        menu_text = page_admin.locator(".ant-layout-sider").inner_text()
        has_english_exercises = "English Exercises" in menu_text
        has_exercises_clean = "Exercises" in menu_text and not has_english_exercises
        audit_report["item_9"] = {
            "title": "Mục 9: Đổi nhãn menu Exercises thay vì English exercises",
            "status": "NOT_FIXED" if has_english_exercises else "FIXED",
            "evidence": f"Has 'English Exercises': {has_english_exercises}, Has clean 'Exercises': {has_exercises_clean}"
        }

        # SCAN MỤC 10: TIÊU ĐỀ BẢNG HOMEWORK ASSIGNMENTS
        print("\n--- [ROLE ADMIN] QUÉT BẢNG HOMEWORK ASSIGNMENTS ---")
        page_admin.goto("http://127.0.0.1:3000/attendance", wait_until="domcontentloaded")
        page_admin.wait_for_timeout(2500)
        tab_hw = page_admin.locator(".ant-tabs-tab:has-text('Homework Assignments')").first
        if tab_hw.is_visible():
            tab_hw.click()
            page_admin.wait_for_timeout(1500)
        hw_table_headers = page_admin.locator(".ant-table-thead").all_inner_texts()
        hw_headers_text = " ".join(hw_table_headers)
        has_vietnamese_hw_headers = "Mã BT" in hw_headers_text or "Lớp Học" in hw_headers_text or "Hạn Nộp" in hw_headers_text
        audit_report["item_10"] = {
            "title": "Mục 10: Tiêu đề bảng Homework Assignments đang là tiếng Việt khi ở EN",
            "status": "NOT_FIXED" if has_vietnamese_hw_headers else "FIXED",
            "evidence": f"Headers text: {hw_headers_text}, Has Vietnamese: {has_vietnamese_hw_headers}"
        }
        page_admin.screenshot(path=f"{RESULTS_DIR}/item_10_homework_table_headers.png")

        # SCAN MỤC 11: CỘT TEACHER'S FEEDBACK QUÁ DÀI
        print("\n--- [ROLE ADMIN] QUÉT CỘT TEACHER'S FEEDBACK TRONG ATTENDANCE ---")
        tab_att = page_admin.locator(".ant-tabs-tab:has-text('Attendance & Session Evaluations')").first
        if tab_att.is_visible():
            tab_att.click()
            page_admin.wait_for_timeout(1500)
        att_thead = page_admin.locator(".ant-table-thead").all_inner_texts()
        has_feedback_col = any("Teacher's Feedback" in h for h in att_thead)
        audit_report["item_11"] = {
            "title": "Mục 11: Cột Teacher's feedback quá dài làm vỡ layout bảng",
            "status": "NOT_FIXED",
            "evidence": f"Has feedback col: {has_feedback_col}, thead: {att_thead}"
        }
        page_admin.screenshot(path=f"{RESULTS_DIR}/item_11_session_evaluations_table.png")

        # SCAN MỤC 12: PHÂN QUYỀN HỌC LIỆU
        print("\n--- [ROLE ADMIN] QUÉT PHÂN HỆ HỌC LIỆU /learning-materials ---")
        page_admin.goto("http://127.0.0.1:3000/learning-materials", wait_until="domcontentloaded")
        page_admin.wait_for_timeout(2500)
        materials_body = page_admin.locator("body").inner_text()
        has_share_col = "Share Scope" in materials_body or "Phạm Vi" in materials_body or "Shared" in materials_body
        has_share_btn = page_admin.locator("[data-testid^='btn-share-mat-']").count() > 0
        audit_report["item_12"] = {
            "title": "Mục 12: Phân quyền học liệu cho từng role, từng GV và HS",
            "status": "FIXED" if (has_share_col or has_share_btn) else "NOT_FIXED",
            "evidence": f"Has share column in body: {has_share_col}, Has share buttons: {has_share_btn}"
        }
        page_admin.screenshot(path=f"{RESULTS_DIR}/item_12_learning_materials_sharing.png")

        # SCAN MỤC 7: TRIAL STUDENTS (HỌC THỬ & CAPACITY)
        print("\n--- QUÉT CƠ CHẾ TRIAL STUDENTS (MỤC 7) ---")
        page_admin.goto("http://127.0.0.1:3000/students", wait_until="domcontentloaded")
        page_admin.wait_for_timeout(2000)
        students_ui_text = page_admin.locator("body").inner_text()
        has_trial_tag = "Trial" in students_ui_text or "Học thử" in students_ui_text
        has_capacity_calc = "Capacity" in students_ui_text
        audit_report["item_7"] = {
            "title": "Mục 7: Quản lý học sinh học thử (Trial Students) để tính Capacity & tỷ lệ tuyển sinh",
            "status": "NEED_DESIGN_DECISION",
            "evidence": f"Has trial mentions in UI: {has_trial_tag}, Has capacity calculation: {has_capacity_calc}"
        }

        # SCAN MỤC 16: QUẢN LÝ RECORDING
        print("\n--- QUÉT KHU VỰC RECORDING (MỤC 16) ---")
        page_admin.goto("http://127.0.0.1:3000/attendance", wait_until="domcontentloaded")
        page_admin.wait_for_timeout(2000)
        att_body = page_admin.locator("body").inner_text()
        has_rec_col = "Recorded Video" in att_body
        has_rec_tab = page_admin.locator(".ant-tabs-tab:has-text('Recording')").count() > 0
        audit_report["item_16"] = {
            "title": "Mục 16: Có cần thêm khu vực quản lý recording không",
            "status": "NEED_DESIGN_DECISION",
            "evidence": f"Has recorded video column in attendance: {has_rec_col}, Has dedicated recordings tab: {has_rec_tab}"
        }

        browser.close()

    # Save JSON report
    report_json_path = f"{RESULTS_DIR}/audit_summary.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, ensure_ascii=False, indent=2)
    print(f"\n✅ ĐÃ LƯU BÁO CÁO AUDIT JSON TẠI: {report_json_path}")

run_scan()
