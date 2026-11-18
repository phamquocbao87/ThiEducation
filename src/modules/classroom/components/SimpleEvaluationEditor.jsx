import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * normalizeEvaluationToHtml
 * Chuẩn hóa nhận xét giáo viên sang HTML chuẩn TipTap,
 * tự động khôi phục chuỗi markdown cũ (**bold**, *italic*) và lỗi dấu sao xếp chồng (******).
 */
export const normalizeEvaluationToHtml = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  let cleanStr = str.replace(/\*{4,}/g, '**');
  cleanStr = cleanStr.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  cleanStr = cleanStr.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  if (/<(p|ul|ol|div|h[1-6])[\s>]/i.test(cleanStr)) {
    return cleanStr;
  }

  return cleanStr
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
};

/**
 * SimpleEvaluationEditor
 * Trình soạn thảo nhận xét sư phạm WYSIWYG trực quan dành cho Giáo viên.
 * Hỗ trợ: In đậm (B), In nghiêng (I), Gạch chân (U), Danh sách (List •= / 1.=), Phím tắt nhận xét sư phạm.
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
    content: normalizeEvaluationToHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'tiptap-eval-content',
        'data-testid': testId || 'simple-evaluation-editor-content',
        style: 'outline: none; height: 95px; overflow-y: auto; padding: 6px 10px; font-size: 13px; line-height: 20px; color: #1e293b;',
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

  // Đồng bộ nội dung khi `value` từ bên ngoài thay đổi (ví dụ khi reset form hoặc chọn học viên khác)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      const normalized = normalizeEvaluationToHtml(value);
      if (normalized !== currentHtml && (normalized !== '' || !editor.isEmpty)) {
        editor.commands.setContent(normalized, false);
      }
    }
  }, [value, editor]);

  // Đồng bộ trạng thái editable khi `disabled` thay đổi
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
  const currentLength = textContent.length;

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
          {/* Bold */}
          <Tooltip title={isEnglish ? 'Bold (Ctrl+B)' : 'In đậm (Ctrl+B)'}>
            <Button
              size="small"
              type={editor?.isActive('bold') ? 'primary' : 'text'}
              disabled={disabled}
              icon={<BoldOutlined />}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              style={{ width: 26, height: 26, padding: 0 }}
              data-testid="btn-eval-bold"
            />
          </Tooltip>

          {/* Italic */}
          <Tooltip title={isEnglish ? 'Italic (Ctrl+I)' : 'In nghiêng (Ctrl+I)'}>
            <Button
              size="small"
              type={editor?.isActive('italic') ? 'primary' : 'text'}
              disabled={disabled}
              icon={<ItalicOutlined />}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              style={{ width: 26, height: 26, padding: 0 }}
              data-testid="btn-eval-italic"
            />
          </Tooltip>

          {/* Underline */}
          <Tooltip title={isEnglish ? 'Underline (Ctrl+U)' : 'Gạch chân (Ctrl+U)'}>
            <Button
              size="small"
              type={editor?.isActive('underline') ? 'primary' : 'text'}
              disabled={disabled}
              icon={<UnderlineOutlined />}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              style={{ width: 26, height: 26, padding: 0 }}
              data-testid="btn-eval-underline"
            />
          </Tooltip>

          {/* Bullet List */}
          <Tooltip title={isEnglish ? 'Bullet list' : 'Gạch đầu dòng (Bullet list)'}>
            <Button
              size="small"
              type={editor?.isActive('bulletList') ? 'primary' : 'text'}
              disabled={disabled}
              icon={<UnorderedListOutlined />}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              style={{ width: 26, height: 26, padding: 0 }}
              data-testid="btn-eval-bullet"
            />
          </Tooltip>

          {/* Numbered List */}
          <Tooltip title={isEnglish ? 'Numbered list' : 'Đánh số (Numbered list)'}>
            <Button
              size="small"
              type={editor?.isActive('orderedList') ? 'primary' : 'text'}
              disabled={disabled}
              icon={<OrderedListOutlined />}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              style={{ width: 26, height: 26, padding: 0 }}
              data-testid="btn-eval-ordered"
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
            data-testid="btn-eval-snippet-praise"
          >
            🌟 {isEnglish ? 'Praise' : 'Khen ngợi'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Focus: Practice word endings and blending.' : '• Cần rèn: Chú ý phát âm âm đuôi và nối từ.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
            data-testid="btn-eval-snippet-phonics"
          >
            🔤 {isEnglish ? 'Phonics' : 'Phonics'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Interaction: Actively engaged in class activities.' : '• Tương tác: Tích cực tham gia hoạt động.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
            data-testid="btn-eval-snippet-active"
          >
            🗣️ {isEnglish ? 'Active' : 'Tương tác'}
          </Button>

          <Button
            size="small"
            type="dashed"
            disabled={disabled}
            onClick={() => handleInsertSnippet(isEnglish ? '• Homework: Complete Practice Book exercises.' : '• BTVN: Hoàn thành bài tập Practice Book.')}
            style={{ fontSize: 11, height: 24, padding: '0 6px', borderRadius: 4 }}
            data-testid="btn-eval-snippet-hw"
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
            data-testid="btn-eval-clear"
          />
        </Tooltip>
      </div>

      {/* 2. Vùng Nhập Liệu Soạn Thảo WYSIWYG TipTap */}
      <div
        style={{
          flex: 1,
          cursor: disabled ? 'not-allowed' : 'text',
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
        onClick={() => !disabled && editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* 3. Chân Trang: Bộ Đếm Ký Tự & Gợi Ý */}
      <div
        style={{
          padding: '2px 8px',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          color: '#94a3b8',
        }}
      >
        <span>
          {isEnglish ? 'Pedagogical evaluation editor' : 'Trình soạn thảo nhận xét sư phạm'}
        </span>
        <span style={{ color: currentLength > maxLength ? '#ef4444' : '#94a3b8' }}>
          {currentLength}/{maxLength}
        </span>
      </div>

      <style>{`
        .tiptap-eval-content p {
          margin: 0 0 4px 0;
          line-height: 20px;
        }
        .tiptap-eval-content ul,
        .tiptap-eval-content ol {
          padding-left: 18px;
          margin: 0 0 4px 0;
        }
        .tiptap-eval-content strong {
          font-weight: 700;
          color: #0f172a;
        }
        .tiptap-eval-content em {
          font-style: italic;
        }
        .tiptap-eval-content u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
});
