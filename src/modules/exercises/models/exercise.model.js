export const EXERCISE_STATUS = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED', ARCHIVED: 'ARCHIVED' };

export const QUESTION_TYPES = {
  AUDIO_IMAGE: 'AUDIO_IMAGE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  FILL_BLANK: 'FILL_BLANK',
  SHORT_ANSWER: 'SHORT_ANSWER',
  WRITING: 'WRITING',
  SPEAKING: 'SPEAKING',
  WORD_ORDER: 'WORD_ORDER',
  MATCHING: 'MATCHING',
};

export const AUTO_GRADED_TYPES = new Set([
  QUESTION_TYPES.AUDIO_IMAGE,
  QUESTION_TYPES.MULTIPLE_CHOICE,
  QUESTION_TYPES.FILL_BLANK,
  QUESTION_TYPES.SHORT_ANSWER,
  QUESTION_TYPES.WORD_ORDER,
  QUESTION_TYPES.MATCHING,
]);

export const createQuestion = (type = QUESTION_TYPES.MULTIPLE_CHOICE) => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type,
  prompt: '',
  points: 1,
  options: [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(type) ? ['', ''] : [],
  pairs: type === QUESTION_TYPES.MATCHING ? [{ left: '', right: '' }, { left: '', right: '' }] : [],
  acceptedAnswers: [],
  explanation: '',
  media: [],
});
