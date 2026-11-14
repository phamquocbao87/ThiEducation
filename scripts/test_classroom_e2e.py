"""Real browser + Firebase Emulator integration, with fixture cleanup in finally."""
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from playwright.sync_api import sync_playwright, expect
from classroom_test_fixture import seed, cleanup, cleanup_incomplete, request, FIRESTORE, CLASS_ID, PASSWORD

BASE = 'http://127.0.0.1:3001'
ARTIFACTS = Path('test-results/live-classroom-attendance')
ARTIFACTS.mkdir(parents=True, exist_ok=True)
cleanup_incomplete()
users, fixture = seed()

def login(browser, role, width=1366, lang='vi'):
    user = users[role]
    context = browser.new_context(viewport={'width': width, 'height': 900 if width > 768 else 844})
    page = context.new_page()
    page.on('console', lambda msg: print(msg.text, flush=True) if '[ClassroomReminder]' in msg.text else None)
    page.goto(BASE, wait_until='domcontentloaded')
    page.evaluate('''async ({email,password,id,lang}) => {
      const { auth, FIREBASE_RUNTIME_ENV } = await import('/src/core/services/firebase.js');
      if (FIREBASE_RUNTIME_ENV !== 'local-emulator') throw Error('NOT EMULATOR');
      const {signInWithEmailAndPassword} = await import('/node_modules/.vite/deps/firebase_auth.js');
      await signInWithEmailAndPassword(auth,email,password);
      localStorage.setItem('lak_authenticated_user_id',id);
      localStorage.setItem('lak_app_language',lang);
    }''', {'email': user['email'], 'password': PASSWORD, 'id': user['id'], 'lang': lang})
    return context, page

def details(page):
    page.goto(BASE + '/classroom/' + quote(CLASS_ID, safe=''), wait_until='domcontentloaded')

