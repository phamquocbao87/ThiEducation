"""Switch existing non-image demo media to Google Drive direct-download playback URLs."""
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3000'
EXERCISE_ID = 'teacher_maj_unit_1_complete'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto(f'{BASE}/?sso_uid=GV952', wait_until='domcontentloaded')
    result = page.evaluate('''async ({exerciseId}) => {
      const { ExerciseAuthoringService } = await import('/src/modules/exercises/services/ExerciseAuthoringService.js');
      const { DriveStorageService } = await import('/src/core/services/DriveStorageService.js');
      const all = await ExerciseAuthoringService.getAll();
      const exercise = all.find((item) => item.id === exerciseId);
      if (!exercise) throw Error('Exercise was not found');
      const questions = exercise.questions.map((question) => ({ ...question, media: (question.media || []).map((media) => ({ ...media, url: String(media.mimeType || '').startsWith('image/') ? media.url : DriveStorageService.getDirectDownloadUrl(media.id) })) }));
      const saved = await ExerciseAuthoringService.save({ ...exercise, questions }, { id: 'GV952', name: 'Teacher Maj', role: 'teacher' });
      return saved.questions.filter((question) => question.media?.length).map((question) => ({ id: question.id, url: question.media[0].url }));
    }''', {'exerciseId': EXERCISE_ID})
    if not all(item['url'] for item in result):
        raise RuntimeError(result)
    print('PASS updated playable Drive URLs:', result)
    context.close()
    browser.close()
