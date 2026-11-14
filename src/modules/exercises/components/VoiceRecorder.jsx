import React, { useRef, useState } from 'react';
import { Alert, Button, Space } from 'antd';
import { AudioOutlined, PauseCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { ExerciseMediaService } from '../services/ExerciseMediaService';
import { useLanguage } from '../../../core/context/LanguageContext';

export const VoiceRecorder = ({ exerciseId, answer, onChange }) => {
  const { isEnglish, t } = useLanguage();
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const start = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stopTracks();
        setRecording(false);
        setUploading(true);
        try {
          const type = recorder.mimeType || 'audio/webm';
          const file = new File(
            [new Blob(chunksRef.current, { type })],
            `speaking-${Date.now()}.webm`,
            { type }
          );
          const media = await ExerciseMediaService.upload(
            file,
            exerciseId,
            'student-speaking'
          );
          onChange(media?.url || '');
        } catch {
          setError(
            t(
              'exercises.recordingUploadFailed',
              isEnglish
                ? 'The recording could not be uploaded. Please try again.'
                : 'Không thể tải bản thu lên. Vui lòng thử lại.'
            )
          );
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError(
        t(
          'exercises.micAccessRequired',
          isEnglish
            ? 'Please allow microphone access to record your answer.'
            : 'Vui lòng cho phép dùng microphone để thu âm bài nói.'
        )
      );
    }
  };

  const stop = () =>
    recorderRef.current?.state === 'recording' && recorderRef.current.stop();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space wrap>
        {recording ? (
          <Button danger icon={<PauseCircleOutlined />} onClick={stop}>
            {t('exercises.stopRecording', isEnglish ? 'Stop Recording' : 'Dừng Thu')}
          </Button>
        ) : (
          <Button icon={<AudioOutlined />} onClick={start} disabled={uploading}>
            {t('exercises.recordAnswer', isEnglish ? 'Record Answer' : 'Thu Âm Trả Lời')}
          </Button>
        )}
        {uploading && (
          <Button loading icon={<UploadOutlined />}>
            {t('exercises.uploadingAudio', isEnglish ? 'Uploading...' : 'Đang Tải Bản Thu...')}
          </Button>
        )}
      </Space>
      {answer && <audio controls src={answer} style={{ width: '100%', marginTop: 8 }} />}
      {error && <Alert type="warning" showIcon message={error} style={{ marginTop: 8 }} />}
    </Space>
  );
};
export default VoiceRecorder;
