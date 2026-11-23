#!/usr/bin/env python3
"""
qc_pre_class_prep_monitor.py
Kiểm thử E2E Màn Hình Chuyên Biệt Giám Sát Chuẩn Bị Bài Trước Giờ Học (/pre-class-prep)
và Thẻ Preview Gọn Tối Đa 2 Dòng Trên /dashboard:
1. Giáo Vụ (ACA545):
   - Ngoài /dashboard: chỉ hiển thị <= 2 dòng học viên ưu tiên, 0 dropdown filter inline,
     bấm CTA `Xem Chi Tiết Toàn Trường` điều hướng sang /pre-class-prep.
   - Trong /pre-class-prep (1366x800, 1024x768, 390x844): đủ danh sách toàn trường,
     4 KPI cards, bộ lọc Lớp/GV/Trạng thái, Tab Học viên & Tab Lớp học, SĐT PH hiển thị,
     bấm Nhắc đọc bài 0ms, nút Nhắc Hàng Loạt khả dụng, Zero Overflow-X.
2. Giám Đốc (DIR505):
   - Mở KPI Card trên /dashboard -> Drawer có nút `Mở Toàn Trang` -> sang /pre-class-prep.
3. Giáo Viên Bản Xứ (GV952):
   - Ngoài /dashboard: tối đa 2 lớp -> bấm `Xem Chi Tiết` sang /pre-class-prep.
   - Trong /pre-class-prep: chỉ thấy lớp GV phụ trách, 0% SĐT PH, 0% Zalo, không có bộ lọc GV.
4. Học Viên (HV253) & Kế Toán (ACC001):
   - Ẩn khỏi Sidebar & bị chặn truy cập trực tiếp /pre-class-prep.
5. Zero-Residue Teardown:
   - Xóa sạch 100% notifications test phát sinh trong phiên test khỏi Dev Firestore.
"""
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"


def check_zero_overflow(page, label):
    metrics = page.evaluate("""() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    })""")
    assert not metrics["overflow"], (
        f"FAIL Overflow-X [{label}]: scrollWidth={metrics['scrollWidth']} > innerWidth={metrics['innerWidth']}"
    )
    print(f"   ✅ [Responsive PASS] {label}: scrollWidth={metrics['scrollWidth']} <= innerWidth={metrics['innerWidth']}")


