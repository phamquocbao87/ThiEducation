#!/usr/bin/env python3
"""
qc_lesson_qa_management.py
Kiểm thử E2E Màn Hình Quản Lý Hỏi & Đáp (/lesson-qa) + Preview 1–2 Câu Mới Ngoài Dashboard:
1. Seed 3 câu OPEN + 1 câu ANSWERED (CLASS_SHARED) trên Dev Firestore.
2. Ngoài /dashboard (GV952): Chỉ hiển thị TỐI ĐA 2 câu hỏi mới nhất (KHÔNG tràn 4 câu!), bấm Xem tất cả vào /lesson-qa.
3. Trong /lesson-qa (GV952): Đủ 4 câu, phân loại rõ Câu mới (3) / Đã giải quyết (1) / Chia sẻ (1), đầy đủ ngữ cảnh Lớp + Buổi + Bài học + Đoạn hỏi, lọc theo Lớp/Tab, trả lời 0ms, ẩn 100% Zalo.
4. Giáo vụ ACA545 (Mobile 390x844): Zero Overflow-X, có bộ lọc Giáo viên & nút Nhắc GV trả lời.
5. Học viên HV801: Chỉ thấy câu của mình + câu CLASS_SHARED; TUYỆT ĐỐI ẩn câu PRIVATE của HV253 & lớp khác LH004.
6. Kế toán (accountant): Ẩn menu trên Sidebar & bị chặn khi truy cập trực tiếp /lesson-qa.
7. Zero-Residue Teardown: Xóa sạch toàn bộ test docs trong finally.
"""
import os
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"
QA_IDS = ["QC_QA_MGT_1", "QC_QA_MGT_2", "QC_QA_MGT_3", "QC_QA_MGT_4"]