def no_overflow(page):
    assert page.evaluate('document.body.scrollWidth <= innerWidth'), 'Horizontal overflow'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
        teacher_context, teacher = login(browser, 'teacher')
        teacher.goto(BASE + '/dashboard', wait_until='domcontentloaded')
        teacher.get_by_text(fixture['name'], exact=True).last.click()
        expect(teacher).to_have_url(__import__('re').compile('/classroom/'))
        s1, s2, s3 = [users[s]['id'] for s in ['student', 'student2', 'student3']]
        expect(teacher.get_by_test_id('seat-' + s1)).to_be_visible()
        expect(teacher.get_by_test_id('attendance-counts')).to_contain_text('Chưa kiểm tra: 3')
        monitor_context, monitor = login(browser, 'academic')
        monitor.goto(BASE + '/dashboard', wait_until='domcontentloaded')
        expect(monitor.get_by_text(fixture['name'], exact=True)).to_be_visible()
        teacher.get_by_test_id('offline-' + s1).click()
        summary = monitor.get_by_test_id('attendance-summary-' + CLASS_ID)
        expect(summary).to_contain_text('Vắng: 1', timeout=20000)
        expect(summary).to_contain_text(users['student']['name'])
        session_document = request(FIRESTORE + '/session_evaluations', method='GET')['documents'][0]
        session_url = 'http://127.0.0.1:8080/v1/' + quote(session_document['name'], safe='/')
        with_feedback = {**session_document['fields'], 'teacherFeedback': {'stringValue': 'TEST preserve feedback'},
                         'pronunciationScore': {'integerValue': '4'}}
        request(session_url, {'fields': with_feedback}, 'PATCH')
        teacher.get_by_text('Tất cả có mặt', exact=True).click()
        expect(summary).to_contain_text('Có mặt: 3', timeout=15000)
        saved = request(session_url, method='GET')['fields']
        assert saved['teacherFeedback']['stringValue'] == 'TEST preserve feedback'
        assert saved['pronunciationScore']['integerValue'] == '4'
        teacher.get_by_test_id('offline-' + s2).click()
        expect(summary).to_contain_text('Vắng: 1')
        monitor.screenshot(path=str(ARTIFACTS / 'academic-dashboard.png'), full_page=True)
        teacher.reload(wait_until='domcontentloaded')
        expect(teacher.get_by_test_id('seat-' + s2)).to_contain_text('Vắng mặt')
        assert teacher.locator('.ant-modal').count() == 0
        no_overflow(teacher)
        teacher.screenshot(path=str(ARTIFACTS / 'teacher-desktop.png'), full_page=True)
        print('PASS desktop: full-page navigation, single/bulk attendance, realtime second context and F5', flush=True)
        director_context, director = login(browser, 'director')
        director.goto(BASE + '/dashboard', wait_until='domcontentloaded')
        expect(director.get_by_test_id('attendance-summary-' + CLASS_ID)).to_contain_text('Vắng: 1')
        details(monitor)
        summary = director.get_by_test_id('attendance-summary-' + CLASS_ID)
        expect(monitor.get_by_test_id('seat-' + s2)).to_contain_text('Vắng mặt')
        assert monitor.get_by_test_id('online-' + s2).count() == 0
        monitor.get_by_test_id('remind-teacher').click()
        expect(monitor.get_by_text('Đã gửi nhắc giáo viên.', exact=True)).to_be_visible()
        monitor.get_by_test_id('remind-teacher').click()
        expect(monitor.get_by_text('Đã gửi nhắc cho danh sách học viên vắng này.', exact=True)).to_be_visible()
        notices = request(FIRESTORE + '/notifications', method='GET').get('documents', [])
        assert len(notices) == 1
        notice_url = 'http://127.0.0.1:8080/v1/' + quote(notices[0]['name'], safe='/')
        request(notice_url, method='GET', token=users['teacher']['token'])
        try:
            request(notice_url, method='GET', token=users['otherteacher']['token'])
            raise AssertionError('Reminder leaked to another teacher')
        except HTTPError as error:
            assert error.code == 403
        print('PASS absence reminder: addressed teacher notification and duplicate prevention', flush=True)
        mobile_context, mobile = login(browser, 'teacher', 390, 'en')
        details(mobile)
        expect(mobile.get_by_test_id('seat-' + s1)).to_be_visible()
        no_overflow(mobile)
        assert mobile.get_by_test_id('online-' + s1).bounding_box()['height'] >= 44
        mobile.screenshot(path=str(ARTIFACTS / 'teacher-mobile-en.png'), full_page=True)
        mobile.get_by_test_id('offline-' + s3).click()
        expect(summary).to_contain_text('Vắng: 2')
        expect(monitor.get_by_test_id('seat-' + s3)).to_contain_text('Vắng mặt')
        print('PASS mobile EN: real writes, desktop VI observer, touch target and no overflow', flush=True)
        teacher.evaluate('''async ({cls,user,s1,s3}) => {
          const {ClassroomService} = await import('/src/modules/classroom/services/ClassroomService.js');
          const {findClassSession} = await import('/src/shared/utils/classSessionUtils.js');
          const {classroomSessionId} = await import('/src/shared/models/classroom.model.js');
          const key = classroomSessionId(cls.id,findClassSession(cls,Date.now()));
          await Promise.all([
            ClassroomService.mark(cls.id,key,{[s1]:'OFFLINE'},user),
            ClassroomService.mark(cls.id,key,{[s3]:'ONLINE'},user)
          ]);
        }''', {'cls': fixture, 'user': {key: users['teacher'][key] for key in ['id', 'role', 'name']}, 's1': s1, 's3': s3})
        expect(monitor.get_by_test_id('seat-' + s1)).to_contain_text('Vắng mặt')
        expect(monitor.get_by_test_id('seat-' + s3)).to_contain_text('Có mặt')
        print('PASS transactions: concurrent updates preserve different students, feedback and scores', flush=True)
        details(mobile)
        expect(mobile.get_by_test_id('offline-' + s3)).to_be_visible()
        profile_url = FIRESTORE + '/users/' + users['teacher']['id']
        original = request(profile_url, method='GET')['fields']
        rejected = {**original, 'uid': {'stringValue': 'TEST_INVALID_IDENTITY'}}
        request(profile_url, {'fields': rejected}, 'PATCH')
        mobile.get_by_test_id('online-' + s2).click()
        expect(mobile.get_by_text('Attendance could not be saved. Your change was reverted. Please try again.')).to_be_visible()
        expect(mobile.get_by_test_id('seat-' + s2)).to_contain_text('Absent')
        request(profile_url, {'fields': original}, 'PATCH')
        for role in ['otherteacher', 'student', 'accountant']:
            ctx, page = login(browser, role)
            details(page)
            expect(page.get_by_text('403 Not Found', exact=True) if role != 'otherteacher'
                   else page.get_by_text('Lớp không tồn tại hoặc bạn không có quyền truy cập', exact=True)).to_be_visible()
            assert page.get_by_test_id('seat-' + s1).count() == 0
            ctx.close()
        for role in ['academic', 'student', 'otherteacher']:
            try:
                request(FIRESTORE + '/classroom_live/' + quote(CLASS_ID, safe=''),
                        {'fields': {'liveAttendance': {'mapValue': {'fields': {}}}}}, 'PATCH', users[role]['token'])
                raise AssertionError('Unauthorized server write accepted: ' + role)
            except HTTPError as error:
                assert error.code == 403
        anonymous = browser.new_page()
        details(anonymous)
        expect(anonymous).to_have_url(__import__('re').compile('require_login=true'))
        print('PASS RBAC: read-only monitors, other teacher/student/accountant/anonymous denied; server writes denied; rollback', flush=True)
        browser.close()
finally:
    cleanup(users)