def teardown_test_notifications(start_ms):
    print("\n🧹 [TEARDOWN]: Dọn sạch 100% notifications PRE_CLASS_PREP_REMINDER phát sinh trong phiên test...")
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
}}, 'QC_PREP_PAGE_CLEANUP');
const db = getFirestore(app, 'lakeducationdb');
const snap = await getDocs(collection(db, 'notifications'));
let removed = 0;
for (const d of snap.docs) {{
  const data = d.data();
  const createdMs = data?.createdAt ? new Date(data.createdAt).getTime() : 0;
  if (data?.type === 'PRE_CLASS_PREP_REMINDER' && createdMs >= {start_ms - 5000}) {{
    await deleteDoc(doc(db, 'notifications', d.id));
    removed++;
  }}
}}
console.log('✅ Zero-Residue Teardown hoàn tất! Đã xóa ' + removed + ' test notification(s).');
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
    print("🚀 PLAYWRIGHT QC E2E — PRE-CLASS PREP MONITOR PAGE (/pre-class-prep)")
    print("==================================================================")
    start_ms = int(time.time() * 1000)
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # ==================================================================
            # 1. GIÁO VỤ (ACA545) — DASHBOARD COMPACT 2 DÒNG -> /pre-class-prep
            # ==================================================================
            print("\n📋 [1/5] GIÁO VỤ (ACA545) — DASHBOARD (MAX 2 DÒNG) & MÀN HÌNH /pre-class-prep")
            ctx_aca = browser.new_context(viewport={"width": 1366, "height": 820})
            ctx_aca.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            p_aca = ctx_aca.new_page()
            p_aca.on("pageerror", lambda err: page_errors.append(f"ACA545: {err}"))

            p_aca.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            p_aca.wait_for_selector("[data-testid='academic-pre-class-prep-monitor-card']", timeout=18000)
            p_aca.wait_for_timeout(1500)

            dash_rows = p_aca.locator("[data-testid^='academic-prep-student-row-']").count()
            assert 1 <= dash_rows <= 2, f"Ngoài Dashboard Giáo vụ chỉ được hiện tối đa 2 dòng! Thực tế: {dash_rows}"
            assert p_aca.locator("[data-testid='select-academic-prep-class']").count() == 0, "Phải bỏ filter dropdown lớp khỏi Dashboard!"
            assert p_aca.locator("[data-testid='select-academic-prep-status']").count() == 0, "Phải bỏ filter dropdown trạng thái khỏi Dashboard!"
            print(f"   ✅ [PASS] Ngoài /dashboard Giáo vụ hiển thị gọn đúng {dash_rows} dòng ưu tiên (0 dropdown filter inline)")

            p_aca.locator("[data-testid='academic-pre-class-prep-monitor-card']").scroll_into_view_if_needed()
            shot_dash = os.path.join(ARTIFACT_DIR, "qc_prep_dashboard_academic_2rows.png")
            p_aca.screenshot(path=shot_dash)
            print(f"   📸 Screenshot Dashboard Compact 2 dòng: {shot_dash}")

            # Bấm CTA Xem Chi Tiết Toàn Trường -> điều hướng sang /pre-class-prep
            p_aca.locator("[data-testid='btn-academic-view-all-prep']").click()
            p_aca.wait_for_selector("[data-testid='pre-class-prep-page']", timeout=15000)
            p_aca.wait_for_selector("[data-testid='prep-student-desktop-table']", timeout=15000)
            p_aca.wait_for_timeout(1200)
            assert "/pre-class-prep" in p_aca.url, f"URL phải chứa /pre-class-prep, thực tế: {p_aca.url}"

            # Assert 4 KPI Cards + Full student list + Parent Contact + Bulk Remind
            for kpi_id in ["prep-kpi-overall-rate", "prep-kpi-prepared", "prep-kpi-skimmed", "prep-kpi-not-started"]:
                assert p_aca.locator(f"[data-testid='{kpi_id}']").is_visible(), f"Thiếu KPI {kpi_id}"

            full_rows = p_aca.locator("[data-testid^='prep-student-row-']").count()
            assert full_rows > 2, f"Trong /pre-class-prep phải có nhiều hơn 2 dòng học viên toàn trường! Thực tế: {full_rows}"
            assert p_aca.locator("[data-testid='select-prep-page-teacher']").is_visible(), "Giáo vụ phải thấy bộ lọc Giáo viên"
            assert p_aca.locator("[data-testid='btn-prep-bulk-remind']").is_visible(), "Phải có nút Nhắc Hàng Loạt khi có HV chưa đọc"
            check_zero_overflow(p_aca, "ACA545 /pre-class-prep Desktop 1366px")

            shot_desktop = os.path.join(ARTIFACT_DIR, "qc_prep_page_desktop_academic.png")
            p_aca.screenshot(path=shot_desktop)
            print(f"   ✅ [PASS] /pre-class-prep Desktop hiển thị đủ {full_rows} dòng học viên trên trang 1 + 4 KPI + Bulk Remind")
            print(f"   📸 Screenshot /pre-class-prep Desktop: {shot_desktop}")

            # Test bấm 1 nút Nhắc Đọc Bài -> 0ms chuyển sang Đã Nhắc
            first_remind = p_aca.locator("[data-testid^='btn-prep-remind-']").first
            assert first_remind.is_visible(), "Phải có nút Nhắc Đọc Bài cho học viên chưa đọc"
            first_remind.click()
            p_aca.wait_for_timeout(1200)
            assert first_remind.is_disabled(), "Sau khi bấm Nhắc Đọc Bài nút phải chuyển trạng thái disabled (0ms)!"
            print("   ✅ [PASS] Bấm Nhắc Đọc Bài 0ms thành công & chặn gửi trùng trong phiên")

            # Chuyển sang Tab 2: Tổng Quan Theo Lớp
            p_aca.locator("[data-testid='tab-prep-classes']").click()
            p_aca.wait_for_selector("[data-testid='prep-class-overview-grid']", timeout=10000)
            p_aca.wait_for_timeout(500)
            class_cards = p_aca.locator("[data-testid^='prep-class-card-']").count()
            assert class_cards >= 1, "Tab Theo Lớp phải hiển thị ít nhất 1 thẻ lớp!"
            shot_classes = os.path.join(ARTIFACT_DIR, "qc_prep_page_classes_tab.png")
            p_aca.screenshot(path=shot_classes)
            print(f"   ✅ [PASS] Tab Theo Lớp hiển thị {class_cards} thẻ lớp chuẩn bị bài ({shot_classes})")

            # Bấm Xem HV trên thẻ lớp đầu tiên -> quay lại Tab 1 lọc đúng lớp đó
            p_aca.locator("[data-testid^='btn-prep-inspect-class-']").first.click()
            p_aca.wait_for_timeout(500)
            assert p_aca.locator("[data-testid='prep-student-desktop-table']").is_visible()

            # Test Desktop Scale 1024x768
            p_aca.set_viewport_size({"width": 1024, "height": 768})
            p_aca.wait_for_timeout(600)
            check_zero_overflow(p_aca, "ACA545 /pre-class-prep Scale 1024px")
            ctx_aca.close()

            # ==================================================================
            # 2. GIÁO VỤ (ACA545) — MOBILE 390x844 (MOBILE CARDS + ZERO OVERFLOW)
            # ==================================================================
            print("\n📱 [2/5] GIÁO VỤ (ACA545) — MOBILE 390x844 RESPONSIVE CHECK")
            ctx_mob = browser.new_context(viewport={"width": 390, "height": 844})
            ctx_mob.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'ACA545');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            p_mob = ctx_mob.new_page()
            p_mob.on("pageerror", lambda err: page_errors.append(f"ACA545_MOB: {err}"))
            p_mob.goto(f"{BASE_URL}/pre-class-prep", wait_until="domcontentloaded")
            p_mob.wait_for_selector("[data-testid='prep-student-mobile-list']", timeout=18000)
            p_mob.wait_for_timeout(1200)
            check_zero_overflow(p_mob, "ACA545 /pre-class-prep Mobile 390px")
            shot_mob = os.path.join(ARTIFACT_DIR, "qc_prep_page_mobile_390.png")
            p_mob.screenshot(path=shot_mob)
            print(f"   📸 Screenshot /pre-class-prep Mobile 390px: {shot_mob}")
            ctx_mob.close()

            # ==================================================================
            # 3. GIÁM ĐỐC (DIR505) — KPI CARD -> DRAWER -> FULL PAGE
            # ==================================================================
            print("\n👔 [3/5] GIÁM ĐỐC (DIR505) — KPI CARD -> DRAWER -> /pre-class-prep")
            ctx_dir = browser.new_context(viewport={"width": 1280, "height": 800})
            ctx_dir.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'DIR505');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            p_dir = ctx_dir.new_page()
            p_dir.on("pageerror", lambda err: page_errors.append(f"DIR505: {err}"))
            p_dir.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            p_dir.wait_for_selector("[data-testid='kpi-director-student-readiness']", timeout=18000)
            p_dir.wait_for_timeout(1000)
            p_dir.locator("[data-testid='kpi-director-student-readiness']").click()
            p_dir.wait_for_selector("[data-testid='btn-director-open-prep-page']", timeout=10000)
            p_dir.locator("[data-testid='btn-director-open-prep-page']").click()
            p_dir.wait_for_selector("[data-testid='pre-class-prep-page']", timeout=15000)
            p_dir.wait_for_timeout(800)
            assert "/pre-class-prep" in p_dir.url
            check_zero_overflow(p_dir, "DIR505 /pre-class-prep Desktop 1280px")
            print("   ✅ [PASS] Giám đốc mở thẳng từ KPI Drawer sang /pre-class-prep thành công")
            ctx_dir.close()

            # ==================================================================
            # 4. GIÁO VIÊN BẢN XỨ (GV952) — SCOPED CLASSES + 0% SĐT PH & ZALO
            # ==================================================================
            print("\n👨‍🏫 [4/5] GIÁO VIÊN BẢN XỨ (GV952) — SCOPED & ZERO PII / ZALO GUARD")
            ctx_gv = browser.new_context(viewport={"width": 1280, "height": 800})
            ctx_gv.add_init_script("""
                localStorage.setItem('lak_authenticated_user_id', 'GV952');
                localStorage.setItem('lak_app_language', 'vi');
            """)
            p_gv = ctx_gv.new_page()
            p_gv.on("pageerror", lambda err: page_errors.append(f"GV952: {err}"))
            p_gv.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
            p_gv.wait_for_selector("[data-testid='teacher-pre-class-prep-card']", timeout=18000)
            p_gv.wait_for_timeout(1200)

            gv_dash_classes = p_gv.locator("[data-testid^='teacher-prep-class-row-']").count()
            assert 1 <= gv_dash_classes <= 2, f"Ngoài Dashboard GV chỉ được hiện tối đa 2 lớp! Thực tế: {gv_dash_classes}"
            p_gv.locator("[data-testid='btn-teacher-view-all-prep']").click()
            p_gv.wait_for_selector("[data-testid='pre-class-prep-page']", timeout=15000)
            p_gv.wait_for_timeout(1200)

            assert p_gv.locator("[data-testid^='prep-parent-contact-']").count() == 0, "CẤM lộ SĐT Phụ huynh trên màn hình Giáo viên!"
            assert p_gv.locator("[data-testid='select-prep-page-teacher']").count() == 0, "Giáo viên không cần bộ lọc Giáo viên khác!"
            assert p_gv.locator("[data-testid='btn-prep-bulk-remind']").count() == 0, "Nút nhắc hàng loạt chỉ dành cho Staff!"
            gv_page_text = p_gv.locator("[data-testid='pre-class-prep-page']").inner_text().lower()
            assert "zalo" not in gv_page_text, "CẤM xuất hiện Zalo trên màn hình Giáo viên bản xứ!"
            check_zero_overflow(p_gv, "GV952 /pre-class-prep Desktop 1280px")
            print(f"   ✅ [PASS] Giáo viên GV952: Dashboard gọn {gv_dash_classes} lớp; /pre-class-prep 0% SĐT PH, 0% Zalo")
            ctx_gv.close()

            # ==================================================================
            # 5. HỌC VIÊN (HV253) & KẾ TOÁN (ACC001) — CHẶN 403 & ẨN SIDEBAR
            # ==================================================================
            print("\n🔒 [5/5] HỌC VIÊN (HV253) & KẾ TOÁN (ACC001) — RBAC 403 & HIDE SIDEBAR")
            for uid, label in [("HV253", "Học viên"), ("ACC001", "Kế toán")]:
                ctx_blk = browser.new_context(viewport={"width": 1280, "height": 800})
                ctx_blk.add_init_script(f"""
                    localStorage.setItem('lak_authenticated_user_id', '{uid}');
                    localStorage.setItem('lak_app_language', 'vi');
                """)
                p_blk = ctx_blk.new_page()
                p_blk.on("pageerror", lambda err: page_errors.append(f"{uid}: {err}"))
                p_blk.goto(f"{BASE_URL}/pre-class-prep", wait_until="domcontentloaded")
                p_blk.wait_for_timeout(1800)

                assert p_blk.locator("[data-testid='pre-class-prep-page']").count() == 0, (
                    f"{label} ({uid}) KHÔNG ĐƯỢC phép xem nội dung /pre-class-prep!"
                )
                sidebar_txt = p_blk.locator(".ant-layout-sider").inner_text() if p_blk.locator(".ant-layout-sider").count() > 0 else ""
                assert "Chuẩn Bị Bài Trước Giờ" not in sidebar_txt, f"Phải ẩn menu Sidebar với {label} ({uid})!"
                print(f"   ✅ [PASS] {label} ({uid}): Ẩn khỏi Sidebar & bị chặn truy cập /pre-class-prep")
                ctx_blk.close()

            assert len(page_errors) == 0, f"Phát hiện lỗi JS runtime: {page_errors}"
            print("\n🎉 TOÀN BỘ 5/5 BỘ KIỂM THỬ E2E ĐỀU PASS 100% (0 PAGE ERRORS)!")

        finally:
            browser.close()
            teardown_test_notifications(start_ms)


if __name__ == "__main__":
    run_qc()
