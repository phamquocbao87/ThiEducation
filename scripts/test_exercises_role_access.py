"""Role smoke test for the English Exercises module on local development."""
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3000'
MODULE = '/english-exercises'


def open_as(browser, account_id, width=1366):
    context = browser.new_context(viewport={'width': width, 'height': 900})
    page = context.new_page()
    page.goto(f'{BASE}/?sso_uid={account_id}', wait_until='domcontentloaded')
    page.goto(BASE + MODULE, wait_until='domcontentloaded')
    return context, page


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless=True,
    )
    academic_context, academic = open_as(browser, 'ACA404')
    expect(academic.locator("button:has-text('Create Exercise'), button:has-text('Tạo Bài Tập')")).to_be_visible()
    print('PASS academic: can open and author exercises')

    teacher_context, teacher = open_as(browser, 'GV952')
    expect(teacher.locator("button:has-text('Create Exercise'), button:has-text('Tạo Bài Tập')")).to_be_visible()
    print('PASS teacher: can open and author exercises')

    student_context, student = open_as(browser, 'HV151', 390)
    expect(student.locator("button:has-text('Create Exercise'), button:has-text('Tạo Bài Tập')")).not_to_be_visible()
    expect(student.locator("text=/No assigned exercises|Chưa có bài tập/i")).to_be_visible()
    assert student.evaluate('document.body.scrollWidth <= innerWidth')
    print('PASS student mobile: learner view, author action hidden, no overflow')

    accountant_context, accountant = open_as(browser, 'ACC330')
    expect(accountant.locator("text=/403/i")).to_be_visible()
    print('PASS accountant: access denied by RBAC')

    for context in [academic_context, teacher_context, student_context, accountant_context]:
        context.close()
    browser.close()
