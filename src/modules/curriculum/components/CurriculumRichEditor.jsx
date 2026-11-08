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

export const CurriculumRichEditor = ({ value, onChange, placeholder }) => {
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
      // Nếu rỗng thì trả về chuỗi rỗng
      const cleanHtml = ed.isEmpty ? '' : html;
      if (typeof onChange === 'function') {
        onChange(cleanHtml);
      }
    },
  });

  // Đồng bộ nội dung khi `value` từ bên ngoài thay đổi (ví dụ khi mở modal edit)
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

  const defaultPlaceholder = isEnglish
    ? 'Enter detailed curriculum objectives, target competencies, reading fluency milestones, and pedagogical approach...'
    : 'Nhập mục tiêu đào tạo chi tiết, chuẩn năng lực đầu ra, cột mốc đọc hiểu, phương pháp giảng dạy... (Dùng các nút trên thanh công cụ để định dạng)';

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#ffffff',
        transition: 'all 0.2s',
      }}
      className="curriculum-rich-editor-wrapper"
    >
      {/* 1. Thanh Công Cụ Soạn Thảo (Formatting Toolbar) */}
      <div
        style={{
          background: '#f8fafc',
          padding: '8px 10px',
          borderBottom: '1px solid #e2e8f0',
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
          <Tooltip title={isEnglish ? 'Numbered List' : 'Danh sách đánh số thứ tự'}>
            <Button
              size="small"
              type={editor.isActive('orderedList') ? 'primary' : 'text'}
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Tooltip>

          {/* Blockquote */}
          <Tooltip title={isEnglish ? 'Blockquote' : 'Khối trích dẫn / Điểm nhấn'}>
            <Button
              size="small"
              type={editor.isActive('blockquote') ? 'primary' : 'text'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              style={{ fontSize: 12, fontWeight: 700, padding: '0 6px' }}
            >
              ❝
            </Button>
          </Tooltip>
        </Space>

        <Divider type="vertical" style={{ height: 18, margin: '0 4px' }} />

        <Space size={2} wrap>
          {/* Undo */}
          <Tooltip title={isEnglish ? 'Undo (Ctrl+Z)' : 'Hoàn tác'}>
            <Button
              size="small"
              type="text"
              icon={<UndoOutlined />}
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            />
          </Tooltip>

          {/* Redo */}
          <Tooltip title={isEnglish ? 'Redo (Ctrl+Y)' : 'Làm lại'}>
            <Button
              size="small"
              type="text"
              icon={<RedoOutlined />}
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            />
          </Tooltip>

          {/* Clear Formatting */}
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

      {/* 2. Khung Soạn Thảo (Editor Content Area) */}
      <div
        style={{
          padding: '12px 16px',
          minHeight: 160,
          maxHeight: 320,
          overflowY: 'auto',
          fontSize: 14,
          lineHeight: 1.6,
          color: '#1e293b',
          cursor: 'text',
        }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .curriculum-rich-editor-wrapper:focus-within {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        .curriculum-rich-editor-wrapper .tiptap {
          outline: none;
          min-height: 140px;
        }
        .curriculum-rich-editor-wrapper .tiptap p {
          margin: 0 0 8px 0;
        }
        .curriculum-rich-editor-wrapper .tiptap h2 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 12px 0 6px 0;
        }
        .curriculum-rich-editor-wrapper .tiptap h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 10px 0 4px 0;
        }
        .curriculum-rich-editor-wrapper .tiptap ul,
        .curriculum-rich-editor-wrapper .tiptap ol {
          padding-left: 20px;
          margin: 6px 0 10px 0;
        }
        .curriculum-rich-editor-wrapper .tiptap blockquote {
          border-left: 3px solid #3b82f6;
          padding-left: 10px;
          color: #475569;
          font-style: italic;
          margin: 8px 0;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

