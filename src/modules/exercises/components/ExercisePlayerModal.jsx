import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Input, Modal, Radio, Row, Select, Space, Tag, Typography } from 'antd';
import { QUESTION_TYPES } from '../models/exercise.model';
import { VoiceRecorder } from './VoiceRecorder';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

const extractDriveId = (media) => {
  if (media?.id && !media.id.startsWith('http') && media.id.length >= 20) return media.id;
  const target = media?.driveUrl || media?.url || '';
  const matchD = target.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];
  const matchId = target.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];
  return null;
};

const extractYouTubeId = (url = '') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const renderQuestionMedia = (media, isEnglish) => {
  if (!media) return null;
  const mime = String(media.mimeType || '').toLowerCase();
  const rawUrl = media.url || '';
  const driveId = extractDriveId(media);
  const ytId = extractYouTubeId(rawUrl);
  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(rawUrl);
  const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(rawUrl) || Boolean(media.name?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));
  const isVideo = mime.startsWith('video/') || ytId || /\.(mp4|webm|mov|mkv)$/i.test(rawUrl) || Boolean(media.name?.match(/\.(mp4|webm|mov|mkv)$/i));

  // 1. Hình ảnh
  if (isImage) {
    const imgSrc = driveId
      ? `https://lh3.googleusercontent.com/d/${driveId}=s800`
      : rawUrl;
    return (
      <div key={media.url || media.id} style={{ marginBottom: 14 }}>
        <img
          src={imgSrc}
          alt={media.name || 'Question visual'}
          style={{
            maxWidth: '100%',
            maxHeight: 320,
            objectFit: 'contain',
            display: 'block',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        />
      </div>
    );
  }

  // 2. Audio Luyện Nghe
  if (isAudio) {
    if (driveId) {
      const driveView = media.driveUrl || `https://drive.google.com/file/d/${driveId}/view`;
      return (
        <div
          key={media.url || media.id}
          style={{
            marginBottom: 14,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #fed7aa',
            backgroundColor: '#fffbeb',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #fde68a',
            }}
          >
            <Text strong style={{ fontSize: 13, color: '#92400e' }}>
              🎧 {media.name || (isEnglish ? 'Listening Track' : 'File Âm Thanh Luyện Nghe')}
            </Text>
            <a
              href={driveView}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}
            >
              {isEnglish ? 'Open on Drive ↗' : 'Mở trên Google Drive ↗'}
            </a>
          </div>
          <iframe
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title={media.name || 'Audio Listening'}
            style={{
              width: '100%',
              height: 120,
              border: 'none',
              display: 'block',
              backgroundColor: '#ffffff',
            }}
            allow="autoplay"
          />
        </div>
      );
    }

    return (
      <div
        key={media.url || media.id}
        style={{
          marginBottom: 14,
          padding: '8px 12px',
          borderRadius: 8,
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <Text strong style={{ fontSize: 13, color: '#1e293b', display: 'block', marginBottom: 6 }}>
          🎧 {media.name || (isEnglish ? 'Listening Track' : 'File Âm Thanh Luyện Nghe')}
        </Text>
        <audio controls src={rawUrl} style={{ width: '100%', height: 40 }} />
      </div>
    );
  }

  // 3. Video Bài Học
  if (isVideo) {
    if (ytId) {
      return (
        <div
          key={media.url || media.id}
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            height: 0,
            marginBottom: 14,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
            title={media.name || 'Lesson Video'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="autoplay; fullscreen"
          />
        </div>
      );
    }

    if (driveId) {
      const driveView = media.driveUrl || `https://drive.google.com/file/d/${driveId}/view`;
      return (
        <div
          key={media.url || media.id}
          style={{
            marginBottom: 14,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            backgroundColor: '#0f172a',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>
              🎬 {media.name || (isEnglish ? 'Lesson Video' : 'Video Bài Học')}
            </Text>
            <a
              href={driveView}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}
            >
              {isEnglish ? 'Open on Drive ↗' : 'Mở trên Google Drive ↗'}
            </a>
          </div>
          <iframe
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title={media.name || 'Lesson Video'}
            style={{
              width: '100%',
              height: 300,
              border: 'none',
              display: 'block',
            }}
            allow="autoplay; fullscreen"
          />
        </div>
      );
    }

    return (
      <div key={media.url || media.id} style={{ marginBottom: 14 }}>
        <video
          controls
          src={rawUrl}
          style={{
            width: '100%',
            maxHeight: 320,
            borderRadius: 8,
            backgroundColor: '#000',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return null;
};

export const ExercisePlayerModal = ({
  assignment,
  exercise,
  open,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const { isEnglish, t } = useLanguage();
  const [answers, setAnswers] = useState({});
  const draftKey =
    assignment?.id && exercise?.id
      ? `lak_exercise_draft_${assignment.id}_${exercise.id}`
      : '';

  useEffect(() => {
    if (open) {
      try {
        setAnswers(JSON.parse(localStorage.getItem(draftKey) || '{}'));
      } catch {
        setAnswers({});
      }
    }
  }, [open, assignment?.id, draftKey]);

  useEffect(() => {
    if (open && draftKey) localStorage.setItem(draftKey, JSON.stringify(answers));
  }, [answers, open, draftKey]);

  if (!exercise) return null;

  const update = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    if (await onSubmit(answers)) {
      if (draftKey) localStorage.removeItem(draftKey);
    }
  };

  const isPreview = Boolean(assignment?.id?.startsWith('preview_'));

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={820}
      destroyOnClose
      title={exercise.title}
      footer={
        <Space>
          <Button onClick={onCancel}>
            {t('exercises.saveLater', isEnglish ? 'Save & Exit' : 'Làm Sau')}
          </Button>
          <Button type="primary" loading={submitting} onClick={submit}>
            {t('exercises.submit', isEnglish ? 'Submit' : 'Nộp Bài')}
          </Button>
        </Space>
      }
    >
      {isPreview && (
        <Alert
          type="info"
          showIcon
          message={t('exercises.previewBanner', isEnglish ? 'Preview Mode (No record will be saved)' : 'Chế Độ Xem Thử (Không lưu kết quả bài làm)')}
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      {exercise.description && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {exercise.description}
        </Text>
      )}

      {(exercise.questions || []).map((question, index) => {
        const isAudioImage = question.type === QUESTION_TYPES.AUDIO_IMAGE;
        const images = (question.media || []).filter((m) => {
          const mime = String(m.mimeType || '').toLowerCase();
          const url = m.url || '';
          return mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
        });
        const audios = (question.media || []).filter((m) => {
          const mime = String(m.mimeType || '').toLowerCase();
          const url = m.url || '';
          return mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(url) || Boolean(m.name?.match(/\.(mp3|wav|ogg|m4a|aac)$/i));
        });
        const others = (question.media || []).filter((m) => !images.includes(m) && !audios.includes(m));
        const hasBothImageAndAudio = images.length > 0 && audios.length > 0;

        return (
          <Card
            key={question.id}
            size="small"
            style={{ marginTop: 14, borderRadius: 10 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span>
                  {index + 1}. {question.prompt} ({question.points} {isEnglish ? 'pts' : 'điểm'})
                </span>
                {isAudioImage && (
                  <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                    🎧 {isEnglish ? 'Look & Listen' : 'Nhìn Tranh & Nghe Audio'}
                  </Tag>
                )}
              </div>
            }
          >
            {/* Nếu có cả Hình ảnh và Âm thanh: Bố cục Audio-Visual chuyên dụng */}
            {hasBothImageAndAudio ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={12}>
                    {images.map((img) => renderQuestionMedia(img, isEnglish))}
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Text strong style={{ color: '#4338ca', fontSize: 13, marginBottom: 8, display: 'block' }}>
                        🎧 {isEnglish ? 'Listen carefully to the audio track:' : 'Lắng nghe kỹ đoạn âm thanh:'}
                      </Text>
                      {audios.map((aud) => renderQuestionMedia(aud, isEnglish))}
                    </div>
                  </Col>
                </Row>
                {others.map((oth) => renderQuestionMedia(oth, isEnglish))}
              </div>
            ) : (
              (question.media || []).map((media) => renderQuestionMedia(media, isEnglish))
            )}

            {[QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.AUDIO_IMAGE].includes(question.type) && (
              <Radio.Group
                value={answers[question.id]}
                onChange={(e) => update(question.id, e.target.value)}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {question.options?.map((option, optionIndex) => (
                    <Radio key={optionIndex} value={String(optionIndex)}>
                      <span style={{ fontSize: 14 }}>{option}</span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}

          {[QUESTION_TYPES.FILL_BLANK, QUESTION_TYPES.SHORT_ANSWER, QUESTION_TYPES.WORD_ORDER].includes(
            question.type
          ) && (
            <Input
              value={answers[question.id] || ''}
              onChange={(e) => update(question.id, e.target.value)}
              placeholder={
                question.type === QUESTION_TYPES.WORD_ORDER
                  ? t('exercises.typeOrderedSentence', isEnglish ? 'Type the ordered sentence...' : 'Nhập câu đã sắp xếp đúng...')
                  : t('exercises.yourAnswer', isEnglish ? 'Your answer...' : 'Câu trả lời của em...')
              }
              style={{ height: 40 }}
            />
          )}

          {question.type === QUESTION_TYPES.MATCHING && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {(question.pairs || []).map((pair) => (
                <Space key={pair.left} style={{ width: '100%' }}>
                  <Text style={{ minWidth: 130 }}>{pair.left}</Text>
                  <Select
                    value={answers[question.id]?.[pair.left]}
                    onChange={(value) =>
                      update(question.id, {
                        ...(answers[question.id] || {}),
                        [pair.left]: value,
                      })
                    }
                    options={(question.pairs || []).map((item) => ({
                      value: item.right,
                      label: item.right,
                    }))}
                    style={{ minWidth: 220, height: 40 }}
                  />
                </Space>
              ))}
            </Space>
          )}

          {question.type === QUESTION_TYPES.WRITING && (
            <Input.TextArea
              value={answers[question.id] || ''}
              onChange={(e) => update(question.id, e.target.value)}
              placeholder={t('exercises.writeYourAnswer', isEnglish ? 'Write your answer...' : 'Viết câu trả lời của em...')}
              autoSize={{ minRows: 5, maxRows: 10 }}
            />
          )}

          {question.type === QUESTION_TYPES.SPEAKING && (
            <VoiceRecorder
              exerciseId={`${assignment.id}/${question.id}`}
              answer={answers[question.id]}
              onChange={(value) => update(question.id, value)}
            />
          )}
        </Card>
      );
    })}
    </Modal>
  );
};
export default ExercisePlayerModal;
