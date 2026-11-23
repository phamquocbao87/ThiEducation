import React, { useMemo, useState } from 'react';
import { Select, Input, Button, Tag, Space, Typography, Empty, Tooltip } from 'antd';
import {
  FilePdfOutlined,
  CustomerServiceOutlined,
  BookOutlined,
  DesktopOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { MaterialPreviewModal } from '../../materials/components/MaterialPreviewModal';

const { Text } = Typography;

const normalizeText = (str = '') =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const getMaterialTypeMeta = (type = 'PDF') => {
  switch (String(type || '').toUpperCase()) {
    case 'AUDIO':
      return { icon: <CustomerServiceOutlined />, color: 'orange', label: 'AUDIO' };
    case 'PRACTICE':
      return { icon: <BookOutlined />, color: 'cyan', label: 'PRACTICE' };
    case 'SLIDES':
      return { icon: <DesktopOutlined />, color: 'green', label: 'SLIDES' };
    case 'VIDEO':
      return { icon: <VideoCameraOutlined />, color: 'purple', label: 'VIDEO' };
    default:
      return { icon: <FilePdfOutlined />, color: 'blue', label: 'PDF' };
  }
};

const createEmptyRow = () => ({
  _rowUid: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  id: '',
  title: '',
  type: 'PDF',
  url: '',
  matchScope: 'CLASS',
  pageLocation: '',
});

/**
 * LessonMaterialAutocomplete — Quản lý danh sách tài liệu đính kèm theo mô hình:
 * - 1 tài liệu = 1 dòng gồm 2 control riêng biệt:
 *   1) Ô Autocomplete gõ tìm & chọn tài liệu đã được chia sẻ cho lớp
 *   2) Ô ghi chú nhắc học viên xem trang mấy / vị trí nào (VD: Trang 10–25, Phần Phonics, Phút 03:15...)
 * - Có nút `+ Thêm tài liệu` để thêm nhiều dòng tài liệu và nút xóa từng dòng.
 */
export const LessonMaterialAutocomplete = ({
  value = [],
  onChange,
  materials = [],
  loading = false,
  classId = '',
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile();
  const [previewMaterial, setPreviewMaterial] = useState(null);

  // Luôn đảm bảo có ít nhất 1 dòng hiển thị sẵn để GV gõ chọn ngay lập tức
  const rows = useMemo(() => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item, idx) => ({
        ...createEmptyRow(),
        ...item,
        _rowUid: item?._rowUid || `${item?.id || 'empty'}_${idx}`,
      }));
    }
    return [createEmptyRow()];
  }, [value]);

  const materialMap = useMemo(() => {
    const map = new Map();
    (materials || []).forEach((m) => {
      if (m?.id) map.set(String(m.id), m);
    });
    rows.forEach((r) => {
      if (r?.id && !map.has(String(r.id))) {
        map.set(String(r.id), r);
      }
    });
    return map;
  }, [materials, rows]);

  const selectOptions = useMemo(() => {
    return (materials || []).map((m) => {
      const typeMeta = getMaterialTypeMeta(m.type);
      const scopeTag =
        m.matchScope === 'CLASS'
          ? { color: 'purple', text: isEnglish ? `Class ${classId}` : `Share lớp ${classId}` }
          : m.matchScope === 'COURSE'
          ? { color: 'geekblue', text: isEnglish ? 'Course' : 'Khóa học' }
          : { color: 'green', text: isEnglish ? 'Public' : 'Toàn trường' };

      return {
        value: String(m.id),
        searchHaystack: normalizeText(`${m.title || ''} ${m.type || ''} ${m.description || ''} ${scopeTag.text}`),
        titleText: `[${typeMeta.label}] ${m.title || 'Learning Material'}`,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              width: '100%',
            }}
          >
            <Space size={6} style={{ minWidth: 0, overflow: 'hidden' }}>
              <Tag color={typeMeta.color} icon={typeMeta.icon} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                {typeMeta.label}
              </Tag>
              <Text
                strong
                style={{
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.title}
              </Text>
            </Space>
            <Tag color={scopeTag.color} style={{ margin: 0, fontSize: 10, flexShrink: 0 }}>
              {scopeTag.text}
            </Tag>
          </div>
        ),
      };
    });
  }, [materials, classId, isEnglish]);

  const emitRows = (nextRows) => {
    onChange?.(nextRows);
  };

  const handleSelectMaterial = (rowIdx, selectedId) => {
    const next = rows.map((r, i) => {
      if (i !== rowIdx) return r;
      if (!selectedId) {
        return { ...r, id: '', title: '', type: 'PDF', url: '', matchScope: 'CLASS' };
      }
      const found = materialMap.get(String(selectedId));
      if (!found) return r;
      return {
        ...r,
        id: String(found.id),
        title: found.title || 'Learning Material',
        type: found.type || 'PDF',
        url: found.url || '',
        matchScope: found.matchScope || 'CLASS',
      };
    });
    emitRows(next);
  };

  const handleChangeLocation = (rowIdx, pageLocation) => {
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, pageLocation } : r));
    emitRows(next);
  };

  const handleAddRow = () => {
    emitRows([...rows, createEmptyRow()]);
  };

  const handleRemoveRow = (rowIdx) => {
    if (rows.length <= 1) {
      emitRows([createEmptyRow()]);
      return;
    }
    const next = rows.filter((_, i) => i !== rowIdx);
    emitRows(next);
  };

  return (
    <div
      data-testid="lesson-material-autocomplete-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: isMobile ? 10 : 12,
        borderRadius: 10,
        backgroundColor: '#faf5ff',
        border: '1px solid #e9d5ff',
      }}
    >
      {rows.map((row, idx) => {
        const hasMaterial = Boolean(row.id);
        const typeMeta = getMaterialTypeMeta(row.type);

        return (
          <div
            key={row._rowUid || idx}
            data-testid={`lesson-material-row-${idx}`}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: `1px solid ${hasMaterial ? '#c084fc' : '#e2e8f0'}`,
              padding: isMobile ? '10px' : '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Dòng tiêu đề nhỏ của từng tài liệu + nút mở xem & xóa dòng */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Space size={6} wrap>
                <Tag color={hasMaterial ? 'purple' : 'default'} style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {isEnglish ? `Material #${idx + 1}` : `Tài liệu #${idx + 1}`}
                </Tag>
                {hasMaterial && (
                  <Tag color={typeMeta.color} icon={typeMeta.icon} style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                    {typeMeta.label}
                  </Tag>
                )}
                {hasMaterial && row.url && (
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewMaterial(row)}
                    data-testid={`btn-editor-preview-material-row-${idx}`}
                    style={{ fontSize: 11, color: '#7e22ce', fontWeight: 600, padding: '0 4px', height: 22 }}
                  >
                    {isEnglish ? 'Preview' : 'Xem trước'}
                  </Button>
                )}
              </Space>

              <Tooltip title={isEnglish ? 'Remove this material row' : 'Xóa dòng tài liệu này'}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveRow(idx)}
                  data-testid={`btn-remove-material-row-${idx}`}
                  style={{ minWidth: 30, minHeight: 30 }}
                />
              </Tooltip>
            </div>

            {/* 2 Control Song Song: [1. Autocomplete chọn tài liệu] + [2. Nhắc trang / vị trí xem] */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.15fr) minmax(0, 1fr)',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Select
                showSearch
                allowClear
                loading={loading}
                value={row.id || undefined}
                onChange={(val) => handleSelectMaterial(idx, val)}
                optionLabelProp="titleText"
                filterOption={(input, option) =>
                  (option?.searchHaystack || '').includes(normalizeText(input))
                }
                options={selectOptions}
                placeholder={
                  isEnglish
                    ? 'Type to select a shared class material...'
                    : 'Gõ chọn 1 tài liệu đã share cho lớp...'
                }
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      isEnglish
                        ? 'No shared materials found for this class'
                        : 'Không tìm thấy tài liệu đã chia sẻ cho lớp này'
                    }
                  />
                }
                style={{ width: '100%', height: 38 }}
                data-testid={`select-lesson-material-row-${idx}`}
              />

              <Input
                allowClear
                prefix={<EnvironmentOutlined style={{ color: '#d97706' }} />}
                value={row.pageLocation || ''}
                onChange={(e) => handleChangeLocation(idx, e.target.value)}
                placeholder={
                  isEnglish
                    ? 'Page / location (e.g. pp. 10–25, Track 3, Ex. 2)'
                    : 'Trang / vị trí cần xem (VD: Trang 10–25, Phần 2...)'
                }
                style={{ width: '100%', height: 38, borderRadius: 8 }}
                data-testid={`input-lesson-material-note-row-${idx}`}
              />
            </div>
          </div>
        );
      })}

      {/* Nút Thêm dòng tài liệu tiếp theo */}
      <div>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddRow}
          data-testid="btn-add-lesson-material-row"
          style={{
            borderColor: '#a855f7',
            color: '#7e22ce',
            fontWeight: 600,
            borderRadius: 8,
            minHeight: 36,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {isEnglish ? 'Add Another Material & Page Guide' : 'Thêm Tài Liệu & Ghi Chú Trang Cần Xem'}
        </Button>
      </div>
      <MaterialPreviewModal
        open={Boolean(previewMaterial)}
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        zIndex={1300}
      />
    </div>
  );
};

export default LessonMaterialAutocomplete;
