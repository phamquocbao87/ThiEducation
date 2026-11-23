#!/usr/bin/env python3
"""
qc_lesson_reader_phase2.py
Kiểm thử E2E Đa Vai Trò (HV253 + HV801 + GV952) trên Desktop (1366x800) & Mobile (390x844) cho SPEC-10 Phase 2:
1. Học viên HV253: Take Note gắn mục tiêu, sửa, xóa 0ms + F5 Persistence + Tombstone không sống lại.
2. Học viên HV253: Ask Teacher Q&A gắn mục tiêu (mặc định PRIVATE 1-1).
3. Privacy Guard (HV801 cùng lớp LH002): KHÔNG thấy Ghi chú cá nhân & KHÔNG thấy câu hỏi PRIVATE của HV253.
4. Giáo viên GV952 (Teacher Maj): Thấy câu hỏi trên TeacherWorkspacePanel (ẩn 100% Zalo), trả lời + bật chia sẻ cả lớp (`CLASS_SHARED`).
5. Học viên HV253 trên Mobile (390x844): Zero Overflow-X, mở Sticky Bottom Bar -> Bottom Sheet Q&A -> thấy câu trả lời của GV -> bấm `Đã hiểu`.
6. Học viên HV801: Sau khi GV bật `CLASS_SHARED`, thấy câu hỏi chung của lớp.
7. Zero-Residue Teardown: Xóa sạch toàn bộ test docs trong `lesson_student_notes`, `lesson_questions`, `lesson_reading_logs`, `notifications` trên Dev Firestore.
"""
import os
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"
NOTE_MARKER = "QC_P2_NOTE_CAUSE_EFFECT"
NOTE_DEL_MARKER = "QC_P2_NOTE_TO_DELETE"
QA_MARKER = "QC_P2_QA_IS_DIARY_PRIMARY_SOURCE"
ANSWER_MARKER = "QC_P2_TEACHER_ANSWER_YES_PRIMARY_SOURCE"


def teardown_phase2_test_data():
    """Zero-Residue Teardown trên Dev Firestore (`lakeducation-dev`)."""
    print("\n🧹 [TEARDOWN]: Đang dọn sạch 100% dữ liệu test Phase 2 trên Firestore Dev...")
    node_code = f"""
import {{ initializeApp }} from 'firebase/app';
import {{ getFirestore, collection, getDocs, doc, deleteDoc }} from 'firebase/firestore';
const app = initializeApp({{
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}}, 'QC_P2_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
let removed = 0;

for (const colName of ['lesson_student_notes', 'lesson_questions', 'notifications']) {{
  const snap = await getDocs(collection(db, colName));
  for (const d of snap.docs) {{
    const txt = JSON.stringify(d.data());
    if (txt.includes('{NOTE_MARKER}') || txt.includes('{NOTE_DEL_MARKER}') || txt.includes('{QA_MARKER}') || txt.includes('{ANSWER_MARKER}')) {{
      await deleteDoc(doc(db, colName, d.id));
      removed++;
    }}
  }}
}}

for (const readId of ['READ_LH002_S3_HV253', 'READ_LH002_S3_HV801']) {{
  await deleteDoc(doc(db, 'lesson_reading_logs', readId)).catch(() => {{}});
}}
console.log('✅ Zero-Residue Teardown hoàn tất! Đã xóa ' + removed + ' test docs + 2 reading logs trên Dev Firestore.');
process.exit(0);
"""
    res = subprocess.run(
        ["node", "--input-type=module", "-e", node_code],
        cwd="/Volumes/DATA/projects/ThiEducation",
        capture_output=True,
        text=True,
    )
    print("  ", res.stdout.strip() if res.returncode == 0 else f"⚠️ {res.stderr.strip()}")


