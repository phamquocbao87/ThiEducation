import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Tag, Upload } from 'antd';
import {
  CustomerServiceOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { QUESTION_TYPES } from '../models/exercise.model';
import { ExerciseMediaService } from '../services/ExerciseMediaService';
import { useLanguage } from '../../../core/context/LanguageContext';

export const QuestionEditor = ({ question, index, exerciseId, onChange, onDelete }) => {
  const { isEnglish, t } = useLanguage();
  const update = (patch) => onChange({ ...question, ...patch });
  const auto = ![QUESTION_TYPES.WRITING, QUESTION_TYPES.SPEAKING].includes(question.type);
  const [uploading, setUploading] = useState(false);

  const TYPES = [
    [QUESTION_TYPES.AUDIO_IMAGE, t('exercises.questionTypes.AUDIO_IMAGE', isEnglish ? 'Look & Listen (Image + Audio)' : 'Nhìn Tranh & Nghe (Hình Ảnh + Âm Thanh)')],
    [QUESTION_TYPES.MULTIPLE_CHOICE, t('exercises.questionTypes.MULTIPLE_CHOICE', isEnglish ? 'Multiple choice' : 'Trắc nghiệm')],
    [QUESTION_TYPES.FILL_BLANK, t('exercises.questionTypes.FILL_BLANK', isEnglish ? 'Fill in the blank' : 'Điền từ')],
    [QUESTION_TYPES.SHORT_ANSWER, t('exercises.questionTypes.SHORT_ANSWER', isEnglish ? 'Short answer' : 'Trả lời ngắn')],
    [QUESTION_TYPES.WRITING, t('exercises.questionTypes.WRITING', isEnglish ? 'Writing' : 'Viết đoạn')],
    [QUESTION_TYPES.SPEAKING, t('exercises.questionTypes.SPEAKING', isEnglish ? 'Speaking' : 'Thu âm nói')],
    [QUESTION_TYPES.WORD_ORDER, t('exercises.questionTypes.WORD_ORDER', isEnglish ? 'Word order game' : 'Sắp xếp từ')],
    [QUESTION_TYPES.MATCHING, t('exercises.questionTypes.MATCHING', isEnglish ? 'Matching game' : 'Ghép cặp')],
  ];

  const upload = async (file) => {
    setUploading(true);
    try {
      const media = await ExerciseMediaService.upload(file, exerciseId);
      update({ media: [...(question.media || []), media] });
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <Card
      size="small"
      title={t('exercises.questionIndex', {
        number: index + 1,
        defaultValue: isEnglish ? `Question ${index + 1}` : `Câu hỏi ${index + 1}`,
      })}
      extra={<Button danger type="text" icon={<DeleteOutlined />} onClick={onDelete} />}
      style={{ marginBottom: 12, borderRadius: 10 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <Space wrap style={{ width: '100%' }}>
          <Select
            value={question.type}
            onChange={(type) =>
              update({
                type,
                options: [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(type) ? ['', ''] : [],
                pairs: type === QUESTION_TYPES.MATCHING ? [{ left: '', right: '' }, { left: '', right: '' }] : [],
              })
            }
            options={TYPES.map(([value, label]) => ({ value, label }))}
            style={{ minWidth: 260, height: 40 }}
          />
          <InputNumber
            min={0}
            value={question.points}
            onChange={(points) => update({ points })}
            addonBefore={t('exercises.points', isEnglish ? 'Points' : 'Điểm')}
            style={{ width: 175, height: 40 }}
          />
        </Space>

        {question.type === QUESTION_TYPES.AUDIO_IMAGE && (
          <Alert
            type="info"
            showIcon
            style={{ borderRadius: 8 }}
            message={
              isEnglish
                ? 'Look & Listen: Attach 1 illustration image and 1 audio track for students to observe and listen.'
                : 'Dạng Nhìn Tranh & Nghe: Vui lòng đính kèm 1 Hình ảnh minh họa và 1 File âm thanh để học viên vừa nhìn vừa nghe.'
            }
          />
        )}

        <Input.TextArea
          value={question.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder={
            question.type === QUESTION_TYPES.AUDIO_IMAGE
              ? (isEnglish ? 'Question prompt (e.g. Look at the picture and listen to the audio...)' : 'Nội dung câu hỏi (Ví dụ: Nhìn tranh và nghe đoạn hội thoại, sau đó chọn...)')
              : t('exercises.questionPromptPlaceholder', isEnglish ? 'Question prompt' : 'Nội dung câu hỏi')
          }
          autoSize={{ minRows: 2, maxRows: 5 }}
        />

        {/* Khung đính kèm Đa Phương Tiện (Hình ảnh, Âm thanh, Video) */}
        <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <Space wrap size={8} style={{ marginBottom: (question.media || []).length > 0 ? 10 : 0 }}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={upload}>
              <Button loading={uploading} icon={<PictureOutlined />} style={{ borderRadius: 6 }}>
                {isEnglish ? 'Add Image' : 'Thêm Hình Ảnh'}
              </Button>
            </Upload>
            <Upload accept="audio/*" showUploadList={false} beforeUpload={upload}>
              <Button loading={uploading} icon={<CustomerServiceOutlined />} style={{ borderRadius: 6 }}>
                {isEnglish ? 'Add Audio' : 'Thêm Âm Thanh'}
              </Button>
            </Upload>
            <Upload accept="video/*" showUploadList={false} beforeUpload={upload}>
              <Button loading={uploading} icon={<VideoCameraOutlined />} style={{ borderRadius: 6 }}>
                {isEnglish ? 'Add Video' : 'Thêm Video'}
              </Button>
            </Upload>
          </Space>

          {(question.media || []).length > 0 && (
            <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
              {question.media.map((media) => {
                const isImg = String(media.mimeType || '').startsWith('image/');
                const isAud = String(media.mimeType || '').startsWith('audio/');
                return (
                  <div
                    key={media.id || media.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: '#ffffff',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Space size={8}>
                      <Tag color={isImg ? 'cyan' : isAud ? 'orange' : 'purple'} style={{ borderRadius: 4, margin: 0 }}>
                        {isImg ? '📷 Ảnh' : isAud ? '🎧 Audio' : '🎬 Video'}
                      </Tag>
                      <a href={media.driveUrl || media.url} target="_blank" rel="noreferrer" style={{ fontWeight: 500, fontSize: 13 }}>
                        {media.name || 'Media'}
                      </a>
                    </Space>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() =>
                        update({ media: question.media.filter((item) => (item.id || item.url) !== (media.id || media.url)) })
                      }
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </Space>
          )}
        </div>

        {[QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(question.type) && (
          <OptionsEditor question={question} update={update} isEnglish={isEnglish} t={t} />
        )}
        {question.type === QUESTION_TYPES.MATCHING && (
          <PairEditor question={question} update={update} isEnglish={isEnglish} t={t} />
        )}
        {auto && ![QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(question.type) && (
          <Input
            value={(question.acceptedAnswers || []).join(' | ')}
            onChange={(e) =>
              update({
                acceptedAnswers: e.target.value
                  .split('|')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            placeholder={t(
              'exercises.acceptedAnswersPlaceholder',
              isEnglish ? 'Accepted answers, separated by |' : 'Đáp án chấp nhận, cách nhau bởi |'
            )}
            style={{ height: 40 }}
          />
        )}
        {!auto && (
          <Input.TextArea
            value={question.rubric || ''}
            onChange={(e) => update({ rubric: e.target.value })}
            placeholder={t(
              'exercises.teacherRubricPlaceholder',
              isEnglish ? 'Teacher marking guidance / rubric' : 'Hướng dẫn chấm cho giáo viên'
            )}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        )}
      </Space>
    </Card>
  );
};

const PairEditor = ({ question, update, isEnglish, t }) => (
  <Space direction="vertical" style={{ width: '100%' }} size={6}>
    {(question.pairs || []).map((pair, index) => (
      <Space key={index} style={{ width: '100%' }}>
        <Input
          value={pair.left}
          onChange={(e) =>
            update({
              pairs: question.pairs.map((item, i) =>
                i === index ? { ...item, left: e.target.value } : item
              ),
            })
          }
          placeholder={t('exercises.leftItem', isEnglish ? 'Left item' : 'Mục bên trái')}
          style={{ height: 40 }}
        />
        <Input
          value={pair.right}
          onChange={(e) =>
            update({
              pairs: question.pairs.map((item, i) =>
                i === index ? { ...item, right: e.target.value } : item
              ),
            })
          }
          placeholder={t('exercises.matchingAnswer', isEnglish ? 'Matching answer' : 'Đáp án ghép')}
          style={{ height: 40 }}
        />
        <Button
          danger
          type="text"
          disabled={question.pairs.length <= 2}
          onClick={() => update({ pairs: question.pairs.filter((_, i) => i !== index) })}
        >
          ×
        </Button>
      </Space>
    ))}
    <Button
      icon={<PlusOutlined />}
      onClick={() => update({ pairs: [...question.pairs, { left: '', right: '' }] })}
    >
      {t('exercises.addPair', isEnglish ? 'Add pair' : 'Thêm cặp')}
    </Button>
  </Space>
);

const OptionsEditor = ({ question, update, isEnglish, t }) => {
  const options = question.options || [];
  const setOption = (idx, value) =>
    update({ options: options.map((item, i) => (i === idx ? value : item)) });

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={6}>
      {options.map((option, idx) => (
        <Space key={idx} style={{ width: '100%' }}>
          <Button
            type={question.correctOptionId === String(idx) ? 'primary' : 'default'}
            onClick={() => update({ correctOptionId: String(idx) })}
          >
            {question.correctOptionId === String(idx) ? '✓' : String.fromCharCode(65 + idx)}
          </Button>
          <Input
            value={option}
            onChange={(e) => setOption(idx, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            style={{ minWidth: 280, height: 40 }}
          />
          <Button
            danger
            type="text"
            disabled={options.length <= 2}
            onClick={() => update({ options: options.filter((_, i) => i !== idx) })}
          >
            ×
          </Button>
        </Space>
      ))}
      <Button
        icon={<PlusOutlined />}
        onClick={() => update({ options: [...options, ''] })}
      >
        {t('exercises.addOption', isEnglish ? 'Add option' : 'Thêm đáp án')}
      </Button>
    </Space>
  );
};
export default QuestionEditor;
