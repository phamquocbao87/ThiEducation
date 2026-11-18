import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Button, Divider, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ClearOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * normalizeToHtml
 * Chuyển đổi dữ liệu đầu vào (Array, Multiline Plaintext, Legacy Markdown) thành HTML chuẩn TipTap.
 * Tự động sửa chữa lỗi ký tự sao xếp chồng (******bold****** -> <strong>bold</strong>).
 */
export const normalizeToHtml = (value) => {
  if (!value) return '';

  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((line) => {
        let l = String(line).trim();
        // Sửa lỗi xếp chồng dấu sao
        l = l.replace(/\*{4,}/g, '**');
        l = l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        l = l.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        return `<p>${l}</p>`;
      })
      .join('');
  }

  const str = String(value).trim();
  if (!str) return '';

  // Sửa lỗi xếp chồng dấu sao
  let cleanStr = str.replace(/\*{4,}/g, '**');
  cleanStr = cleanStr.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleanStr = cleanStr.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Nếu đã chứa các thẻ khối HTML (<p>, <ul>, <ol>, <div>)
  if (/<(p|ul|ol|div|h[1-6])[\s>]/i.test(cleanStr)) {
    return cleanStr;
  }

  // Chuỗi text thông thường phân tách bằng \n
  return cleanStr
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
};

/**
 * parseObjectivesList
 * Tách các khối HTML của TipTap thành mảng chuỗi từng mục tiêu để lưu vào database,
 * giữ nguyên định dạng inline (<strong>, <em>, <u>).
 */
export const parseObjectivesList = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw || typeof raw !== 'string') return [];

  const text = raw.trim();
  if (!text) return [];

  // Nếu là HTML có chứa thẻ khối <p> hoặc <li>
  if (/<(p|li|div)[\s>]/i.test(text)) {
    const matches = [];
    const blockRegex = /<(?:p|li|div)[^>]*>(.*?)<\/(?:p|li|div)>/gi;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      let content = match[1].trim();
      content = content.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '').trim();
      if (content && content !== '<br>' && content !== '<br/>') {
        matches.push(content);
      }
    }
    if (matches.length > 0) return matches;
  }

  // Fallback phân tách bằng \n
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * SimpleObjectivesEditor — Trình soạn thảo mục tiêu bài học & ngữ âm WYSIWYG
 * Chuẩn sư phạm McGraw-Hill Wonders (React 19 + TipTap v3).
 * Định dạng trực quan: B (Bold), I (Italic), U (Underline), Bullet & Numbered List, Wonders Snippets.
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
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
      }),
      Underline,
    ],
    content: normalizeToHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'tiptap-objectives-content',
        'data-testid': `${testId}-textarea`,
        style: 'outline: none; min-height: 140px; padding: 10px 12px; font-size: 13px; line-height: 22px; color: #1e293b;',
      },
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const cleanHtml = ed.isEmpty ? '' : html;
      onChange?.(cleanHtml);
    },
  });

  // Đồng bộ nội dung khi `value` từ bên ngoài thay đổi (ví dụ khi chọn template hoặc chuyển session)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      const normalized = normalizeToHtml(value);
      if (normalized !== currentHtml && (normalized !== '' || !editor.isEmpty)) {
        editor.commands.setContent(normalized, false);
      }
    }
  }, [value, editor]);

  // Cập nhật trạng thái editable khi `disabled` thay đổi
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const handleInsertSnippet = (snippet) => {
    if (!editor || disabled) return;
    editor.chain().focus().insertContent(`<p>${snippet}</p>`).run();
  };

  const handleClear = () => {
    if (!editor || disabled) return;
    editor.commands.clearContent();
    onChange?.('');
  };

  const textContent = editor ? editor.getText() : '';
  const lineCount = textContent.split('\n').filter((l) => l.trim()).length;
  const charCount = textContent.length;

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
      {/* 1. Thanh Công Cụ Soạn Thảo (Toolbar) */}
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
          {/* Bold */}
          <Tooltip title={isEnglish ? 'Bold (Ctrl+B)' : 'In đậm (Ctrl+B)'}>
            <Button
              size="small"
              type={editor?.isActive('bold') ? 'primary' : 'default'}
              icon={<BoldOutlined />}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-bold"
            />
          </Tooltip>

          {/* Italic */}
          <Tooltip title={isEnglish ? 'Italic (Ctrl+I)' : 'In nghiêng (Ctrl+I)'}>
            <Button
              size="small"
              type={editor?.isActive('italic') ? 'primary' : 'default'}
              icon={<ItalicOutlined />}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-italic"
            />
          </Tooltip>

          {/* Underline */}
          <Tooltip title={isEnglish ? 'Underline (Ctrl+U)' : 'Gạch chân (Ctrl+U)'}>
            <Button
              size="small"
              type={editor?.isActive('underline') ? 'primary' : 'default'}
              icon={<UnderlineOutlined />}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-underline"
            />
          </Tooltip>

          {/* Bullet List */}
          <Tooltip title={isEnglish ? 'Bullet list (•)' : 'Dấu đầu dòng (•)'}>
            <Button
              size="small"
              type={editor?.isActive('bulletList') ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-bullet"
            />
          </Tooltip>

          {/* Numbered List */}
          <Tooltip title={isEnglish ? 'Numbered list (1, 2...)' : 'Đánh số thứ tự (1, 2...)'}>
            <Button
              size="small"
              type={editor?.isActive('orderedList') ? 'primary' : 'default'}
              icon={<OrderedListOutlined />}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              style={{ borderRadius: 6, minWidth: 28, height: 26 }}
              data-testid="btn-toolbar-ordered"
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
          {editor && !editor.isEmpty && !disabled && (
            <Tooltip title={isEnglish ? 'Clear all text' : 'Xóa toàn bộ'}>
              <Button
                size="small"
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={handleClear}
                style={{ fontSize: 11, height: 24, padding: '0 4px' }}
                data-testid="btn-toolbar-clear"
              >
                {isEnglish ? 'Clear' : 'Xóa'}
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* 2. Khung Soạn Thảo WYSIWYG TipTap */}
      <div
        style={{
          minHeight: 140,
          cursor: disabled ? 'not-allowed' : 'text',
          backgroundColor: 'transparent',
        }}
        onClick={() => !disabled && editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

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
          {charCount}/{maxLength}
        </span>
      </div>

      <style>{`
        .tiptap-objectives-content p {
          margin: 0 0 6px 0;
          line-height: 22px;
        }
        .tiptap-objectives-content ul,
        .tiptap-objectives-content ol {
          padding-left: 20px;
          margin: 0 0 6px 0;
        }
        .tiptap-objectives-content strong {
          font-weight: 700;
          color: #0f172a;
        }
        .tiptap-objectives-content em {
          font-style: italic;
        }
        .tiptap-objectives-content u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
});
