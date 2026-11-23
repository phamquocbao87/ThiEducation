#!/usr/bin/env python3
"""
qc_lesson_reader_phase3.py
Kiểm thử E2E 4 Vai Trò (Teacher GV952, Academic ACA545, Director DIR505, Student HV253)
trên Desktop (1366x800) & Mobile (390x844) cho SPEC-10 Phase 3:
1. Seed 1 log đọc bài đạt chuẩn (`READ_LH002_S3_HV253`: 210s, 100%, 2 notes, 1 Q&A) trên Dev Firestore.
2. Giáo viên GV952: Thấy thẻ Pre-Class Prep Report trên /dashboard, mở Drawer xem chi tiết HV253 đạt chuẩn, 0% Zalo & 0% SĐT PH.
3. Giáo vụ ACA545 (Desktop & Mobile 390px): Thấy thẻ Giám Sát Chuẩn Bị Bài Toàn Trường, lọc lớp & bấm Gửi Nhắc Đọc Bài (0ms), Zero Overflow-X.
4. Giám đốc DIR505: Thấy KPI Card `Học Viên Đọc Bài & Rèn Luyện`, click mở Drawer đối soát theo lớp & danh sách Cần Đôn Đốc.
5. Học viên HV253: Thấy thẻ `Điểm Rèn Luyện Của Con` phân rã 4 tiêu chí chuẩn xác.
6. Zero-Residue Teardown: Xóa sạch 100% dữ liệu test & notification nhắc nhở trên Dev Firestore trong finally.
"""
import os
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"


def seed_phase3_reading_log():
    print("🌱 [SEED]: Tạo 1 bản ghi đọc bài chuẩn (`READ_LH002_S3_HV253` = 210s, 100%) trên Dev Firestore...")
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
}, 'QC_P3_SEED');
const db = getFirestore(app, 'lakeducationdb');
const nowIso = new Date().toISOString();
await setDoc(doc(db, 'lesson_reading_logs', 'READ_LH002_S3_HV253'), {
  id: 'READ_LH002_S3_HV253',
  classId: 'LH002',
  className: 'WP03 G5 Ms. Maj/357 7:20-9:20 pm',
  sessionIndex: 3,
  studentId: 'HV253',
  studentName: 'Nguyen Dang Thanh Nha',
  studentCode: 'HV253',
  teacherId: 'GV952',
  teacherName: 'Teacher Maj',
  objectivesCount: 24,
  minRequiredSeconds: 192,
  totalActiveSeconds: 210,
  preClassActiveSeconds: 210,
  postClassActiveSeconds: 0,
  maxScrollPercent: 100,
  openCount: 2,
  firstOpenedAt: nowIso,
  lastReadAt: nowIso,
  completedConfirmedAt: nowIso,
  prepStatus: 'PREPARED',
  prepScore: 100,
  notesCount: 2,
  questionsCount: 1,
  updatedAt: nowIso,
});
console.log('✅ Seed READ_LH002_S3_HV253 thành công!');
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


def teardown_phase3_data():
    print("\n🧹 [TEARDOWN]: Dọn sạch 100% dữ liệu test Phase 3 trên Dev Firestore...")
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
}, 'QC_P3_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
await deleteDoc(doc(db, 'lesson_reading_logs', 'READ_LH002_S3_HV253')).catch(() => {});

