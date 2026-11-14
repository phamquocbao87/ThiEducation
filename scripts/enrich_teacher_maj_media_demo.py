"""Attach Drive-hosted image, audio and video demo media to Teacher Maj's published exercise."""
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3000'
EXERCISE_ID = 'teacher_maj_unit_1_complete'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()
    page.goto(f'{BASE}/?sso_uid=GV952', wait_until='domcontentloaded')
    result = page.evaluate('''async ({exerciseId}) => {
      const { ExerciseAuthoringService } = await import('/src/modules/exercises/services/ExerciseAuthoringService.js');
      const { DriveStorageService } = await import('/src/core/services/DriveStorageService.js');
      const actor = { id: 'GV952', name: 'Teacher Maj', role: 'teacher' };
      const all = await ExerciseAuthoringService.getAll();
      const exercise = all.find((item) => item.id === exerciseId);
      if (!exercise) throw Error('Exercise was not found');
      const upload = async (file, purpose) => {
        const data = await DriveStorageService.uploadFile(file, { folderPath: `04_STUDENT_HOMEWORKS_PROFILES/exercises/2026/${exerciseId}/${purpose}`, tag: 'exercise_demo_media', purpose, key: exerciseId, title: file.name });
        return { id: data.fileId || data.id, name: file.name, mimeType: file.type, url: data.cdnUrl || data.downloadUrl || data.driveUrl, driveUrl: data.driveUrl || '' };
      };
      const imageBlob = await fetch('/src/modules/exercises/assets/community-exercise-scene.png').then((res) => res.blob());
      const image = await upload(new File([imageBlob], 'community-scene.png', { type: 'image/png' }), 'author-media');
      const wav = (() => { const rate = 8000, length = rate * 2, buffer = new ArrayBuffer(44 + length * 2), view = new DataView(buffer); const put = (offset, text) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0))); put(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true); put(8, 'WAVEfmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); put(36, 'data'); view.setUint32(40, length * 2, true); for (let i = 0; i < length; i++) { const tone = Math.sin(2 * Math.PI * 440 * i / rate) * (i < rate ? 0.2 : 0.12); view.setInt16(44 + i * 2, tone * 32767, true); } return new File([buffer], 'listening-demo.wav', { type: 'audio/wav' }); })();
      const audio = await upload(wav, 'author-media');
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#312e81'; ctx.fillRect(0, 0, 640, 360); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Arial'; ctx.fillText('Hello, Community!', 150, 170); ctx.font = '22px Arial'; ctx.fillText('Watch and answer the question.', 145, 215); const stream = canvas.captureStream(5); const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); const parts = []; const videoBlob = await new Promise((resolve) => { recorder.ondataavailable = (event) => parts.push(event.data); recorder.onstop = () => resolve(new Blob(parts, { type: 'video/webm' })); recorder.start(); setTimeout(() => recorder.stop(), 1000); });
      const video = await upload(new File([videoBlob], 'community-video-demo.webm', { type: 'video/webm' }), 'author-media');
      const extra = [
        { id: 'q_image', type: 'MULTIPLE_CHOICE', prompt: 'Look at the picture. Where can you borrow books?', points: 2, options: ['Library', 'Park', 'Playground'], correctOptionId: '0', media: [image] },
        { id: 'q_listening', type: 'MULTIPLE_CHOICE', prompt: 'Listening practice: play the audio, then choose the sound you hear.', points: 2, options: ['A listening tone', 'A door bell', 'A dog'], correctOptionId: '0', media: [audio] },
        { id: 'q_video', type: 'MULTIPLE_CHOICE', prompt: 'Video practice: watch the video. What message appears?', points: 2, options: ['Hello, Community!', 'Goodbye, School!', 'My blue book'], correctOptionId: '0', media: [video] }
      ];
      const kept = (exercise.questions || []).filter((q) => !['q_image', 'q_listening', 'q_video'].includes(q.id));
      const saved = await ExerciseAuthoringService.save({ ...exercise, questions: [...kept, ...extra] }, actor);
      return { questionCount: saved.questions.length, imageUrl: image.url, audioUrl: audio.url, videoUrl: video.url };
    }''', {'exerciseId': EXERCISE_ID})
    if result['questionCount'] != 10 or not all([result['imageUrl'], result['audioUrl'], result['videoUrl']]):
        raise RuntimeError(f'Media exercise validation failed: {result}')
    print('PASS Drive media attached to Teacher Maj exercise:', result['questionCount'], 'questions')
    context.close()
    browser.close()
