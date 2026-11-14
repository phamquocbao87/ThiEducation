import React, { useRef, useState } from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * SimpleEvaluationEditor
 * Trình soạn thảo nhận xét đơn giản, chuẩn sư phạm dành cho Giáo viên.
 * Chiều cao chuẩn ~160px (cao gấp 5 lần ô input 32px ban đầu).
 */
export const SimpleEvaluationEditor = React.memo(({
  value = '',
  onChange,
  disabled = false,
  placeholder,
  testId,
  maxLength = 1000,
}) => {
  const { isEnglish } = useLanguage();
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleFormat = (prefix, suffix = '') => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = value || '';
    const selectedText = currentVal.substring(start, end);

    let newText = '';
    let newCursorPos = start + prefix.length;

    if (selectedText) {
      newText = currentVal.substring(0, start) + prefix + selectedText + suffix + currentVal.substring(end);
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      const sample = prefix === '**' ? 'từ khóa' : prefix === '*' ? 'lưu ý' : '';
      newText = currentVal.substring(0, start) + prefix + sample + suffix + currentVal.substring(end);
      newCursorPos = start + prefix.length + sample.length;
    }

    onChange?.(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertBullet = (bullet = '• ') => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const currentVal = value || '';
    const prefixNewline = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
    const insertText = `${prefixNewline}${bullet}`;

    const newText = currentVal.substring(0, start) + insertText + currentVal.substring(start);
    onChange?.(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleInsertSnippet = (snippet) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const currentVal = value || '';
    const prefixNewline = start > 0 && currentVal[start - 1] !== '\n' ? '\n' : '';
    const insertText = `${prefixNewline}${snippet} `;

    const newText = currentVal.substring(0, start) + insertText + currentVal.substring(start);
    onChange?.(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange?.('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const currentLength = (value || '').length;

  return (
    <div
      className="simple-evaluation-editor"
      style={{
        border: isFocused ? '1px solid #1890ff' : '1px solid #d9d9d9',
        boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.12)' : 'none',
        borderRadius: 8,
        backgroundColor: disabled ? '#f8fafc' : '#ffffff',
        height: 160,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        width: '100%',
      }}
    >
      {/* 1. Thanh Công Cụ Soạn Thảo (Toolbar) */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: 4,
          minHeight: 34,
        }}
      >
        <Space size={2} wrap={false} style={{ overflowX: 'auto', maxWidth: 'calc(100% - 30px)' }}>
          <Tooltip title={isEnglish ? 'Bold' : 'In đậm (Bold)'}>
            <Button
              size="small"
              type="text"
              disabled={disabled}
              icon={<BoldOutlined />}
              onClick={() => handleFormat('**', '**')}
              style={{ width: 26, height: 26, padding: 0 }}
            />
          </Tooltip>

          <Tooltip title={isEnglish ? 'Italic' : 'In nghiêng (Italic)'}>
            <Button
              size="small"
              type="text"
              disabled={disabled}
              icon={<ItalicOutlined />}
              onClick={() => handleFormat('*', '*')}
              style={{ width: 26, height: 26, padding: 0 }}
            />
          </Tooltip>

          <Tooltip title={isEnglish ? 'Bullet list' : 'Gạch đầu dòng (Bullet list)'}>
            <Button
              size="small"
              type="text"
              disabled={disabled}
              icon={<UnorderedListOutlined />}
              onClick={() => handleInsertBullet('• ')}
              style={{ width: 26, height: 26, padding: 0 }}
            />
          </Tooltip>

          <Tooltip title={isEnglish ? 'Numbered list' : 'Đánh số (Numbered list)'}>
            <Button
              size="small"
              type="text"
              disabled={disabled}
              icon={<OrderedListOutlined />}
              onClick={() => handleInsertBullet('1. ')}
              style={{ width: 26, height: 26, padding: 0 }}
            />
          </Tooltip>

          <Divider type="vertical" style={{ margin: '0 4px', height: 16 }} />

          {/* Quick Pedagogical Snippets */}
          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Praise: Fluent pronunciation, active interaction.' : '• Khen ngợi: Phát âm chuẩn, tự tin tương tác.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
          >
            🌟 {isEnglish ? 'Praise' : 'Khen ngợi'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Focus: Practice word endings and blending.' : '• Cần rèn: Chú ý phát âm âm đuôi và nối từ.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
          >
            🔤 {isEnglish ? 'Phonics' : 'Phonics'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Interaction: Actively engaged in class activities.' : '• Tương tác: Tích cực tham gia hoạt động.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
          >
            🗣️ {isEnglish ? 'Engagement' : 'Tương tác'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Homework: Complete Practice Book exercises.' : '• BTVN: Hoàn thành bài tập Practice Book.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
          >
            📚 {isEnglish ? 'Homework' : 'BTVN'}
          </Button>
        </Space>

        <Tooltip title={isEnglish ? 'Clear text' : 'Xóa nhận xét'}>
          <Button
            size="small"
            type="text"
            danger
            disabled={disabled || !value}
            icon={<ClearOutlined />}
            onClick={handleClear}
            style={{ width: 26, height: 26, padding: 0 }}
          />
        </Tooltip>
      </div>

      {/* 2. Vùng Nhập Liệu Soạn Thảo (Textarea) */}
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder || (isEnglish ? 'Enter comprehensive evaluation (strengths, pronunciation, homework)...' : 'Nhập nhận xét chi tiết buổi học (khen ngợi, điểm cần cải thiện, bài tập về nhà)...')}
        data-testid={testId}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 96,
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '8px 10px',
          fontSize: 13,
          lineHeight: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          color: disabled ? '#64748b' : '#1e293b',
          backgroundColor: 'transparent',
          boxSizing: 'border-box',
        }}
      />

      {/* 3. Chân Trang Thông Tin Đếm Ký Tự (Footer Bar) */}
      <div
        style={{
          background: '#ffffff',
          borderTop: '1px dashed #f1f5f9',
          padding: '2px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 22,
          minHeight: 22,
          fontSize: 11,
          color: '#94a3b8',
        }}
      >
        <span>{isEnglish ? 'Pedagogical evaluation editor' : 'Trình soạn thảo nhận xét buổi học'}</span>
        <span style={{ color: currentLength > 900 ? '#ff4d4f' : '#94a3b8' }}>
          {currentLength}/{maxLength}
        </span>
      </div>
    </div>
  );
});

