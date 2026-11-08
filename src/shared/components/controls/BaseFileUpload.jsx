import React, { useState } from 'react';
import { Upload, message, Typography, Space } from 'antd';
import { InboxOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

/**
 * BaseFileUpload — Drag-and-drop file upload control integrated with DriveStorageService
 */
export const BaseFileUpload = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.jpg,.png,.webp',
  maxSizeMB = 25,
  title,
  hint,
  disabled = false,
  style,
}) => {
  const { isEnglish } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);

  const beforeUpload = (file) => {
    const isLtSize = file.size / 1024 / 1024 < maxSizeMB;
    if (!isLtSize) {
      message.error(
        isEnglish
          ? `File size cannot exceed ${maxSizeMB}MB!`
          : `Dung lượng tệp không được vượt quá ${maxSizeMB}MB!`
      );
      return Upload.LIST_IGNORE;
    }

    setSelectedFile(file);
    if (typeof onFileSelect === 'function') {
      onFileSelect(file);
    }
    return false; // Prevent auto POST upload
  };

  const defaultTitle =
    title ||
    (isEnglish
      ? 'Click or drag file to this area to upload'
      : 'Nhấp hoặc kéo thả tệp vào khu vực này để tải lên');

  const defaultHint =
    hint ||
    (isEnglish
      ? `Supports PDF, Office documents, and images (Max: ${maxSizeMB}MB)`
      : `Hỗ trợ tệp PDF, tài liệu văn phòng và hình ảnh (Tối đa: ${maxSizeMB}MB)`);

  return (
    <div style={{ width: '100%', ...style }}>
      <Dragger
        name="file"
        multiple={false}
        accept={accept}
        beforeUpload={beforeUpload}
        onRemove={() => {
          setSelectedFile(null);
          if (typeof onFileSelect === 'function') {
            onFileSelect(null);
          }
        }}
        disabled={disabled}
        style={{
          padding: '16px',
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: 10,
        }}
      >
        <p className="ant-upload-drag-icon" style={{ margin: 0, color: '#1890ff' }}>
          <InboxOutlined style={{ fontSize: 36 }} />
        </p>
        <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block', marginTop: 8 }}>
          {defaultTitle}
        </Text>
        <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0 0' }}>
          {defaultHint}
        </Paragraph>

        {selectedFile && (
          <div style={{ marginTop: 10 }}>
            <Space>
              <PaperClipOutlined style={{ color: '#52c41a' }} />
              <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            </Space>
          </div>
        )}
      </Dragger>
    </div>
  );
};

