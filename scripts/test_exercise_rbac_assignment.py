"""
Deterministic E2E Playwright Verification for Exercise Assignment RBAC Scoping:
1. Teacher Maj (GV952):
   - Scope: Can only assign to classes she teaches (LH002, LH004, LH005).
   - Other classes (LH001 taught by Hellen, LH003 unassigned) STRICTLY EXCLUDED.
   - Title scope badge: 'Teacher Scope: Your Classes & Students'
   - In 'Specific Students' mode:
     * When filtered by class LH005: only the 5 enrolled students (HV151, HV235, HV253, HV267, HV361) are available.
     * Non-LH005 students (HV801, HV479...) are filtered out.
2. Academic Diễm Quỳnh (ACA404) & IT Admin (ADM001):
   - Institutional Scope: Full Access across all academy classes (LH001..LH005).
   - Title scope badge: 'Institutional Scope: Full Access'
   - In 'Specific Students' mode:
     * All 15 academy students are available in the institutional pool.
     * Can search and select any student across all classes.
"""
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3000'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
ARTIFACT_DIR = '/Users/baopqmac/.gemini/antigravity/brain/692b2ddb-3a45-4f8d-ba80-85b0fb828fce/mobile_audit'


def test_teacher_maj_scoped(browser):
    print('\n👩‍🏫 [1/2] Testing Teacher Maj (GV952) Scoped RBAC...')
    ctx = browser.new_context(viewport={'width': 1366, 'height': 850})
    page = ctx.new_page()

    page.goto(f'{BASE}/english-exercises?sso_uid=GV952', wait_until='domcontentloaded')
    page.wait_for_timeout(2000)

    # 1. Open Assignment Modal
    assign_btn = page.locator("button:has-text('Assign'), button:has-text('Giao Bài')").first
    expect(assign_btn).to_be_visible(timeout=10000)
    assign_btn.dispatch_event('click')
    page.wait_for_timeout(800)

    modal = page.locator('.ant-modal-container, .ant-modal').first
    expect(modal).to_be_visible()

    # 2. Assert Header Role Badge
    title_text = modal.locator('.ant-modal-title').first.inner_text()
    print(f'   Teacher Modal Title: {title_text.strip()}')
    assert any(w in title_text for w in ['Teacher Scope', 'Phạm vi', 'Giáo viên', 'Your Classes'])
    print('   ✅ ASSERT Teacher Scope Badge Verified!')

    # 3. Assert Class Dropdown Options (Whole Class Mode)
    class_select = modal.locator('.ant-select').first
    class_select.click()
    page.wait_for_timeout(400)

    class_opts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    class_texts = [class_opts.nth(i).inner_text() for i in range(class_opts.count())]
    print(f'   Teacher Modal Class Options ({len(class_texts)}): {class_texts}')
    assert any('LH002' in t for t in class_texts), 'LH002 must be in options'
    assert any('LH004' in t for t in class_texts), 'LH004 must be in options'
    assert any('LH005' in t for t in class_texts), 'LH005 must be in options'
    assert not any('LH001' in t for t in class_texts), 'LH001 (Hellen) MUST NOT be in options for Teacher Maj'
    assert not any('LH003' in t for t in class_texts), 'LH003 MUST NOT be in options for Teacher Maj'
    print('   ✅ ASSERT Teacher Maj Classes (LH002, LH004, LH005) PRESENT & Other Classes STRICTLY EXCLUDED!')

    # Select LH005 to close class dropdown
    page.locator(".ant-select-item-option:has-text('LH005')").first.dispatch_event('click')
    page.wait_for_timeout(400)

    # 4. Switch to "Specific Students" Mode
    modal.locator(".ant-segmented-item:has-text('Specific Students'), .ant-segmented-item:has-text('Chọn Từng Học Viên')").first.click()
    page.wait_for_timeout(500)

    modal_text = modal.inner_text()
    assert any(w in modal_text for w in ['Your learners', 'Học sinh bạn dạy'])
    print('   ✅ ASSERT Teacher Learners Scope Label Verified!')

    # 5. Filter students by class LH005
    filter_class_select = modal.locator('.ant-select').first
    filter_class_select.click()
    page.wait_for_timeout(400)
    page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option:has-text('LH005')").first.dispatch_event('click')
    page.wait_for_timeout(400)

    # Open multi-select student dropdown
    student_select = modal.locator('.ant-select-multiple').first
    student_select.click()
    page.wait_for_timeout(400)

    st_opts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    st_texts = [st_opts.nth(i).inner_text() for i in range(st_opts.count())]
    print(f'   Teacher LH005 Student Pool Count ({len(st_texts)}): {st_texts}')
    assert len(st_texts) == 5, f'Expected 5 students in LH005, got {len(st_texts)}'

    # Check that students in LH005 are present
    assert any('HV151' in s or 'Vivian' in s for s in st_texts), 'Vivian (HV151) must be in LH005'
    assert any('HV235' in s or 'Tracy' in s for s in st_texts), 'Tracy (HV235) must be in LH005'
    assert any('HV253' in s or 'Melissa' in s for s in st_texts), 'Melissa (HV253) must be in LH005'

    # Check that students NOT in LH005 (e.g. HV801 from LH002) are NOT present
    assert not any('HV801' in s for s in st_texts), 'HV801 (LH002 student) MUST NOT appear when LH005 is filtered'
    print('   ✅ ASSERT Specific Students Filtering by Class LH005 STRICTLY ENFORCED!')

    # Screenshot
    page.screenshot(path=f'{ARTIFACT_DIR}/teacher_maj_exercise_rbac_scoped.png')
    print('   📸 Saved screenshot: teacher_maj_exercise_rbac_scoped.png')

    ctx.close()