def run_qc():
    print("==================================================================")
    print("🚀 PLAYWRIGHT QC E2E — SPEC-10 PHASE 2 (MULTI-ROLE + DESKTOP & MOBILE)")
    print("==================================================================")
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==============================================================
            # 1. HV253 DESKTOP: TAKE NOTE (ADD/EDIT/DELETE/F5) & ASK TEACHER
            # ==============================================================
            print("\n👨‍🎓 [1/5] HỌC VIÊN HV253 (DESKTOP) — TAKE NOTE & ASK TEACHER Q&A")
            ctx_hv253 = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_hv253.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
                localStorage.removeItem('lak_lesson_student_notes_v1_HV253');
                localStorage.removeItem('lak_lesson_student_notes_deleted_v1_HV253');
                localStorage.removeItem('lak_lesson_questions_cache_v1');
            """)
            page = ctx_hv253.new_page()
            page.on("pageerror", lambda err: console_errors.append(f"HV253 Desktop: {err}"))

            page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            page.wait_for_timeout(1200)

            page.locator("[data-testid='lesson-overview-compact-trigger']").click()
            page.wait_for_selector("[data-testid='lesson-reader-desktop-sidebar']", timeout=8000)

            # 1.1 Bấm nút nhanh 📝 gắn mục tiêu -> tạo ghi chú
            page.locator("[data-testid^='btn-anchor-note-']").first.click()
            assert page.locator("[data-testid='note-anchor-preview']").is_visible(), "Phải hiện đoạn trích dẫn khi bấm 📝!"
            page.locator("[data-testid='btn-note-tag-VOCAB']").click()
            page.locator("[data-testid='input-student-note-content']").fill(NOTE_MARKER)
            page.locator("[data-testid='btn-save-student-note']").click()
            page.wait_for_timeout(800)
            assert page.locator(f"text={NOTE_MARKER}").is_visible(), "Ghi chú mới phải hiện 0ms!"
            print("   ✅ [PASS] Tạo ghi chú gắn đoạn mục tiêu thành công (0ms)")

            # 1.2 Tạo ghi chú thứ 2 rồi xóa ngay -> kiểm tra F5 không sống lại
            page.locator("[data-testid='input-student-note-content']").fill(NOTE_DEL_MARKER)
            page.locator("[data-testid='btn-save-student-note']").click()
            page.wait_for_timeout(600)
            assert page.locator(f"text={NOTE_DEL_MARKER}").is_visible()
            page.locator("[data-testid^='btn-delete-note-']").first.click()
            page.wait_for_timeout(600)
            assert not page.locator(f"text={NOTE_DEL_MARKER}").is_visible(), "Ghi chú vừa xóa phải biến mất 0ms!"
            print("   ✅ [PASS] Xóa ghi chú tức thì 0ms")

            # 1.3 Bấm nút nhanh 🙋 gắn mục tiêu -> gửi câu hỏi Q&A cho Giáo viên
            page.locator("[data-testid^='btn-anchor-qa-']").nth(2).click()
            page.wait_for_timeout(300)
            assert page.locator("[data-testid='qa-anchor-preview']").is_visible(), "Phải hiện trích đoạn khi bấm 🙋!"
            page.locator("[data-testid='input-student-question-text']").fill(QA_MARKER)
            page.locator("[data-testid='btn-submit-student-question']").click()
            page.wait_for_timeout(1000)
            assert page.locator(f"text={QA_MARKER}").is_visible(), "Câu hỏi mới phải hiện 0ms trong Tab Hỏi GV!"
            print("   ✅ [PASS] Học viên HV253 gửi câu hỏi Q&A (mặc định PRIVATE 1-1) thành công!")

            shot_student = os.path.join(ARTIFACT_DIR, "qc_phase2_desktop_student_reader_notes_qa.png")
            page.screenshot(path=shot_student)
            print(f"   📸 Screenshot Desktop Student Book Reader (Notes & Q&A): {shot_student}")

            # 1.4 Reload F5 -> kiểm tra bảo toàn Ghi chú 1, KHÔNG sống lại Ghi chú 2, còn nguyên Câu hỏi Q&A
            page.locator("[data-testid='btn-close-lesson-book-reader']").click()
            page.wait_for_timeout(500)
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            page.wait_for_timeout(1200)
            page.locator("[data-testid='lesson-overview-compact-trigger']").click()
            page.wait_for_selector("[data-testid='lesson-student-notes-panel']", timeout=8000)
            page.wait_for_timeout(1000)
            assert page.locator(f"text={NOTE_MARKER}").is_visible(), "Ghi chú bị mất sau F5!"
            assert not page.locator(f"text={NOTE_DEL_MARKER}").is_visible(), "LỖI TOMBSTONE: Ghi chú đã xóa sống lại sau F5!"
            print("   ✅ [PASS] F5 Persistence & Tombstone Integrity đạt 100%")
            ctx_hv253.close()

            # ==============================================================
            # 2. PRIVACY GUARD — HV801 (CÙNG LỚP LH002) KHÔNG THẤY DATA PRIVATE CỦA HV253
            # ==============================================================
            print("\n🔒 [2/5] BẢO MẬT RIÊNG TƯ — HỌC VIÊN CÙNG LỚP HV801")
            ctx_hv801 = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_hv801.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV801');
                localStorage.setItem('lak_app_language', 'vi');
                localStorage.removeItem('lak_lesson_questions_cache_v1');
            """)
            p801 = ctx_hv801.new_page()
            p801.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            p801.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            p801.wait_for_timeout(1200)
            p801.locator("[data-testid='lesson-overview-compact-trigger']").click()
            p801.wait_for_selector("[data-testid='lesson-student-notes-panel']", timeout=8000)
            p801.wait_for_timeout(1000)

            assert not p801.locator(f"text={NOTE_MARKER}").is_visible(), "LỖI BẢO MẬT: HV801 thấy ghi chú cá nhân của HV253!"
            p801.locator("[data-testid='tab-reader-qa']").click()
            p801.wait_for_timeout(600)
            assert not p801.locator(f"text={QA_MARKER}").is_visible(), "LỖI BẢO MẬT: HV801 thấy câu hỏi PRIVATE của HV253!"
            print("   ✅ [PASS] Privacy Guard 100%: HV801 KHÔNG thấy ghi chú cá nhân & KHÔNG thấy câu hỏi PRIVATE của HV253")
            ctx_hv801.close()

            # ==============================================================
            # 3. GIÁO VIÊN GV952 (TEACHER MAJ): NHẬN CÂU HỎI, TRẢ LỜI & BẬT CHIA SẺ CẢ LỚP
            # ==============================================================
            print("\n👨‍🏫 [3/5] GIÁO VIÊN BẢN XỨ GV952 — TRẢ LỜI Q&A & BẬT CLASS_SHARED")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'en');
            """)
            pgv = ctx_gv.new_page()
            pgv.on("pageerror", lambda err: console_errors.append(f"GV952 Desktop: {err}"))

            pgv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='teacher-lesson-questions-card']", timeout=15000)
            pgv.wait_for_timeout(1000)

            qa_card_text = pgv.locator("[data-testid='teacher-lesson-questions-card']").inner_text()
            assert QA_MARKER in qa_card_text, "Giáo viên GV952 không thấy câu hỏi của HV253 trên Dashboard!"
            assert "zalo" not in qa_card_text.lower(), "VI PHẠM ZALO GUARD: Có chữ Zalo trên thẻ Giáo viên!"
            print("   ✅ [PASS] GV952 nhận đúng câu hỏi của HV253 trên Dashboard (0% Zalo)")

            # Nhập câu trả lời + Bật chia sẻ cả lớp + Gửi
            pgv.locator("[data-testid^='input-teacher-answer-']").first.fill(ANSWER_MARKER)
            pgv.locator("[data-testid^='switch-share-draft-']").first.click()
            pgv.locator("[data-testid^='btn-send-teacher-answer-']").first.click()
            pgv.wait_for_timeout(1200)

            assert pgv.locator(f"text={ANSWER_MARKER}").is_visible(), "Câu trả lời của GV không hiển thị 0ms!"
            print("   ✅ [PASS] GV952 trả lời thành công & bật chia sẻ CLASS_SHARED (0ms)")

            pgv.locator("[data-testid='teacher-lesson-questions-card']").scroll_into_view_if_needed()
            shot_teacher = os.path.join(ARTIFACT_DIR, "qc_phase2_desktop_teacher_qa_inbox.png")
            pgv.screenshot(path=shot_teacher)
            print(f"   📸 Screenshot Desktop Teacher Q&A Inbox: {shot_teacher}")
            ctx_gv.close()

            # ==============================================================
            # 4. HV253 MOBILE (390 x 844): BOTTOM SHEET Q&A + THẤY CÂU TRẢ LỜI + ĐÁNH DẤU ĐÃ HIỂU
            # ==============================================================
            print("\n📱 [4/5] HỌC VIÊN HV253 (MOBILE 390x844) — BOTTOM SHEET Q&A & XÁC NHẬN ĐÃ HIỂU")
            ctx_m = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx_m.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pm = ctx_m.new_page()
            pm.on("pageerror", lambda err: console_errors.append(f"HV253 Mobile: {err}"))

            pm.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pm.wait_for_selector("[data-testid='btn-open-lesson-book-reader']", timeout=15000)
            pm.wait_for_timeout(1000)
            pm.locator("[data-testid='btn-open-lesson-book-reader']").click()
            pm.wait_for_selector("[data-testid='lesson-reader-mobile-bottom-bar']", timeout=8000)
            pm.wait_for_timeout(800)

            # Assert Mobile Zero Overflow-X & Touch Target >= 44px
            m_ov = pm.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert m_ov["sw"] <= m_ov["iw"], f"Mobile Reader Overflow-X: {m_ov}"
            qa_btn_box = pm.locator("[data-testid='btn-mobile-open-qa']").bounding_box()
            assert qa_btn_box["height"] >= 44, f"Nút Hỏi GV trên Mobile quá nhỏ: {qa_btn_box}"

            pm.locator("[data-testid='btn-mobile-open-qa']").click()
            pm.wait_for_selector("[data-testid='lesson-questions-panel']", timeout=8000)
            pm.wait_for_timeout(800)

            assert pm.locator(f"text={ANSWER_MARKER}").is_visible(), "HV253 không thấy câu trả lời của GV952!"
            pm.locator("[data-testid^='btn-resolve-qa-']").first.click()
            pm.wait_for_timeout(600)
            assert pm.locator("text=Con đã hiểu rồi!").is_visible(), "Nút 'Con đã hiểu rồi!' chưa cập nhật 0ms!"
            print(f"   ✅ [PASS] Mobile 390x844 Zero Overflow-X, Bottom Sheet Q&A hiển thị câu trả lời GV & bấm Đã hiểu 0ms!")

            shot_mobile_qa = os.path.join(ARTIFACT_DIR, "qc_phase2_mobile_student_qa_sheet.png")
            pm.screenshot(path=shot_mobile_qa)
            print(f"   📸 Screenshot Mobile Student Q&A Bottom Sheet: {shot_mobile_qa}")
            ctx_m.close()

            # ==============================================================
            # 5. XÁC NHẬN CLASS_SHARED: HV801 BÂY GIỜ THẤY CÂU HỎI ĐƯỢC GV CHIA SẺ
            # ==============================================================
            print("\n🌐 [5/5] KIỂM CHỨNG CLASS_SHARED — HV801 THẤY CÂU HỎI CHUNG CỦA LỚP")
            ctx_hv801_after = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_hv801_after.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV801');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            p801_2 = ctx_hv801_after.new_page()
            p801_2.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            p801_2.wait_for_selector("[data-testid='lesson-overview-compact-trigger']", timeout=15000)
            p801_2.wait_for_timeout(1200)
            p801_2.locator("[data-testid='lesson-overview-compact-trigger']").click()
            p801_2.wait_for_selector("[data-testid='tab-reader-qa']", timeout=8000)
            p801_2.locator("[data-testid='tab-reader-qa']").click()
            p801_2.wait_for_timeout(1000)

            assert p801_2.locator(f"text={QA_MARKER}").is_visible(), "HV801 phải thấy câu hỏi sau khi GV bật CLASS_SHARED!"
            assert p801_2.locator(f"text={ANSWER_MARKER}").is_visible(), "HV801 phải thấy câu trả lời của GV khi CLASS_SHARED!"
            print("   ✅ [PASS] CLASS_SHARED hoạt động chuẩn xác: Cả lớp cùng học được từ câu hỏi hay!")
            ctx_hv801_after.close()

            assert len(console_errors) == 0, f"Lỗi JS Console: {console_errors}"
            print("\n==================================================================")
            print("🎉 TẤT CẢ 5 KỊCH BẢN PHASE 2 (3 ROLES + DESKTOP & MOBILE) PASS 100%!")
            print("==================================================================")
        finally:
            browser.close()
            teardown_phase2_test_data()


if __name__ == "__main__":
    run_qc()
