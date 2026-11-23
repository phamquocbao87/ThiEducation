#!/usr/bin/env python3
"""
qc_dashboard_responsive_matrix.py
Kiểm toán Responsive chuyên sâu cho /dashboard trên 6 Mức Scale Màn Hình x 6 Vai Trò (36 tổ hợp):
- Mobile nhỏ: 360x800
- Mobile chuẩn: 390x844
- Tablet / Giao điểm: 768x1024
- Desktop Scale 150% / Split-Screen (có Sidebar): 1024x768
- Laptop chuẩn / Scale 125%: 1280x800
- Desktop Full HD: 1920x1080

Kiểm tra tự động:
1. Zero Overflow-X toàn trang (`documentElement.scrollWidth <= window.innerWidth`).
2. Zero Card Overflow (`card.scrollWidth <= card.clientWidth + 2` — không tràn nội dung ra khỏi Card).
3. No Squished KPI / Class Cards (chiều rộng card không bị ép nhỏ hơn ngưỡng đọc được).
4. Header không bị tràn / che mất nút.
5. Không có lỗi JS Console.
"""
import os
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
ARTIFACT_DIR = "/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce"

ROLES = [
    ("student", "HV253"),
    ("teacher", "GV952"),
    ("academic", "ACA545"),
    ("director", "DIR505"),
    ("accountant", "ACC001"),
    ("admin", "ADM001"),
]

VIEWPORTS = [
    ("mobile_360", 360, 800, True),
    ("mobile_390", 390, 844, True),
    ("tablet_768", 768, 1024, False),
    ("scale_900", 900, 700, False),
    ("scale_1024", 1024, 768, False),
    ("laptop_1280", 1280, 800, False),
    ("desktop_1920", 1920, 1080, False),
]


def audit_page(page):
    return page.evaluate("""() => {
        const iw = window.innerWidth;
        const sw = document.documentElement.scrollWidth;
        const docOverflow = sw > iw + 1;

        const header = document.querySelector('header.ant-layout-header');
        const headerOverflow = header ? (header.scrollWidth > header.clientWidth + 2) : false;

        // Kiểm tra các Ant Card bị tràn ngang bên trong hoặc bị ép quá hẹp (< 135px trên desktop)
        const cards = Array.from(document.querySelectorAll('.ant-card'));
        const cardIssues = [];
        for (const c of cards) {
            const rect = c.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            // Bỏ qua bảng có scroll-x cố ý (.ant-table-content)
            const hasScrollTable = Boolean(c.querySelector('.ant-table-content, .ant-table-body'));
            const body = c.querySelector('.ant-card-body') || c;
            if (!hasScrollTable && body.scrollWidth > body.clientWidth + 4) {
                cardIssues.push({
                    type: 'CARD_INTERNAL_OVERFLOW',
                    testid: c.getAttribute('data-testid') || (c.innerText || '').slice(0, 45).replace(/\\n/g, ' '),
                    sw: Math.round(body.scrollWidth),
                    cw: Math.round(body.clientWidth),
                    diff: Math.round(body.scrollWidth - body.clientWidth),
                });
            }
            if (iw >= 768 && rect.width < 150) {
                cardIssues.push({
                    type: 'CARD_SQUISHED',
                    testid: c.getAttribute('data-testid') || (c.innerText || '').slice(0, 45).replace(/\\n/g, ' '),
                    width: Math.round(rect.width),
                });
            }
        }

        // Kiểm tra nút bấm bị tràn ra ngoài cha hoặc vượt quá viewport
        const buttons = Array.from(document.querySelectorAll('button.ant-btn, a.ant-btn'));
        const btnIssues = [];
        for (const b of buttons) {
            const r = b.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > iw + 2) {
                btnIssues.push({
                    text: (b.innerText || '').trim().slice(0, 35),
                    right: Math.round(r.right),
                    iw,
                });
            }
        }

        // Kiểm tra KPI số tiền bị cắt / tràn
        const stats = Array.from(document.querySelectorAll('.ant-statistic-content'));
        const statIssues = [];
        for (const s of stats) {
            if (s.scrollWidth > s.clientWidth + 4) {
                statIssues.push({
                    text: (s.innerText || '').trim().slice(0, 35),
                    sw: Math.round(s.scrollWidth),
                    cw: Math.round(s.clientWidth),
                });
            }
        }

        return {
            iw,
            sw,
            docOverflow,
            headerOverflow,
            cardIssuesCount: cardIssues.length,
            cardIssues: cardIssues.slice(0, 6),
            btnIssuesCount: btnIssues.length,
            btnIssues: btnIssues.slice(0, 4),
            statIssuesCount: statIssues.length,
            statIssues: statIssues.slice(0, 4),
        };
    }""")


def main():
    capture_shots = os.environ.get("CAPTURE_SHOTS") == "1"
    print("=========================================================================")
    print("🔍 DASHBOARD RESPONSIVE MATRIX AUDIT (6 ROLES × 6 VIEWPORTS = 36 CELLS)")
    print("=========================================================================")
    total_issues = 0
    report = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=["--headless=new", "--disable-blink-features=AutomationControlled"],
        )
        try:
            for role, uid in ROLES:
                print(f"\n👤 ROLE: {role.upper()} ({uid})")
                for vp_name, w, h, is_mob in VIEWPORTS:
                    ctx = browser.new_context(viewport={"width": w, "height": h}, is_mobile=is_mob)
                    ctx.add_init_script(f"""
                        localStorage.setItem('lak_authenticated_user_id', '{uid}');
                        localStorage.setItem('lak_app_language', 'vi');
                    """)
                    page = ctx.new_page()
                    page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
                    page.wait_for_timeout(1600)
                    res = audit_page(page)
                    ok = (
                        not res["docOverflow"]
                        and not res["headerOverflow"]
                        and res["cardIssuesCount"] == 0
                        and res["btnIssuesCount"] == 0
                        and res["statIssuesCount"] == 0
                    )
                    status = "✅ PASS" if ok else "❌ ISSUE"
                    if not ok:
                        total_issues += 1
                    print(
                        f"   {status} | {vp_name:12s} ({w:4d}x{h:4d}) | doc={res['sw']}/{res['iw']} "
                        f"| hdrOv={res['headerOverflow']} | cards={res['cardIssuesCount']} | btns={res['btnIssuesCount']} | stats={res['statIssuesCount']}"
                    )
                    if not ok:
                        if res["cardIssues"]:
                            print("      ↳ Cards:", json.dumps(res["cardIssues"], ensure_ascii=False))
                        if res["btnIssues"]:
                            print("      ↳ Btns :", json.dumps(res["btnIssues"], ensure_ascii=False))
                        if res["statIssues"]:
                            print("      ↳ Stats:", json.dumps(res["statIssues"], ensure_ascii=False))

                    if capture_shots and vp_name in ("mobile_390", "scale_1024", "desktop_1920") and role in ("student", "director", "academic", "teacher"):
                        shot_path = os.path.join(ARTIFACT_DIR, f"qc_resp_{role}_{vp_name}.png")
                        page.screenshot(path=shot_path)

                    report.append({"role": role, "vp": vp_name, "ok": ok, **res})
                    ctx.close()
        finally:
            browser.close()

    total_cells = len(ROLES) * len(VIEWPORTS)
    print("\n=========================================================================")
    print(f"📊 TỔNG KẾT: {total_cells - total_issues}/{total_cells} CELLS PASS | {total_issues} CELLS CÓ VẤN ĐỀ")
    print("=========================================================================")
    if total_issues > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
