"""Render the actual Dashboard class card in isolated browser memory; no DB writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACTS = Path('test-results/dashboard-class-timer')
ARTIFACTS.mkdir(parents=True, exist_ok=True)
HTML = '''<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script><script type="module" src="/@vite/client"></script></head>
<body style="margin:0"><div id="root" style="padding:16px;max-width:400px;box-sizing:border-box"></div></body></html>'''
RENDER = '''async () => {
  const React = (await import('/node_modules/.vite/deps/react.js')).default;
  const {createRoot} = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const {LanguageProvider} = await import('/src/core/context/LanguageContext.jsx');
  const {ClassLiveCard} = await import('/src/modules/dashboard/components/ClassLiveCard.jsx');
  window.timerLocale = (await import('/src/core/i18n/i18n.js')).default;
  const cls = {
    id: '[TEST:dashboard-class-timer:20261113]', name: 'Countdown verification',
    startDate: '13/11/2026', endDate: '27/11/2026', teacherName: 'Timer verification',
    schedule: 'Fri 18:00 - 19:00',
    scheduleData: {days:[5],startTime:'18:00',endTime:'19:00',baseTimezoneOffset:7},
    studentIds:[],maxStudents:12
  };
  createRoot(document.getElementById('root')).render(
    React.createElement(LanguageProvider, null, React.createElement(ClassLiveCard, {cls})));
}'''

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless=True)
    for width, lang in [(1366, 'vi'), (390, 'vi'), (390, 'en')]:
        context = browser.new_context(viewport={'width': width, 'height': 844}, timezone_id='America/New_York')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        context.add_init_script(f"localStorage.setItem('lak_app_language','{lang}');")
        page.clock.install(time=__import__('datetime').datetime.fromisoformat('2026-11-13T10:59:58+00:00'))
        page.clock.pause_at(__import__('datetime').datetime.fromisoformat('2026-11-13T10:59:58+00:00'))
        page.route('**/__timer_qc', lambda route: route.fulfill(content_type='text/html', body=HTML))
        page.goto('http://127.0.0.1:3000/__timer_qc', wait_until='domcontentloaded')
        page.evaluate(RENDER)
        timer = page.get_by_test_id('class-session-timer')
        timer.wait_for()
        assert timer.get_attribute('data-state') == 'upcoming'
        page.clock.run_for(1000)
        assert '1 ' in timer.inner_text()
        page.clock.run_for(1000)
        assert timer.get_attribute('data-state') == 'live'
        assert page.locator('.lak-card-pulse-red').count() == 1
        page.clock.fast_forward(315000)
        assert ('5 phút 15 giây' if lang == 'vi' else '5 minutes 15 seconds') in timer.inner_text()
        assert ('54 phút 45 giây' if lang == 'vi' else '54 minutes 45 seconds') in timer.inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(ARTIFACTS / f'live-{width}-{lang}.png'), full_page=True)
        page.clock.fast_forward(3285000)
        assert timer.get_attribute('data-state') == 'upcoming'
        page.screenshot(path=str(ARTIFACTS / f'next-session-{width}-{lang}.png'), full_page=True)
        page.reload(wait_until='domcontentloaded')
        page.evaluate(RENDER)
        timer.wait_for()
        assert timer.get_attribute('data-state') == 'upcoming'
        assert not errors, errors
        print(f'PASS {width}px {lang}: ticking, live transition, next session, reload, no overflow, New York timezone')
        context.close()
    browser.close()
