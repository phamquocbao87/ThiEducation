"""Creates one complete published exercise while signed in as Teacher Maj (local development)."""
from playwright.sync_api import expect, sync_playwright

BASE = 'http://127.0.0.1:3000'
TITLE = 'English Skills Challenge — Unit 1: My Community'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()
    page.goto(f'{BASE}/?sso_uid=GV952', wait_until='domcontentloaded')
    page.goto(BASE + '/english-exercises', wait_until='domcontentloaded')
    result = page.evaluate('''async ({title}) => {
      const { ExerciseAuthoringService } = await import('/src/modules/exercises/services/ExerciseAuthoringService.js');
      const actor = { id: 'GV952', name: 'Teacher Maj', role: 'teacher' };
      const id = 'teacher_maj_unit_1_complete';
      const duplicates = (await ExerciseAuthoringService.getAll()).filter((item) => item.title === title && item.id !== id);
      await Promise.all(duplicates.map((item) => ExerciseAuthoringService.softDelete(item.id)));
      const exercise = await ExerciseAuthoringService.save({
        id, title, status: 'PUBLISHED', attemptsAllowed: 2,
        dueAt: '2026-12-31T20:00',
        description: 'Complete every activity. Read carefully, listen when audio is provided, and submit your best work.',
        questions: [
          { id: 'q1', type: 'MULTIPLE_CHOICE', prompt: 'Choose the best greeting for your teacher.', points: 2, options: ['Good morning, teacher!', 'Blue table.', 'I am ten books.'], correctOptionId: '0', explanation: 'Use a polite greeting when speaking to your teacher.', media: [] },
          { id: 'q2', type: 'FILL_BLANK', prompt: 'Complete the sentence: My community ___ friendly.', points: 2, acceptedAnswers: ['is'], explanation: 'Use “is” with a singular subject.', media: [] },
          { id: 'q3', type: 'SHORT_ANSWER', prompt: 'What is one place you can visit in your community?', points: 2, acceptedAnswers: ['park', 'school', 'library', 'market'], media: [] },
          { id: 'q4', type: 'WORD_ORDER', prompt: 'Put the words in the correct order: “live / I / in / a / community”.', points: 2, acceptedAnswers: ['I live in a community', 'i live in a community'], media: [] },
          { id: 'q5', type: 'MATCHING', prompt: 'Match each place with its purpose.', points: 3, pairs: [{ left: 'Library', right: 'borrow books' }, { left: 'Park', right: 'play outside' }, { left: 'School', right: 'learn' }], media: [] },
          { id: 'q6', type: 'WRITING', prompt: 'Write 3–5 sentences about your community and one place you like to visit.', points: 5, rubric: 'Clear sentences, relevant vocabulary, basic punctuation, and complete ideas.', media: [] },
          { id: 'q7', type: 'SPEAKING', prompt: 'Record a 30–60 second introduction to your community. Include one place and one activity you enjoy.', points: 5, rubric: 'Clear voice, relevant vocabulary, complete sentences, and understandable pronunciation.', media: [] }
        ]
      }, actor);
      return { id: exercise.id, title: exercise.title, questionCount: exercise.questions.length, status: exercise.status, createdBy: exercise.createdBy };
    }''', {'title': TITLE})
    if result['createdBy'] != 'GV952' or result['questionCount'] != 7 or result['status'] != 'PUBLISHED':
        raise RuntimeError(f'Exercise validation failed: {result}')
    page.reload(wait_until='domcontentloaded')
    expect(page.get_by_text(TITLE, exact=True).first).to_be_visible(timeout=20000)
    print(f"PASS Teacher Maj created published full exercise: {result['id']}")
    context.close()
    browser.close()
