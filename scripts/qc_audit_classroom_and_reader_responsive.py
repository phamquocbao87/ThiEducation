#!/usr/bin/env python3
"""
qc_audit_classroom_and_reader_responsive.py
Kiểm toán Responsive thực tế (100% Read-Only, không ghi DB) trên 4 viewports:
- Mobile hẹp: 360x800
- Mobile chuẩn: 390x844
- Desktop Scale/Zoom: 1024x768
- Desktop Full: 1366x820

Cho cả 3 màn hình trọng tâm:
1. /classroom/LH002 (Tab Soạn Giáo Án & Học Liệu + Modal Soạn Giáo Án có 2 control Autocomplete/Trang)
2. /dashboard Học viên HV253 (LessonOverviewCompactCard + StudentClassMaterialsCard)
3. Book Reader Toàn Màn Hình (LessonBookReaderModal)
"""
import os
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"
BASE_URL = "http://127.0.0.1:3000"

VIEWPORTS = [
    ("mobile_360", 360, 800),
    ("mobile_390", 390, 844),
    ("scale_1024", 1024, 768),
    ("desktop_1366", 1366, 820),
]


def audit_metrics(page, label, extra_selector=None):
    return page.evaluate(
        """({ extraSelector }) => {
            const vw = window.innerWidth;
            const sw = document.documentElement.scrollWidth;
            const docOverflow = sw > vw + 1;

            const header = document.querySelector('.ant-layout-header');
            const headerOverflow = header ? (header.scrollWidth > vw + 1) : false;

            const root = extraSelector ? document.querySelector(extraSelector) : document.body;
            const clippedButtons = [];
            const clippedInputs = [];
            const clippedTabs = [];

            if (root) {
                const isInsideScrollableX = (node) => {
                    let cur = node.parentElement;
                    while (cur && cur !== document.body) {
                        const st = window.getComputedStyle(cur);
                        if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && cur.scrollWidth > cur.clientWidth) {
                            return true;
                        }
                        cur = cur.parentElement;
                    }
                    return false;
                };

                root.querySelectorAll('button, a.ant-btn, .ant-segmented').forEach((el) => {
                    if (isInsideScrollableX(el)) return;
                    const r = el.getBoundingClientRect();
                    if (r.width === 0 || r.height === 0) return;
                    if (r.right > vw + 2 || r.left < -2) {
                        clippedButtons.push({
                            text: (el.innerText || el.className || '').trim().slice(0, 40),
                            left: Math.round(r.left),
                            right: Math.round(r.right),
                            vw,
                        });
                    }
                });

                root.querySelectorAll('.ant-select, input.ant-input, .ant-input-affix-wrapper').forEach((el) => {
                    const r = el.getBoundingClientRect();
                    if (r.width === 0 || r.height === 0) return;
                    if (r.right > vw + 2 || r.left < -2) {
                        clippedInputs.push({
                            cls: el.className.slice(0, 40),
                            right: Math.round(r.right),
                            vw,
                        });
                    }
                });

                const moreTab = root.querySelector('.ant-tabs-nav-more');
                if (moreTab) {
                    const mr = moreTab.getBoundingClientRect();
                    const style = window.getComputedStyle(moreTab);
                    if (mr.width > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
                        clippedTabs.push('ant-tabs-nav-more visible');
                    }
                }
            }

            let modalOverflow = false;
            const modal = document.querySelector('.ant-modal');
            if (modal) {
                const mr = modal.getBoundingClientRect();
                if (mr.width > 0 && (mr.right > vw + 2 || mr.left < -2 || modal.scrollWidth > modal.clientWidth + 2)) {
                    modalOverflow = {
                        left: Math.round(mr.left),
                        right: Math.round(mr.right),
                        scrollWidth: modal.scrollWidth,
                        clientWidth: modal.clientWidth,
                        vw,
                    };
                }
            }

            return {
                vw,
                sw,
                docOverflow,
                headerOverflow,
                modalOverflow,
                clippedButtonsCount: clippedButtons.length,
                clippedButtons: clippedButtons.slice(0, 5),
                clippedInputsCount: clippedInputs.length,
                clippedInputs: clippedInputs.slice(0, 5),
                clippedTabs,
            };
        }""",
        {"extraSelector": extra_selector},
    )


