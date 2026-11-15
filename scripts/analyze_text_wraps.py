"""
Script to analyze awkward text line wraps on mobile for DashboardPage across all 6 roles
"""
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3000'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

ROLES = [
    ('admin', 'ADM001'),
    ('director', 'DIR505'),
    ('academic', 'ACA404'),
    ('teacher', 'GV952'),
    ('accountant', 'ACC330'),
    ('student', 'HV151'),
]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, headless=True)

    for role, uid in ROLES:
        print(f"\n==================== ROLE: {role.upper()} ({uid}) ====================")
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

        # Check overflow
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        inner_width = page.evaluate("() => window.innerWidth")
        print(f"Viewport: {inner_width}px | ScrollWidth: {scroll_width}px | Overflow: {scroll_width > inner_width}")

        # Check Top Alert
        alert_info = page.evaluate('''() => {
            const a = document.querySelector('.ant-alert');
            if (!a) return null;
            const msg = a.querySelector('.ant-alert-message');
            const desc = a.querySelector('.ant-alert-description');
            return {
                h: a.clientHeight,
                msgH: msg ? msg.clientHeight : 0,
                descH: desc ? desc.clientHeight : 0,
                msg: msg ? msg.innerText : '',
                desc: desc ? desc.innerText : ''
            };
        }''')
        if alert_info:
            print(f"Top Alert h={alert_info['h']}px: msgH={alert_info['msgH']}px, descH={alert_info['descH']}px")
            print(f"   Message: {alert_info['msg']}")
            print(f"   Desc:    {alert_info['desc']}")

        # Check Cards title and extra wrapping
        card_headers = page.evaluate('''() => {
            const list = [];
            document.querySelectorAll('.ant-card-head').forEach(h => {
                const title = h.querySelector('.ant-card-head-title');
                const extra = h.querySelector('.ant-card-extra');
                list.push({
                    totalH: h.clientHeight,
                    titleText: (title?.innerText || '').trim().replace(/\\n/g, ' | '),
                    extraText: (extra?.innerText || '').trim().replace(/\\n/g, ' | '),
                    titleH: title?.clientHeight || 0,
                    extraH: extra?.clientHeight || 0
                });
            });
            return list;
        }''')
        print(f"Card Headers ({len(card_headers)}):")
        for ch in card_headers:
            print(f"   - HeadH={ch['totalH']}px (titleH={ch['titleH']}, extraH={ch['extraH']}): '{ch['titleText'][:50]}' | extra: '{ch['extraText']}'")

        # Check multi-line words or broken tags
        tag_wraps = page.evaluate('''() => {
            const tags = [];
            document.querySelectorAll('.ant-tag, .ant-badge, .ant-statistic-title, .ant-statistic-content').forEach(el => {
                const r = el.getBoundingClientRect();
                const lines = Math.round(r.height / parseFloat(window.getComputedStyle(el).lineHeight || 20));
                if (lines > 1) {
                    tags.push({
                        tag: el.className.split(' ')[0],
                        text: el.innerText.replace(/\\n/g, ' '),
                        w: Math.round(r.width),
                        h: Math.round(r.height),
                        lines
                    });
                }
            });
            return tags.slice(0, 10);
        }''')
        if tag_wraps:
            print(f"   Wrapping elements ({len(tag_wraps)}):")
            for tw in tag_wraps:
                print(f"      * [{tw['tag']}] lines={tw['lines']} w={tw['w']}px h={tw['h']}px: '{tw['text']}'")

        ctx.close()

    browser.close()
