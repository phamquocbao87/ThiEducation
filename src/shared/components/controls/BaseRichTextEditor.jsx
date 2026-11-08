import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  UndoOutlined,
  RedoOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

/**
 * Utility function to strip HTML tags safely for table/card summary previews
 */
export const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * BaseRichTextEditor — Enterprise standard Rich Text Editor for React 19 (TipTap v3)
 * Provides pedagogical formatting tools (Bold, Italic, Underline, Headings, Lists, Blockquote)
 */
export const BaseRichTextEditor = ({
  value,
  onChange,
  placeholder,
  minHeight = 220,
}) => {
  const { isEnglish } = useLanguage();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const cleanHtml = ed.isEmpty ? '' : html;
      if (typeof onChange === 'function') {
        onChange(cleanHtml);
      }
    },
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      if (value !== currentHtml && (value !== '' || !editor.isEmpty)) {
        editor.commands.setContent(value || '', false);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const defaultPlaceholder =
    placeholder ||
    (isEnglish
      ? 'Enter comprehensive learning objectives, pedagogical syllabus, and key student outcomes...'
      : 'Nhập chi tiết mục tiêu đào tạo, đề cương bài giảng và chuẩn đầu ra mong đợi...');

  return (
    <div
      className="lak-base-rich-editor-wrapper"
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        transition: 'all 0.2s',
      }}
    >
      {/* 1. Thanh Công Cụ Toolbar */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Space size={2} wrap>
          {/* Bold */}
          <Tooltip title={isEnglish ? 'Bold (Ctrl+B)' : 'In đậm (Ctrl+B)'}>
            <Button
              size="small"
              type={editor.isActive('bold') ? 'primary' : 'text'}
              icon={<BoldOutlined />}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
          </Tooltip>

          {/* Italic */}
          <Tooltip title={isEnglish ? 'Italic (Ctrl+I)' : 'In nghiêng (Ctrl+I)'}>
            <Button
              size="small"
              type={editor.isActive('italic') ? 'primary' : 'text'}
              icon={<ItalicOutlined />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
          </Tooltip>

          {/* Underline */}
          <Tooltip title={isEnglish ? 'Underline (Ctrl+U)' : 'Gạch chân (Ctrl+U)'}>
            <Button
              size="small"
              type={editor.isActive('underline') ? 'primary' : 'text'}
              icon={<UnderlineOutlined />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
          </Tooltip>

          {/* Strike */}
          <Tooltip title={isEnglish ? 'Strikethrough' : 'Gạch ngang chữ'}>
            <Button
              size="small"
              type={editor.isActive('strike') ? 'primary' : 'text'}
              icon={<StrikethroughOutlined />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

        <Space size={2} wrap>
          {/* Heading 2 */}
          <Tooltip title={isEnglish ? 'Section Heading' : 'Tiêu đề mục lớn'}>
            <Button
              size="small"
              type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'text'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              style={{ fontWeight: 700, fontSize: 11 }}
            >
              H2
            </Button>
          </Tooltip>

          {/* Heading 3 */}
          <Tooltip title={isEnglish ? 'Sub-heading' : 'Tiêu đề mục nhỏ'}>
            <Button
              size="small"
              type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'text'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              style={{ fontWeight: 700, fontSize: 11 }}
            >
              H3
            </Button>
          </Tooltip>
        </Space>

        <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

        <Space size={2} wrap>
          {/* Bullet List */}
          <Tooltip title={isEnglish ? 'Bullet List' : 'Danh sách gạch đầu dòng'}>
            <Button
              size="small"
              type={editor.isActive('bulletList') ? 'primary' : 'text'}
              icon={<UnorderedListOutlined />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
          </Tooltip>

          {/* Ordered List */}
          <Tooltip title={isEnglish ? 'Numbered List' : 'Danh sách số thứ tự'}>
            <Button
              size="small"
              type={editor.isActive('orderedList') ? 'primary' : 'text'}
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Tooltip>

          {/* Blockquote */}
          <Tooltip title={isEnglish ? 'Quote' : 'Trích dẫn'}>
            <Button
              size="small"
              type={editor.isActive('blockquote') ? 'primary' : 'text'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              style={{ fontWeight: 700, fontSize: 13, lineHeight: '13px' }}
            >
              “”
            </Button>
          </Tooltip>
        </Space>

        <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

        <Space size={2} wrap>
          {/* Undo */}
          <Tooltip title={isEnglish ? 'Undo' : 'Hoàn tác'}>
            <Button
              size="small"
              type="text"
              icon={<UndoOutlined />}
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            />
          </Tooltip>

          {/* Redo */}
          <Tooltip title={isEnglish ? 'Redo' : 'Làm lại'}>
            <Button
              size="small"
              type="text"
              icon={<RedoOutlined />}
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            />
          </Tooltip>

          {/* Clear formatting */}
          <Tooltip title={isEnglish ? 'Clear Formatting' : 'Xóa định dạng'}>
            <Button
              size="small"
              type="text"
              icon={<ClearOutlined />}
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 2. Khung Soạn Thảo */}
      <div
        style={{
          padding: '14px 18px',
          minHeight,
          cursor: 'text',
        }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .lak-base-rich-editor-wrapper:focus-within {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        .lak-base-rich-editor-wrapper .tiptap {
          outline: none;
          min-height: ${minHeight - 28}px;
          font-size: 14px;
          line-height: 1.6;
          color: #334155;
        }
        .lak-base-rich-editor-wrapper .tiptap p {
          margin: 0 0 8px 0;
        }
        .lak-base-rich-editor-wrapper .tiptap h2 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 16px 0 8px 0;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 4px;
        }
        .lak-base-rich-editor-wrapper .tiptap h3 {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin: 12px 0 6px 0;
        }
        .lak-base-rich-editor-wrapper .tiptap ul,
        .lak-base-rich-editor-wrapper .tiptap ol {
          padding-left: 20px;
          margin: 0 0 8px 0;
        }
        .lak-base-rich-editor-wrapper .tiptap blockquote {
          border-left: 3px solid #3b82f6;
          padding-left: 12px;
          margin: 10px 0;
          color: #475569;
          font-style: italic;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 0 6px 6px 0;
        }
      `}</style>
    </div>
  );
};