def run_audit():
    print("===========================================================================")
    print("🔍 AUDIT RESPONSIVE MOBILE & DESKTOP — CLASSROOM / SOẠN GIÁO ÁN / BOOK READER")
    print("===========================================================================")
    issues = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )

        try:
            # 1. CLASSROOM + MODAL SOẠN GIÁO ÁN (GV952)
            print("\n📘 [1/3] CLASSROOM (/classroom/LH002) — TAB SOẠN GIÁO ÁN & MODAL SOẠN GIÁO ÁN")
            for vp_name, w, h in VIEWPORTS:
                ctx = browser.new_context(viewport={"width": w, "height": h})
                ctx.add_init_script("""
                    localStorage.setItem('lak_authenticated_user_id', 'GV952');
                    localStorage.setItem('lak_app_language', 'vi');
                """)
                page = ctx.new_page()
                page.goto(f"{BASE_URL}/classroom/LH002", wait_until="domcontentloaded")
                page.wait_for_selector("[data-testid='tab-curriculum']", timeout=18000)
                page.locator("[data-testid='tab-curriculum']").click()
                page.wait_for_selector("[data-testid='btn-open-lesson-editor']", timeout=15000)
                page.wait_for_timeout(800)

                m_page = audit_metrics(page, f"ClassroomCurriculum_{vp_name}")
                ok_p = not m_page["docOverflow"] and not m_page["headerOverflow"] and m_page["clippedButtonsCount"] == 0 and m_page["clippedInputsCount"] == 0
                status_p = "✅ PASS" if ok_p else "❌ FAIL"
                print(f"   {status_p} Classroom Curriculum [{vp_name} {w}x{h}]: sw={m_page['sw']}/{w} hdrOv={m_page['headerOverflow']} btns={m_page['clippedButtonsCount']} inps={m_page['clippedInputsCount']} tabs={m_page['clippedTabs']}")
                if not ok_p or m_page["clippedTabs"]:
                    issues.append(("Classroom Curriculum", vp_name, m_page))

                if vp_name in ("mobile_390", "desktop_1366"):
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, f"audit_classroom_curriculum_{vp_name}.png"))

                # Mở Modal Soạn Giáo Án + thêm 2 dòng tài liệu
                page.locator("[data-testid='btn-open-lesson-editor']").click()
                page.wait_for_selector("[data-testid='lesson-material-autocomplete-wrapper']", timeout=12000)
                page.wait_for_timeout(700)
                page.locator("[data-testid='btn-add-lesson-material-row']").scroll_into_view_if_needed()
                page.locator("[data-testid='btn-add-lesson-material-row']").click()
                page.wait_for_timeout(400)

                m_mod = audit_metrics(page, f"LessonPlanModal_{vp_name}", ".ant-modal")
                ok_m = not m_mod["docOverflow"] and not m_mod["modalOverflow"] and m_mod["clippedButtonsCount"] == 0 and m_mod["clippedInputsCount"] == 0
                status_m = "✅ PASS" if ok_m else "❌ FAIL"
                print(f"   {status_m} Modal Soạn Giáo Án  [{vp_name} {w}x{h}]: sw={m_mod['sw']}/{w} modalOv={m_mod['modalOverflow']} btns={m_mod['clippedButtonsCount']} inps={m_mod['clippedInputsCount']}")
                if not ok_m:
                    issues.append(("Modal Soạn Giáo Án", vp_name, m_mod))

                if vp_name in ("mobile_390", "desktop_1366"):
                    page.locator("[data-testid='lesson-material-autocomplete-wrapper']").scroll_into_view_if_needed()
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, f"audit_lesson_editor_modal_{vp_name}.png"))

                ctx.close()

            # 2 & 3. DASHBOARD HỌC VIÊN (LessonOverviewCompactCard) + BOOK READER FULL-SCREEN (HV253)
            print("\n🎓 [2/3 & 3/3] DASHBOARD HỌC VIÊN (HV253) & BOOK READER TOÀN MÀN HÌNH")
            for vp_name, w, h in VIEWPORTS:
                ctx = browser.new_context(viewport={"width": w, "height": h})
                ctx.add_init_script("""
                    localStorage.setItem('lak_authenticated_user_id', 'HV253');
                    localStorage.setItem('lak_app_language', 'vi');
                """)
                page = ctx.new_page()
                page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
                page.wait_for_selector("[data-testid='pre-class-prep-guide']", timeout=18000)
                page.wait_for_timeout(900)

                m_dash = audit_metrics(page, f"StudentDashboard_{vp_name}")
                ok_d = not m_dash["docOverflow"] and not m_dash["headerOverflow"] and m_dash["clippedButtonsCount"] == 0
                status_d = "✅ PASS" if ok_d else "❌ FAIL"
                print(f"   {status_d} Student Dashboard   [{vp_name} {w}x{h}]: sw={m_dash['sw']}/{w} hdrOv={m_dash['headerOverflow']} btns={m_dash['clippedButtonsCount']}")
                if not ok_d:
                    issues.append(("Student Dashboard", vp_name, m_dash))

                if vp_name == "mobile_390":
                    page.locator("[data-testid='pre-class-prep-guide']").scroll_into_view_if_needed()
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, "audit_lesson_overview_mobile_390.png"))

                # Mở Book Reader Full-Screen
                page.locator("[data-testid='lesson-overview-compact-trigger']").click()
                page.wait_for_selector("[data-testid='reader-completion-footer']", timeout=12000)
                page.wait_for_timeout(700)

                m_reader = audit_metrics(page, f"BookReader_{vp_name}")
                ok_r = not m_reader["docOverflow"] and m_reader["clippedButtonsCount"] == 0
                status_r = "✅ PASS" if ok_r else "❌ FAIL"
                print(f"   {status_r} Book Reader Modal   [{vp_name} {w}x{h}]: sw={m_reader['sw']}/{w} btns={m_reader['clippedButtonsCount']}")
                if not ok_r:
                    issues.append(("Book Reader", vp_name, m_reader))

                if vp_name in ("mobile_390", "desktop_1366"):
                    page.screenshot(path=os.path.join(ARTIFACT_DIR, f"audit_book_reader_{vp_name}.png"))

                ctx.close()

            print("\n===========================================================================")
            if not issues:
                print("🎉 KẾT LUẬN: TẤT CẢ 16/16 KIỂM TRA RESPONSIVE ĐỀU PASS 100%!")
            else:
                print(f"⚠️ PHÁT HIỆN {len(issues)} ĐIỂM CẦN TINH CHỈNH:")
                for screen, vp, detail in issues:
                    print(f"   - [{screen} | {vp}]: {detail}")
            print("===========================================================================")
        finally:
            browser.close()


if __name__ == "__main__":
    run_audit()