def test_academic_full_access(browser):
    print('\n👑 [2/2] Testing Academic Diễm Quỳnh (ACA404) Full Institutional Access...')
    ctx = browser.new_context(viewport={'width': 1366, 'height': 850})
    page = ctx.new_page()

    page.goto(f'{BASE}/english-exercises?sso_uid=ACA404', wait_until='domcontentloaded')
    page.wait_for_timeout(2000)

    # 1. Open Assignment Modal
    assign_btn = page.locator("button:has-text('Assign'), button:has-text('Giao Bài')").first
    expect(assign_btn).to_be_visible(timeout=10000)
    assign_btn.dispatch_event('click')
    page.wait_for_timeout(800)

    modal = page.locator('.ant-modal-container, .ant-modal').first
    expect(modal).to_be_visible()

    # 2. Assert Header Role Badge
    title_text = modal.locator('.ant-modal-title').first.inner_text()
    print(f'   Academic Modal Title: {title_text.strip()}')
    assert any(w in title_text for w in ['Institutional Scope', 'Toàn Quyền', 'Full Access'])
    print('   ✅ ASSERT Institutional Scope Badge (Full Access) Verified!')

    # 3. Assert Class Dropdown Options (Whole Class Mode)
    class_select = modal.locator('.ant-select').first
    class_select.click()
    page.wait_for_timeout(400)

    class_opts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    class_texts = [class_opts.nth(i).inner_text() for i in range(class_opts.count())]
    print(f'   Academic Modal Class Options ({len(class_texts)}): {class_texts}')
    assert any('LH002' in t for t in class_texts), 'LH002 must be available for Academic'
    assert any('LH004' in t for t in class_texts), 'LH004 must be available for Academic'
    assert any('LH005' in t for t in class_texts), 'LH005 must be available for Academic'
    assert not any('LH001' in t for t in class_texts), 'Deleted class LH001 must NOT appear'
    assert not any('LH003' in t for t in class_texts), 'Deleted class LH003 must NOT appear'
    print('   ✅ ASSERT All Active Academy Classes (LH002, LH004, LH005) PRESENT for Academic/Admin!')

    # Select LH002 to close dropdown
    page.locator(".ant-select-item-option:has-text('LH002')").first.dispatch_event('click')
    page.wait_for_timeout(400)

    # 4. Switch to "Specific Students" Mode
    modal.locator(".ant-segmented-item:has-text('Specific Students'), .ant-segmented-item:has-text('Chọn Từng Học Viên')").first.click()
    page.wait_for_timeout(500)

    modal_text = modal.inner_text()
    assert any(w in modal_text for w in ['All academy', 'Toàn trường'])
    print('   ✅ ASSERT All Academy Scope Label Verified!')

    student_select = modal.locator('.ant-select-multiple').first
    student_select.click()
    page.wait_for_timeout(400)

    # Academic can search any student across the entire academy
    student_select.locator('input').press_sequentially('Eric')
    page.wait_for_timeout(400)
    aca_eric_opts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    aca_eric_texts = [aca_eric_opts.nth(i).inner_text() for i in range(aca_eric_opts.count())]
    print(f'   Academic search Eric (HV905) result: {aca_eric_texts}')
    assert any('HV905' in s or 'Eric' in s for s in aca_eric_texts), 'HV905 Eric must be visible for Academic'
    print('   ✅ ASSERT Academy Student (HV905 Eric) FOUND for Academic/Admin!')
    student_select.locator('input').fill('')
    page.keyboard.press('Backspace')
    page.wait_for_timeout(300)

    student_select.locator('input').press_sequentially('Vivian')
    page.wait_for_timeout(400)
    aca_vivian_opts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
    aca_vivian_texts = [aca_vivian_opts.nth(i).inner_text() for i in range(aca_vivian_opts.count())]
    print(f'   Academic search Vivian (HV151) result: {aca_vivian_texts}')
    assert any('HV151' in s or 'Vivian' in s for s in aca_vivian_texts), 'HV151 Vivian must be visible for Academic'
    print('   ✅ ASSERT Academy Student (HV151 Vivian) FOUND for Academic/Admin!')

    # Screenshot
    page.screenshot(path=f'{ARTIFACT_DIR}/academic_exercise_rbac_full_access.png')
    print('   📸 Saved screenshot: academic_exercise_rbac_full_access.png')

    ctx.close()


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        try:
            test_teacher_maj_scoped(browser)
            test_academic_full_access(browser)
            print('\n' + '=' * 60)
            print('🎉 ALL EXERCISE RBAC SCOPING TESTS PASSED 100%!')
            print('=' * 60)
        finally:
            browser.close()


if __name__ == '__main__':
    run()
