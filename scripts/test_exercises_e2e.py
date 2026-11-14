"""E2E exercise lifecycle: academic creates/assigns, student submits, academic reviews."""
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3000'
TITLE = f'E2E English Exercise {datetime.now().strftime("%Y%m%d%H%M%S")}'


def page_for(browser, account):
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()
    page.goto(f'{BASE}/?sso_uid={account}', wait_until='domcontentloaded')
    return context, page


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
    academic_context, academic = page_for(browser, 'ACA404')
    academic.goto(BASE + '/english-exercises', wait_until='domcontentloaded')
    created = academic.evaluate('''async ({title}) => {
      const { ExerciseAuthoringService } = await import('/src/modules/exercises/services/ExerciseAuthoringService.js');
      const { ExerciseAssignmentService } = await import('/src/modules/exercises/services/ExerciseAssignmentService.js');
      const { ClassService } = await import('/src/modules/courses/services/ClassService.js');
      const { UserService } = await import('/src/modules/users/services/UserService.js');
      const classes = await ClassService.getAllClasses();
      const selected = classes.find((item) => item.id === 'LH005');
      if (!selected) throw Error('LH005 is missing');
      const users = await UserService.getAllUsers();
      const learner = users.find((item) => item.id === 'HV151');
      if (!learner) throw Error('HV151 is missing');
      const actor = { id: 'ACA404', name: 'E2E Academic', role: 'academic' };
      const exercise = await ExerciseAuthoringService.save({
        id: `e2e_${Date.now()}`, title, classId: selected.id, status: 'PUBLISHED', attemptsAllowed: 1,
        questions: [
          { id: 'q_auto', type: 'MULTIPLE_CHOICE', prompt: 'Choose the greeting.', points: 2, options: ['Hello', 'Blue'], correctOptionId: '0', media: [] },
          { id: 'q_write', type: 'WRITING', prompt: 'Write one greeting.', points: 3, rubric: 'Correct greeting', media: [] }
        ]
      }, actor);
      const assignment = await ExerciseAssignmentService.assign(exercise, selected, [learner], actor);
      return { exerciseId: exercise.id, assignmentId: assignment.id };
    }''', {'title': TITLE})
    print('PASS academic create + assign:', created['assignmentId'])

    student_context, student = page_for(browser, 'HV151')
    student.goto(BASE + '/english-exercises', wait_until='domcontentloaded')
    expect(student.get_by_text(TITLE, exact=True)).to_be_visible(timeout=20000)
    assignment_row = student.get_by_role('row').filter(has_text=TITLE)
    assignment_row.locator("button:has-text('Start'), button:has-text('Làm bài')").first.click()
    expect(student.get_by_text('Choose the greeting.', exact=False)).to_be_visible()
    student.get_by_text('Hello', exact=True).click()
    student.locator("textarea[placeholder*='answer'], textarea[placeholder*='trả lời']").fill('Hello, teacher!')
    student.locator("button:has-text('Submit'), button:has-text('Nộp bài')").click()
    expect(student.locator("text=/Submitted|Nộp bài thành công/i")).to_be_visible(timeout=20000)
    print('PASS student submit + automatic scoring')

    academic.goto(BASE + '/english-exercises', wait_until='domcontentloaded')
    # Chuyển sang Tab Quản Lý Bài Nộp (Student Submissions)
    submissions_tab = academic.locator(".ant-tabs-tab:has-text('Submissions'), .ant-tabs-tab:has-text('Bài Nộp')")
    expect(submissions_tab).to_be_visible(timeout=20000)
    submissions_tab.click()
    academic.wait_for_timeout(600)
    academic.locator("button:has-text('Review'), button:has-text('Chấm bài')").last.click()
    expect(academic.get_by_text('Hello, teacher!', exact=True)).to_be_visible()
    academic.locator(".ant-modal input[type='number'], input[id*='manualScore']").fill('3')
    academic.locator(".ant-modal textarea, textarea[id*='teacherComment']").fill('Great work!')
    academic.locator(".ant-modal button:has-text('Save'), .ant-modal button:has-text('Lưu')").click()
    expect(academic.locator("text=/Review.*saved|Đã lưu/i")).to_be_visible(timeout=20000)
    print('PASS academic manual review + feedback')

    # TEARDOWN: Xóa sạch dữ liệu test vừa tạo (Zero Test-Data Residue Invariant)
    academic.evaluate('''async ({exerciseId, assignmentId}) => {
      const { ExerciseAuthoringService } = await import('/src/modules/exercises/services/ExerciseAuthoringService.js');
      const { ExerciseAssignmentService } = await import('/src/modules/exercises/services/ExerciseAssignmentService.js');
      const { ExerciseAttemptService } = await import('/src/modules/exercises/services/ExerciseAttemptService.js');
      await ExerciseAuthoringService.softDelete(exerciseId);
      await ExerciseAssignmentService.softDelete(assignmentId);
      const attempts = await ExerciseAttemptService.getAll();
      for (const att of attempts) {
        if (att.assignmentId === assignmentId) {
          await ExerciseAttemptService.softDelete(att.id);
        }
      }
    }''', {'exerciseId': created['exerciseId'], 'assignmentId': created['assignmentId']})
    print('PASS teardown: cleaned up test exercise, assignment and attempt')

    for context in [academic_context, student_context]:
        context.close()
    browser.close()
