import React, { useRef, useState } from 'react';
import { Button, Divider, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ClearOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * SimpleObjectivesEditor
 * Trình soạn thảo mục tiêu bài học & ngữ âm đơn giản, chuẩn sư phạm McGraw-Hill Wonders.
 * Tích hợp thanh công cụ định dạng và phím tắt 1-chạm nạp nhanh cấu trúc bài học.
 */
export const SimpleObjectivesEditor = React.memo(({
  value = '',
  onChange,
  disabled = false,
  placeholder,
  testId = 'objectives-editor',
  maxLength = 2000,
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
      const sample = prefix === '**' ? (isEnglish ? 'key objective' : 'mục tiêu chính') : prefix === '*' ? (isEnglish ? 'note' : 'lưu ý') : '';
      newText = currentVal.substring(0, start) + prefix + sample + suffix + currentVal.substring(end);
      newCursorPos = start + prefix.length + sample.length;
    }

    onChange?.(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertSnippet = (snippet) => {
    if (disabled) return;
    const textarea = textareaRef.current;
    const currentVal = value || '';
    const start = textarea ? textarea.selectionStart ?? currentVal.length : currentVal.length;

    // Thêm xuống dòng nếu trước đó chưa có
    const needNewlineBefore = start > 0 && currentVal[start - 1] !== '\n';
    const toInsert = (needNewlineBefore ? '\n' : '') + snippet;

    const newText = currentVal.substring(0, start) + toInsert + currentVal.substring(start);
    onChange?.(newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextPos = start + toInsert.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange?.('');
    textareaRef.current?.focus();
  };

  const lineCount = (value || '').split('\n').filter((l) => l.trim()).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: isFocused ? '1px solid #1677ff' : '1px solid #d9d9d9',
        borderRadius: 10,
        backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
        transition: 'all 0.2s ease',
        boxShadow: isFocused ? '0 0 0 2px rgba(22, 119, 255, 0.1)' : 'none',
        overflow: 'hidden',
      }}
      data-testid={testId}
    >
      {/* 1. Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '6px 10px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          fontSize: 12,
        }}
      >
        <Space size={4} wrap>
          <Tooltip title={isEnglish ? 'Bold (**text**)' : 'In đậm (**chữ**)'}>
            <Button
              size="small"
              icon={<BoldOutlined />}
              disabled={disabled}
              onClick={() => handleFormat('**', '**')}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-bold"
            />
          </Tooltip>

          <Tooltip title={isEnglish ? 'Italic (*text*)' : 'In nghiêng (*chữ*)'}>
            <Button
              size="small"
              icon={<ItalicOutlined />}
              disabled={disabled}
              onClick={() => handleFormat('*', '*')}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-italic"
            />
          </Tooltip>

          <Tooltip title={isEnglish ? 'Bullet point (•)' : 'Dấu đầu dòng (•)'}>
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              disabled={disabled}
              onClick={() => handleInsertSnippet('• ')}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-bullet"
            />
          </Tooltip>

          <Divider type="vertical" style={{ margin: '0 4px', height: 16 }} />

          {/* Quick Wonders Snippets */}
          <span style={{ fontSize: 11, color: '#8c8c8c', fontWeight: 600 }}>
            {isEnglish ? 'Wonders Snippets:' : 'Chèn nhanh:'}
          </span>

          <Button
            size="small"
            disabled={disabled}
            onClick={() => handleInsertSnippet('• 🎯 Essential Question: ')}
            style={{ borderRadius: 6, fontSize: 11, height: 24, padding: '0 6px', color: '#1d39c4', borderColor: '#adc6ff', backgroundColor: '#f0f5ff' }}
            data-testid="btn-snippet-0"
          >
            🎯 Question
          </Button>

          <Button
            size="small"
            disabled={disabled}
            onClick={() => handleInsertSnippet('• 📖 Anchor Text: ')}
            style={{ borderRadius: 6, fontSize: 11, height: 24, padding: '0 6px', color: '#0958d9', borderColor: '#91caff' }}
            data-testid="btn-snippet-1"
          >
            📖 Reading
          </Button>

          <Button
            size="small"
            disabled={disabled}
            onClick={() => handleInsertSnippet('• 🔤 Phonics: ')}
            style={{ borderRadius: 6, fontSize: 11, height: 24, padding: '0 6px', color: '#389e0d', borderColor: '#b7eb8f', backgroundColor: '#f6ffed' }}
            data-testid="btn-snippet-2"
          >
            🔤 Phonics
          </Button>

          <Button
            size="small"
            disabled={disabled}
            onClick={() => handleInsertSnippet('• 💬 High-Frequency Words: ')}
            style={{ borderRadius: 6, fontSize: 11, height: 24, padding: '0 6px', color: '#d46b08', borderColor: '#ffd591', backgroundColor: '#fff7e6' }}
            data-testid="btn-snippet-3"
          >
            💬 Words
          </Button>

          <Button
            size="small"
            disabled={disabled}
            onClick={() => handleInsertSnippet('• 🧩 Grammar: ')}
            style={{ borderRadius: 6, fontSize: 11, height: 24, padding: '0 6px', color: '#722ed1', borderColor: '#d3adf7', backgroundColor: '#f9f0ff' }}
            data-testid="btn-snippet-4"
          >
            🧩 Grammar
          </Button>
        </Space>

        <Space size={6}>
          {value && !disabled && (
            <Tooltip title={isEnglish ? 'Clear all text' : 'Xóa toàn bộ'}>
              <Button
                size="small"
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={handleClear}
                style={{ fontSize: 11, height: 24, padding: '0 4px' }}
              >
                {isEnglish ? 'Clear' : 'Xóa'}
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* 2. Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || (isEnglish
          ? '• 🎯 Essential Question: What makes a community?\n• 📖 Anchor Text: Six Kids\n• 🔤 Phonics: Short i sound blending\n• 💬 High-Frequency Words: down, out, up'
          : '• 🎯 Essential Question: What makes a community?\n• 📖 Anchor Text: Six Kids\n• 🔤 Phonics: Short i sound blending\n• 💬 High-Frequency Words: down, out, up')}
        maxLength={maxLength}
        style={{
          width: '100%',
          minHeight: 140,
          border: 'none',
          outline: 'none',
          padding: '10px 12px',
          fontSize: 13,
          lineHeight: '22px',
          fontFamily: 'inherit',
          resize: 'vertical',
          backgroundColor: 'transparent',
          color: disabled ? '#8c8c8c' : '#1e293b',
        }}
        data-testid={`${testId}-textarea`}
      />

      {/* 3. Footer Counter */}
      <div
        data-testid="objectives-counter"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #f0f0f0',
          fontSize: 11,
          color: '#8c8c8c',
        }}
      >
        <span>
          🎯 {isEnglish ? `${lineCount} objectives / lines` : `${lineCount} mục tiêu bài học`}
        </span>
        <span>
          {(value || '').length}/{maxLength}
        </span>
      </div>
    </div>
  );
});