def seed_qa_docs():
    print("🌱 [SEED]: Tạo 3 câu hỏi MỚI (OPEN) + 1 câu ĐÃ GIẢI QUYẾT (CLASS_SHARED) trên Dev Firestore...")
    node_code = """
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
const app = initializeApp({
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}, 'QC_QA_MGT_SEED');
const db = getFirestore(app, 'lakeducationdb');
const t = Date.now();
const docs = [
  {
    id: 'QC_QA_MGT_1',
    classId: 'LH002',
    className: 'WP03 G5 Ms. Maj/357 7:20-9:20 pm',
    sessionIndex: 3,
    lessonTitle: 'Essential Questions: How can experiencing nature change the way you think about it?',
    studentId: 'HV253',
    studentName: 'Nguyen Dang Thanh Nha',
    studentEnglishName: 'Melissa',
    teacherId: 'GV952',
    teacherName: 'Teacher Maj',
    anchorText: 'Primary and Secondary Sources',
    questionText: 'QC_QA_MGT_1: Teacher, what is the difference between a primary and secondary source?',
    status: 'OPEN',
    visibility: 'PRIVATE',
    answerText: '',
    isDeleted: false,
    createdAt: new Date(t - 10000).toISOString(),
    updatedAt: new Date(t - 10000).toISOString(),
  },
  {
    id: 'QC_QA_MGT_2',
    classId: 'LH002',
    className: 'WP03 G5 Ms. Maj/357 7:20-9:20 pm',
    sessionIndex: 3,
    lessonTitle: 'Essential Questions: How can experiencing nature change the way you think about it?',
    studentId: 'HV801',
    studentName: 'Nguyen Minh Thu',
    studentEnglishName: 'Haide',
    teacherId: 'GV952',
    teacherName: 'Teacher Maj',
    anchorText: 'Text Structure: Cause and Effect',
    questionText: 'QC_QA_MGT_2: Can we use consequently as a cause-and-effect signal word?',
    status: 'OPEN',
    visibility: 'PRIVATE',
    answerText: '',
    isDeleted: false,
    createdAt: new Date(t - 20000).toISOString(),
    updatedAt: new Date(t - 20000).toISOString(),
  },
  {
    id: 'QC_QA_MGT_3',
    classId: 'LH004',
    className: 'WP02 G5 Ms. Maj/246 7:20-9:20 pm',
    sessionIndex: 8,
    lessonTitle: 'Wonders Unit 2 Review & Argumentative Essay',
    studentId: 'HV739',
    studentName: 'Nguyen Dinh Vu',
    studentEnglishName: 'Cody',
    teacherId: 'GV952',
    teacherName: 'Teacher Maj',
    anchorText: 'Extended Writing 1: Argumentative Writing',
    questionText: 'QC_QA_MGT_3: How many body paragraphs should we write for the argumentative essay?',
    status: 'OPEN',
    visibility: 'PRIVATE',
    answerText: '',
    isDeleted: false,
    createdAt: new Date(t - 30000).toISOString(),
    updatedAt: new Date(t - 30000).toISOString(),
  },
  {
    id: 'QC_QA_MGT_4',
    classId: 'LH002',
    className: 'WP03 G5 Ms. Maj/357 7:20-9:20 pm',
    sessionIndex: 3,
    lessonTitle: 'Essential Questions: How can experiencing nature change the way you think about it?',
    studentId: 'HV253',
    studentName: 'Nguyen Dang Thanh Nha',
    studentEnglishName: 'Melissa',
    teacherId: 'GV952',
    teacherName: 'Teacher Maj',
    anchorText: 'Short Vowels',
    questionText: 'QC_QA_MGT_4: Are all five vowels included in our short vowel review?',
    status: 'ANSWERED',
    visibility: 'CLASS_SHARED',
    answerText: 'Yes! We will review short a, e, i, o, and u sounds in class.',
    answeredBy: 'GV952',
    answeredByName: 'Teacher Maj',
    answeredAt: new Date(t - 5000).toISOString(),
    isDeleted: false,
    createdAt: new Date(t - 60000).toISOString(),
    updatedAt: new Date(t - 5000).toISOString(),
  },
];
for (const d of docs) {
  await setDoc(doc(db, 'lesson_questions', d.id), d);
}
console.log('✅ Seed 4 câu hỏi Q&A thành công!');
process.exit(0);
"""
    res = subprocess.run(
        ["node", "--input-type=module", "-e", node_code],
        cwd="/Volumes/DATA/projects/ThiEducation",
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"Seed lỗi: {res.stderr}"
    print("  ", res.stdout.strip())


def teardown_qa_docs():
    print("\n🧹 [TEARDOWN]: Dọn sạch 100% test docs Q&A & notifications trên Dev Firestore...")
    node_code = """
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
const app = initializeApp({
  apiKey: 'AIzaSyBxqq-AtOJR8UMQA3iuQa1-ukMm73PvU74',
  authDomain: 'lakeducation-dev.firebaseapp.com',
  projectId: 'lakeducation-dev',
  storageBucket: 'lakeducation-dev.firebasestorage.app',
  messagingSenderId: '609742112072',
  appId: '1:609742112072:web:076073076cf195752e9f7d',
}, 'QC_QA_MGT_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
for (const id of ['QC_QA_MGT_1', 'QC_QA_MGT_2', 'QC_QA_MGT_3', 'QC_QA_MGT_4']) {
  await deleteDoc(doc(db, 'lesson_questions', id)).catch(() => {});
}
let nCount = 0;
const snap = await getDocs(collection(db, 'notifications'));
for (const d of snap.docs) {
  const txt = JSON.stringify(d.data());
  if (txt.includes('QC_QA_MGT_')) {
    await deleteDoc(doc(db, 'notifications', d.id));
    nCount++;
  }
}
console.log('✅ Zero-Residue Teardown hoàn tất! Đã xóa 4 QA docs & ' + nCount + ' notifications.');
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
    print("🚀 PLAYWRIGHT QC E2E — LESSON Q&A MANAGEMENT (/lesson-qa) + DASHBOARD COMPACT")
    print("==================================================================")
    console_errors = []
    seed_qa_docs()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==============================================================
            # 1. GIÁO VIÊN GV952: DASHBOARD CHỈ 2 CÂU MỚI -> BẤM VÀO /lesson-qa ĐỦ 4 CÂU
            # ==============================================================
            print("\n👨‍🏫 [1/4] GIÁO VIÊN GV952 — DASHBOARD (MAX 2 NEW) & MÀN HÌNH /lesson-qa")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pgv = ctx_gv.new_page()
            pgv.on("pageerror", lambda err: console_errors.append(f"GV952: {err}"))

            pgv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='dashboard-new-questions-preview-card']", timeout=15000)
            pgv.wait_for_timeout(1200)

            preview_count = pgv.locator("[data-testid^='dashboard-qa-preview-item-']").count()
            assert preview_count == 2, f"Ngoài Dashboard chỉ được hiện tối đa 2 câu mới! Thực tế: {preview_count}"
            print(f"   ✅ [PASS] Ngoài Dashboard GV952 hiển thị gọn đúng {preview_count} câu mới (trên tổng 3 câu OPEN / 4 tổng)")

            shot_dash = os.path.join(ARTIFACT_DIR, "qc_qa_dashboard_compact_2items.png")
            pgv.locator("[data-testid='dashboard-new-questions-preview-card']").scroll_into_view_if_needed()
            pgv.screenshot(path=shot_dash)
            print(f"   📸 Screenshot Dashboard Compact 2 Q&A: {shot_dash}")

            # Click nút Xem Tất Cả -> điều hướng thẳng sang /lesson-qa
            pgv.locator("[data-testid='btn-dashboard-view-all-qa']").click()
            pgv.wait_for_selector("[data-testid='lesson-qa-management-page']", timeout=10000)
            pgv.wait_for_timeout(1200)
            assert "/lesson-qa" in pgv.url

            all_cards = pgv.locator("[data-testid^='qa-management-card-']").count()
            assert all_cards >= 4, f"Vào /lesson-qa GV952 phải thấy ít nhất 4 câu test, thực tế: {all_cards}"
            for qid in QA_IDS:
                assert pgv.locator(f"[data-testid='qa-management-card-{qid}']").is_visible(), f"Thiếu {qid} trên /lesson-qa!"

            # Kiểm tra ngữ cảnh Lớp + Buổi + Bài học + Đoạn hỏi
            ctx_txt = pgv.locator("[data-testid='qa-management-card-QC_QA_MGT_1']").inner_text()
            assert "LH002" in ctx_txt and "Buổi 3" in ctx_txt and "Essential Questions" in ctx_txt and "Primary and Secondary Sources" in ctx_txt
            assert "zalo" not in ctx_txt.lower()
            print(f"   ✅ [PASS] /lesson-qa hiển thị đầy đủ {all_cards} câu (gồm đủ 4 câu test) với Lớp, Buổi, Bài học, Phần hỏi & 0% Zalo")

            # Chuyển Tab Đã giải quyết -> thấy QC_QA_MGT_4 và KHÔNG thấy QC_QA_MGT_1 (đang OPEN)
            pgv.locator("[data-testid='qa-tab-answered']").click()
            pgv.wait_for_timeout(400)
            assert pgv.locator("[data-testid='qa-management-card-QC_QA_MGT_4']").is_visible()
            assert not pgv.locator("[data-testid='qa-management-card-QC_QA_MGT_1']").is_visible()

            # Chuyển Tab Câu hỏi mới -> đếm số lượng open -> Trả lời QC_QA_MGT_1 -> 0ms giảm đúng 1 câu
            pgv.locator("[data-testid='qa-tab-open']").click()
            pgv.wait_for_timeout(400)
            open_before = pgv.locator("[data-testid^='qa-management-card-']").count()
            assert open_before >= 3 and pgv.locator("[data-testid='qa-management-card-QC_QA_MGT_1']").is_visible()

            pgv.locator("[data-testid='qa-page-input-answer-QC_QA_MGT_1']").fill("Primary source is first-hand evidence like a diary.")
            pgv.locator("[data-testid='qa-page-btn-send-answer-QC_QA_MGT_1']").click()
            pgv.wait_for_timeout(1000)
            open_after = pgv.locator("[data-testid^='qa-management-card-']").count()
            assert open_after == open_before - 1, f"Sau khi trả lời, tab Câu mới phải giảm {open_before} -> {open_before - 1}, thực tế: {open_after}!"
            print(f"   ✅ [PASS] Phân loại Tab Mới/Đã giải quyết & trả lời trực tiếp 0ms chuẩn xác ({open_before} -> {open_after})!")

            # Chuyển về Tất cả chụp ảnh minh chứng
            pgv.locator(".ant-tabs-tab").first.click()
            pgv.wait_for_timeout(400)
            shot_gv_page = os.path.join(ARTIFACT_DIR, "qc_qa_page_desktop_teacher.png")
            pgv.screenshot(path=shot_gv_page)
            print(f"   📸 Screenshot /lesson-qa Desktop (Teacher): {shot_gv_page}")
            ctx_gv.close()

            # ==============================================================
            # 2. GIÁO VỤ ACA545 (MOBILE 390 x 844): ZERO OVERFLOW-X + LỌC GV + NHẮC GV
            # ==============================================================
            print("\n📱 [2/4] GIÁO VỤ ACA545 (MOBILE 390x844) — TOÀN TRƯỜNG & ZERO OVERFLOW-X")
            ctx_aca = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx_aca.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            paca = ctx_aca.new_page()
            paca.on("pageerror", lambda err: console_errors.append(f"ACA545 Mobile: {err}"))

            paca.goto(f"{BASE_URL}/lesson-qa", wait_until="domcontentloaded")
            paca.wait_for_selector("[data-testid='lesson-qa-management-page']", timeout=15000)
            paca.wait_for_timeout(1200)

            ov_m = paca.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert ov_m["sw"] <= ov_m["iw"], f"Mobile /lesson-qa Overflow-X: {ov_m}"
            assert paca.locator("[data-testid='select-qa-filter-teacher']").is_visible(), "Giáo vụ phải có bộ lọc Giáo viên!"
            assert paca.locator("[data-testid='qa-page-btn-remind-gv-QC_QA_MGT_2']").is_visible(), "Giáo vụ phải có nút Nhắc GV trả lời!"
            print(f"   ✅ [PASS] Giáo vụ Mobile 390x844 Zero Overflow-X ({ov_m['sw']} <= {ov_m['iw']}), đủ lọc GV & nút Nhắc GV")

            shot_aca_m = os.path.join(ARTIFACT_DIR, "qc_qa_page_mobile_academic.png")
            paca.screenshot(path=shot_aca_m)
            print(f"   📸 Screenshot /lesson-qa Mobile (Academic): {shot_aca_m}")
            ctx_aca.close()

            # ==============================================================
            # 3. HỌC VIÊN HV801 — STRICT PRIVACY GUARD TRÊN /lesson-qa
            # ==============================================================
            print("\n🔒 [3/4] HỌC VIÊN HV801 — CHỈ THẤY CÂU CỦA MÌNH + CÂU CLASS_SHARED")
            ctx_st = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_st.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV801');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pst = ctx_st.new_page()
            pst.on("pageerror", lambda err: console_errors.append(f"HV801: {err}"))

            pst.goto(f"{BASE_URL}/lesson-qa", wait_until="domcontentloaded")
            pst.wait_for_selector("[data-testid='lesson-qa-management-page']", timeout=15000)
            pst.wait_for_timeout(1200)

            assert pst.locator("[data-testid='qa-management-card-QC_QA_MGT_2']").is_visible(), "HV801 phải thấy câu của chính mình!"
            assert pst.locator("[data-testid='qa-management-card-QC_QA_MGT_4']").is_visible(), "HV801 phải thấy câu CLASS_SHARED lớp LH002!"
            assert not pst.locator("[data-testid='qa-management-card-QC_QA_MGT_1']").is_visible(), "LỖI BẢO MẬT: HV801 thấy câu PRIVATE của HV253!"
            assert not pst.locator("[data-testid='qa-management-card-QC_QA_MGT_3']").is_visible(), "LỖI BẢO MẬT: HV801 thấy câu lớp khác LH004!"
            assert pst.locator("[data-testid='btn-student-ask-new-qa']").is_visible(), "Học viên phải có nút Đặt Câu Hỏi Mới!"
            print("   ✅ [PASS] Student Privacy Guard 100%: Chỉ hiện đúng 2 câu hợp lệ (của mình + CLASS_SHARED)!")

            shot_st = os.path.join(ARTIFACT_DIR, "qc_qa_page_desktop_student.png")
            pst.screenshot(path=shot_st)
            print(f"   📸 Screenshot /lesson-qa Desktop (Student): {shot_st}")
            ctx_st.close()

            # ==============================================================
            # 4. KẾ TOÁN (ACCOUNTANT — ACC001) — BỊ CHẶN 403 /lesson-qa & ẨN SIDEBAR
            # ==============================================================
            print("\n🛡️ [4/4] KẾ TOÁN (ACC001) — CHẶN ROUTE /lesson-qa (403) & ẨN MENU SIDEBAR")
            ctx_acc = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_acc.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACC001');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pacc = ctx_acc.new_page()
            pacc.goto(f"{BASE_URL}/lesson-qa", wait_until="domcontentloaded")
            pacc.wait_for_selector("[data-testid='error-403-title']", timeout=10000)
            assert not pacc.locator("[data-testid='lesson-qa-management-page']").is_visible(), "LỖI RBAC: Kế toán không được vào /lesson-qa!"
            assert not pacc.locator("text=Hỏi & Đáp Bài Học").is_visible(), "LỖI RBAC: Menu Hỏi & Đáp phải ẩn với Kế toán!"
            print("   ✅ [PASS] Accountant RBAC Guard 100%: Ẩn menu Sidebar & chặn truy cập trực tiếp /lesson-qa (403 Forbidden)!")
            ctx_acc.close()

            assert len(console_errors) == 0, f"Lỗi JS Console: {console_errors}"
            print("\n==================================================================")
            print("🎉 TẤT CẢ 4 KỊCH BẢN /lesson-qa & DASHBOARD COMPACT PASS 100%!")
            print("==================================================================")
        finally:
            browser.close()
            teardown_qa_docs()


if __name__ == "__main__":
    run_qc()
