"""
Diagnostic Mobile Auditor for http://localhost:3000/dashboard across all 6 roles
Captures screenshots, detects overflow-x, checks awkward line wrapping, card layouts, and badges.
"""
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3000'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
ARTIFACT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/mobile_audit'

ROLES = [
    ('admin', 'ADM001', 'Admin Quốc Bảo'),
    ('director', 'DIR505', 'Giám Đốc Hiếu Thi'),
    ('academic', 'ACA404', 'Giáo Vụ Diễm Quỳnh'),
    ('teacher', 'GV952', 'Teacher Maj'),
    ('accountant', 'ACC330', 'Kế Toán Mỹ Dung'),
    ('student', 'HV151', 'Học Viên Vivian'),
]


def audit_role_mobile(browser, role_key, uid, name):
    print(f"\n📱 AUDITING ROLE [{role_key.upper()} - {name}] on Mobile 390x844...")
    ctx = browser.new_context(
        viewport={'width': 390, 'height': 844},
        is_mobile=True,
        has_touch=True,
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    )
    page = ctx.new_page()
    page.goto(f'{BASE}/?sso_uid={uid}', wait_until='domcontentloaded')
    page.wait_for_timeout(2500)
    page.goto(f'{BASE}/dashboard', wait_until='domcontentloaded')
    page.wait_for_timeout(2500)

    # Check horizontal scroll
    scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
    inner_width = page.evaluate("() => window.innerWidth")
    has_overflow = scroll_width > inner_width
    print(f"   ScrollWidth: {scroll_width}px | InnerWidth: {inner_width}px | Overflow: {has_overflow}")

    # Find elements causing overflow if any
    overflow_elements = page.evaluate('''() => {
        const docW = window.innerWidth;
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > docW + 1) {
                bad.push({
                    tag: el.tagName,
                    class: (el.className || '').toString().slice(0, 50),
                    text: (el.innerText || '').slice(0, 40).replace(/\\n/g, ' '),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width)
                });
            }
        });
        return bad.slice(0, 10);
    }''')
    if overflow_elements:
        print(f"   ⚠️ Elements overflowing right edge ({len(overflow_elements)}):")
        for el in overflow_elements:
            print(f"      - {el['tag']}.{el['class']}: right={el['right']}px, text='{el['text']}'")

    # Inspect text wrapping, statistics cards, and grid columns
    card_info = page.evaluate('''() => {
        const cards = [];
        document.querySelectorAll('.ant-card, .ant-statistic').forEach(c => {
            const r = c.getBoundingClientRect();
            cards.push({
                class: (c.className || '').toString().slice(0, 40),
                width: Math.round(r.width),
                text: (c.innerText || '').slice(0, 60).replace(/\\n/g, ' ')
            });
        });
        return cards.slice(0, 8);
    }''')
    print(f"   Card Samples ({len(card_info)}):")
    for c in card_info:
        print(f"      - w={c['width']}px: {c['text']}")

    # Screenshot
    shot_path = f"{ARTIFACT_DIR}/dashboard_mobile_{role_key}.png"
    page.screenshot(path=shot_path, full_page=True)
    print(f"   📸 Saved full-page screenshot: dashboard_mobile_{role_key}.png")

    ctx.close()


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        try:
            for role_key, uid, name in ROLES:
                audit_role_mobile(browser, role_key, uid, name)
        finally:
            browser.close()


if __name__ == '__main__':
    run()