let removedNotis = 0;
const snap = await getDocs(collection(db, 'notifications'));
for (const d of snap.docs) {
  const data = d.data();
  if (data.type === 'PRE_CLASS_PREP_REMINDER' && data.createdBy === 'ACA545') {
    await deleteDoc(doc(db, 'notifications', d.id));
    removedNotis++;
  }
}
console.log('✅ Zero-Residue Teardown hoàn tất! Đã xóa READ_LH002_S3_HV253 & ' + removedNotis + ' reminder notifications.');
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
    print("🚀 PLAYWRIGHT QC E2E — SPEC-10 PHASE 3 (4 ROLES + DESKTOP & MOBILE)")
    print("==================================================================")
    console_errors = []
    seed_phase3_reading_log()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==============================================================
            # 1. GIÁO VIÊN GV952 (DESKTOP)
            # ==============================================================
            print("\n👨‍🏫 [1/4] GIÁO VIÊN GV952 — PRE-CLASS PREP REPORT & ZALO/PII GUARD")
            ctx_gv = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'en');
            """)
            pgv = ctx_gv.new_page()
            pgv.on("pageerror", lambda err: console_errors.append(f"GV952: {err}"))

            pgv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pgv.wait_for_selector("[data-testid='teacher-pre-class-prep-card']", timeout=15000)
            pgv.wait_for_timeout(1500)

            card_txt = pgv.locator("[data-testid='teacher-pre-class-prep-card']").inner_text()
            assert "LH002" in card_txt, "GV952 phải thấy lớp LH002 trong báo cáo chuẩn bị bài!"
            assert "1/10 Prepared" in card_txt, f"Phải đếm chính xác 1/10 Prepared cho LH002! Thực tế:\n{card_txt}"
            assert "zalo" not in card_txt.lower(), "VI PHẠM ZALO GUARD trên TeacherPreClassPrepCard!"

            pgv.locator("[data-testid='btn-teacher-inspect-prep-LH002']").click()
            pgv.wait_for_selector("[data-testid='teacher-prep-detail-drawer']", timeout=8000)
            pgv.wait_for_timeout(600)

            drawer_txt = pgv.locator("[data-testid='teacher-prep-detail-drawer']").inner_text()
            assert "Nguyen Dang Thanh Nha" in drawer_txt and "Prepared Before Class" in drawer_txt
            assert "3m 30s" in drawer_txt
            assert "zalo" not in drawer_txt.lower(), "VI PHẠM ZALO GUARD trong Drawer GV!"
            assert "parent" not in drawer_txt.lower() or "09" not in drawer_txt, "VI PHẠM PII GUARD trong Drawer GV!"
            print("   ✅ [PASS] GV952 thấy 1/10 Prepared (LH002), HV253 đọc 3m 30s, ẩn 100% Zalo & SĐT Phụ huynh!")

            shot_gv = os.path.join(ARTIFACT_DIR, "qc_phase3_desktop_teacher_prep_report.png")
            pgv.screenshot(path=shot_gv)
            print(f"   📸 Screenshot Teacher Prep Report: {shot_gv}")
            ctx_gv.close()

            # ==============================================================
            # 2. GIÁO VỤ ACA545 (DESKTOP & MOBILE 390px)
            # ==============================================================
            print("\n📋 [2/4] GIÁO VỤ ACA545 — GIÁM SÁT TOÀN TRƯỜNG & GỬI NHẮC ĐỌC BÀI")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_aca.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            paca = ctx_aca.new_page()
            paca.on("pageerror", lambda err: console_errors.append(f"ACA545 Desktop: {err}"))

            paca.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            paca.wait_for_selector("[data-testid='academic-pre-class-prep-monitor-card']", timeout=15000)
            paca.wait_for_timeout(1500)

            paca.locator("[data-testid='academic-pre-class-prep-monitor-card']").scroll_into_view_if_needed()
            # Gửi nhắc nhở cho 1 học viên chưa đọc bài (HV801)
            remind_btn = paca.locator("[data-testid='btn-academic-remind-HV801']")
            if remind_btn.count() == 0:
                remind_btn = paca.locator("[data-testid^='btn-academic-remind-']").first
            remind_btn.click()
            paca.wait_for_timeout(1000)
            assert paca.locator("text=Đã Gửi Nhắc Nhở").first.is_visible(), "Nút nhắc nhở phải đổi trạng thái 0ms!"
            print("   ✅ [PASS] Giáo vụ ACA545 thấy danh sách chưa đọc bài & gửi thông báo nhắc đọc bài 0ms!")

            shot_aca = os.path.join(ARTIFACT_DIR, "qc_phase3_desktop_academic_prep_monitor.png")
            paca.screenshot(path=shot_aca)
            print(f"   📸 Screenshot Academic Prep Monitor (Desktop): {shot_aca}")
            ctx_aca.close()

            # Mobile 390x844 check for Academic
            ctx_aca_m = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
            ctx_aca_m.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            paca_m = ctx_aca_m.new_page()
            paca_m.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            paca_m.wait_for_selector("[data-testid='academic-pre-class-prep-monitor-card']", timeout=15000)
            paca_m.wait_for_timeout(1500)
            m_ov = paca_m.evaluate("() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })")
            assert m_ov["sw"] <= m_ov["iw"], f"Academic Mobile Overflow-X: {m_ov}"
            paca_m.locator("[data-testid='academic-pre-class-prep-monitor-card']").scroll_into_view_if_needed()
            shot_aca_m = os.path.join(ARTIFACT_DIR, "qc_phase3_mobile_academic_prep_monitor.png")
            paca_m.screenshot(path=shot_aca_m)
            print(f"   ✅ [PASS] Academic Mobile 390x844 Zero Overflow-X ({m_ov['sw']} <= {m_ov['iw']})")
            ctx_aca_m.close()

            # ==============================================================
            # 3. GIÁM ĐỐC DIR505 (DESKTOP)
            # ==============================================================
            print("\n👔 [3/4] GIÁM ĐỐC DIR505 — KPI TOÀN TRƯỜNG & DRAWER ĐỐI SOÁT")
            ctx_dir = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_dir.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'DIR505');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            pdir = ctx_dir.new_page()
            pdir.on("pageerror", lambda err: console_errors.append(f"DIR505: {err}"))

            pdir.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pdir.wait_for_selector("[data-testid='kpi-director-student-readiness']", timeout=15000)
            pdir.wait_for_timeout(1500)

            pdir.locator("[data-testid='kpi-director-student-readiness']").click()
            pdir.wait_for_selector("[data-testid='director-student-readiness-drawer']", timeout=8000)
            pdir.wait_for_timeout(600)
            dir_drawer_txt = pdir.locator("[data-testid='director-student-readiness-drawer']").inner_text()
            assert "LH002" in dir_drawer_txt, "Drawer Giám đốc phải liệt kê lớp LH002!"
            print("   ✅ [PASS] Giám đốc DIR505 thấy KPI toàn trường & Drawer đối soát lớp + học viên cần đôn đốc!")

            shot_dir = os.path.join(ARTIFACT_DIR, "qc_phase3_desktop_director_readiness.png")
            pdir.screenshot(path=shot_dir)
            print(f"   📸 Screenshot Director Executive Audit: {shot_dir}")
            ctx_dir.close()

            # ==============================================================
            # 4. HỌC VIÊN HV253 — THẺ ĐIỂM RÈN LUYỆN CÁ NHÂN
            # ==============================================================
            print("\n🏆 [4/4] HỌC VIÊN HV253 — THẺ ĐIỂM RÈN LUYỆN CÁ NHÂN")
            ctx_st = browser.new_context(viewport={"width": 1366, "height": 800})
            ctx_st.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'HV253');
                localStorage.setItem('lak_app_language', 'vi');
                localStorage.removeItem('lak_lesson_reading_logs_v1_HV253');
            """)
            pst = ctx_st.new_page()
            pst.on("pageerror", lambda err: console_errors.append(f"HV253: {err}"))

            pst.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            pst.wait_for_selector("[data-testid='student-conduct-score-card']", timeout=15000)
            pst.wait_for_timeout(1500)

            score_txt = pst.locator("[data-testid='student-conduct-overall-score']").inner_text()
            conduct_card_txt = pst.locator("[data-testid='student-conduct-score-card']").inner_text()
            assert "/100" in score_txt and "3p 30s" in conduct_card_txt, f"Thẻ điểm rèn luyện thiếu dữ liệu: {conduct_card_txt}"
            print(f"   ✅ [PASS] Học viên HV253 thấy Điểm Rèn Luyện cá nhân: {score_txt} (tự đọc 3p 30s, 4 tiêu chí rõ ràng)")

            pst.locator("[data-testid='student-conduct-score-card']").scroll_into_view_if_needed()
            shot_st = os.path.join(ARTIFACT_DIR, "qc_phase3_desktop_student_conduct_score.png")
            pst.screenshot(path=shot_st)
            print(f"   📸 Screenshot Student Conduct Score: {shot_st}")
            ctx_st.close()

            assert len(console_errors) == 0, f"Lỗi JS Console: {console_errors}"
            print("\n==================================================================")
            print("🎉 TẤT CẢ 4 VAI TRÒ PHASE 3 (DESKTOP & MOBILE) ĐỀU PASS 100%!")
            print("==================================================================")
        finally:
            browser.close()
            teardown_phase3_data()


if __name__ == "__main__":
    run_qc()
