import React from 'react';
import { Table, Tag, Button, Progress, Space, Typography, Empty, Popover } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  PhoneOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import {
  PREP_STATUS,
  formatHumanDuration,
  getPrepStatusMeta,
} from '../../lesson-reader';

const { Text } = Typography;

const renderMaterialsPopoverBadge = (r, isEnglish) => {
  if (!r || !r.materialsTotalCount) return null;
  const done = Number(r.materialsCompletedCount) || 0;
  const total = Number(r.materialsTotalCount) || 0;
  const matSec = Number(r.materialActiveSeconds) || 0;
  const items = Array.isArray(r.materialItems) ? r.materialItems : [];

  const popoverContent = (
    <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6 }} data-testid={`prep-materials-popover-${r.studentId}`}>
      {items.map((m) => (
        <div
          key={m.materialId}
          style={{
            padding: '6px 8px',
            borderRadius: 6,
            backgroundColor: m.completed ? '#f0fdf4' : m.activeSeconds > 0 ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${m.completed ? '#bbf7d0' : m.activeSeconds > 0 ? '#fde68a' : '#e2e8f0'}`,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a' }}>
            {m.completed ? '✅' : m.activeSeconds > 0 ? '🟡' : '⚪'} [{m.type}] {m.title}
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
            ⏱ {formatHumanDuration(m.activeSeconds, isEnglish)}
            {m.isDirectMedia
              ? ` • ${m.mediaProgressPercent}% / 60%`
              : ` / ${formatHumanDuration(m.requiredSeconds || 60, isEnglish)}`}
            {m.pageLocation ? ` • 📍 ${m.pageLocation}` : ''}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Popover
      trigger={['hover', 'click']}
      title={
        <Text strong style={{ fontSize: 12 }}>
          📎 {isEnglish ? `Attached Materials (${done}/${total})` : `Chi Tiết Xem Tài Liệu (${done}/${total})`}
        </Text>
      }
      content={popoverContent}
    >
      <Tag
        color={done >= total ? 'success' : matSec > 0 ? 'warning' : 'default'}
        icon={<PaperClipOutlined />}
        data-testid={`prep-student-materials-badge-${r.studentId}`}
        style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {isEnglish ? 'Materials' : 'Tài liệu'}: {done}/{total}
        {matSec > 0 ? ` (${formatHumanDuration(matSec, isEnglish)})` : ''}
      </Tag>
    </Popover>
  );
};

/**
 * PrepStudentTrackingList — Tab Danh Sách Học Viên Theo Dõi Chuẩn Bị Bài
 * - Desktop: Table đầy đủ ngữ cảnh Lớp, Buổi, Bài học, Thời gian/Cuộn %, Rèn luyện, SĐT PH (ẩn với GV), Nhắc đọc bài.
 * - Mobile (<= 768px): Mobile Cards 100% width, touch target >= 40px, Zero Overflow-X.
 */
export const PrepStudentTrackingList = ({
  students = [],
  canViewParentContacts = false,
  canRemind = false,
  remindedMap = {},
  sendingKey = null,
  onSendReminder,
  isEnglish = false,
  isMobile = false,
}) => {
  if (!students || students.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          isEnglish
            ? 'No students match the current filter.'
            : 'Không có học viên nào khớp với bộ lọc hiện tại.'
        }
      />
    );
  }

  // Mobile-First Card List (Zero Overflow-X trên 360px / 390px)
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="prep-student-mobile-list">
        {students.map((st) => {
          const meta = getPrepStatusMeta(st.prepStatus, isEnglish);
          const rowKey = `${st.classId}_${st.studentId}`;
          const isReminded = Boolean(remindedMap[rowKey]);

          return (
            <div
              key={rowKey}
              data-testid={`prep-student-row-${st.studentId}`}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: '#ffffff',
                border: `1px solid ${st.prepStatus === PREP_STATUS.NOT_STARTED ? '#fecaca' : '#e9d5ff'}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                    {st.studentName}
                  </Text>
                  {st.englishName && (
                    <Tag color="gold" style={{ marginLeft: 6, fontSize: 10 }}>
                      {st.englishName}
                    </Tag>
                  )}
                  <div style={{ fontSize: 11, color: '#64748b' }}>{st.studentCode}</div>
                </div>
                <Tag
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: meta.bg,
                    borderColor: meta.border,
                    color: meta.textColor,
                  }}
                >
                  {meta.icon} {meta.label}
                </Tag>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <Tag color="purple" style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                  {st.classId} • {isEnglish ? `S${st.sessionIndex}` : `Buổi ${st.sessionIndex}`}
                </Tag>
                <Text style={{ fontSize: 12, color: '#475569' }}>{st.className}</Text>
              </div>

              {st.lessonTitle && (
                <div style={{ fontSize: 12, color: '#6b21a8', fontWeight: 600 }}>
                  <BookOutlined style={{ marginRight: 4 }} />
                  {st.lessonTitle}
                </div>
              )}

              <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: 8, fontSize: 12, color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span>
                    ⏱ <Text strong>{formatHumanDuration(st.preClassActiveSeconds, isEnglish)}</Text> /{' '}
                    {formatHumanDuration(st.minRequiredSeconds, isEnglish)}
                  </span>
                  <span>
                    📜 {isEnglish ? 'Scroll:' : 'Đã cuộn:'} <Text strong>{st.maxScrollPercent}%</Text>
                  </span>
                </div>
                <Progress
                  percent={st.maxScrollPercent}
                  size="small"
                  strokeColor={st.maxScrollPercent >= 80 ? '#16a34a' : '#7e22ce'}
                  showInfo={false}
                  style={{ margin: '4px 0' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <span>
                    🏅 {isEnglish ? 'Conduct:' : 'Rèn luyện:'}{' '}
                    <Tag color={st.conductRank?.tagColor || 'default'} style={{ margin: 0, fontWeight: 700 }}>
                      {st.conductScore}/100
                    </Tag>
                  </span>
                  <Space size={4} wrap>
                    {renderMaterialsPopoverBadge(st, isEnglish)}
                    {st.questionsCount > 0 && (
                      <Tag color="processing" icon={<QuestionCircleOutlined />} style={{ margin: 0 }}>
                        {st.questionsCount} Q&A
                      </Tag>
                    )}
                  </Space>
                </div>
              </div>

              {canViewParentContacts && (st.parentName || st.parentPhone) && (
                <div
                  style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}
                  data-testid={`prep-parent-contact-${st.studentId}`}
                >
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  {st.parentName ? `${st.parentName}: ` : ''}
                  {st.parentPhone || '—'}
                </div>
              )}

              {canRemind && st.prepStatus !== PREP_STATUS.PREPARED && (
                <Button
                  type={isReminded ? 'default' : 'primary'}
                  block
                  icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
                  disabled={isReminded}
                  loading={sendingKey === rowKey}
                  onClick={() => onSendReminder && onSendReminder(st)}
                  data-testid={`btn-prep-remind-${st.studentId}`}
                  style={{
                    backgroundColor: isReminded ? '#f0fdf4' : '#7e22ce',
                    borderColor: isReminded ? '#86efac' : '#7e22ce',
                    color: isReminded ? '#15803d' : '#ffffff',
                    fontWeight: 700,
                    borderRadius: 8,
                    minHeight: 40,
                  }}
                >
                  {isReminded
                    ? isEnglish
                      ? 'Reminder Sent'
                      : 'Đã Gửi Nhắc Nhở'
                    : isEnglish
                    ? 'Remind Student to Read'
                    : 'Gửi Nhắc Đọc Bài'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop Full Table (Tối ưu bề rộng để hiện trọn 7 cột trên 1366px không cần cuộn ngang)
  const columns = [
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      width: 165,
      render: (_, r) => (
        <div data-testid={`prep-student-row-${r.studentId}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
              {r.studentName}
            </Text>
            {r.englishName && (
              <Tag color="gold" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                {r.englishName}
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.studentCode}
          </Text>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Class & Lesson' : 'Lớp & Bài Học',
      key: 'classLesson',
      width: 195,
      render: (_, r) => (
        <div>
          <Space size={4} wrap>
            <Tag color="purple" style={{ margin: 0, fontWeight: 700, fontSize: 10 }}>
              {r.classId}
            </Tag>
            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
              {isEnglish ? `S${r.sessionIndex}` : `Buổi ${r.sessionIndex}`}
            </Tag>
          </Space>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#1e293b',
              marginTop: 2,
              maxWidth: 185,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={r.className}
          >
            {r.className}
          </div>
          {r.lessonTitle && (
            <div
              style={{
                fontSize: 11,
                color: '#6b21a8',
                maxWidth: 185,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={r.lessonTitle}
            >
              📖 {r.lessonTitle}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b' }}>👨‍🏫 {r.teacherName}</div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Status' : 'Trạng Thái',
      key: 'status',
      width: 120,
      render: (_, r) => {
        const meta = getPrepStatusMeta(r.prepStatus, isEnglish);
        const compactLabel =
          r.prepStatus === PREP_STATUS.NOT_STARTED
            ? isEnglish
              ? 'Not Read'
              : 'Chưa đọc'
            : r.prepStatus === PREP_STATUS.SKIMMED
            ? isEnglish
              ? 'In Progress'
              : 'Đang đọc dở'
            : r.prepStatus === PREP_STATUS.PREPARED
            ? isEnglish
              ? 'Prepared'
              : 'Đã đọc tốt'
            : meta.label;
        return (
          <Tag
            title={meta.label}
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.textColor,
              whiteSpace: 'nowrap',
            }}
          >
            {meta.icon} {compactLabel}
          </Tag>
        );
      },
    },
    {
      title: isEnglish ? 'Time & Scroll' : 'Thời Gian & Cuộn',
      key: 'progress',
      width: 145,
      render: (_, r) => (
        <div style={{ minWidth: 120 }}>
          <div style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            <Text strong style={{ color: '#7e22ce' }}>
              {formatHumanDuration(r.preClassActiveSeconds, isEnglish)}
            </Text>
            <Text type="secondary"> / {formatHumanDuration(r.minRequiredSeconds, isEnglish)}</Text>
          </div>
          <Progress
            percent={r.maxScrollPercent}
            size="small"
            strokeColor={r.maxScrollPercent >= 80 ? '#16a34a' : '#7e22ce'}
            format={(p) => `${p}%`}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {renderMaterialsPopoverBadge(r, isEnglish)}
            {r.questionsCount > 0 && (
              <Tag color="processing" icon={<QuestionCircleOutlined />} style={{ margin: '4px 0 0', fontSize: 10 }}>
                {r.questionsCount} Q&A
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Conduct' : 'Rèn Luyện',
      key: 'conduct',
      align: 'center',
      width: 90,
      render: (_, r) => (
        <Tag color={r.conductRank?.tagColor || 'default'} style={{ margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {r.conductRank?.icon} {r.conductScore}/100
        </Tag>
      ),
    },
  ];

  // KỶ LUẬT BẢO MẬT PII: Chỉ hiển thị cột SĐT Phụ huynh cho Academic / Director / Admin (Ẩn 100% với Teacher)
  if (canViewParentContacts) {
    columns.push({
      title: isEnglish ? 'Parent' : 'Phụ Huynh',
      key: 'parent',
      width: 135,
      render: (_, r) =>
        r.parentName || r.parentPhone ? (
          <div style={{ fontSize: 11, color: '#0369a1' }} data-testid={`prep-parent-contact-${r.studentId}`}>
            {r.parentName && (
              <div
                style={{
                  fontWeight: 600,
                  maxWidth: 125,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={r.parentName}
              >
                {r.parentName}
              </div>
            )}
            {r.parentPhone && (
              <div style={{ whiteSpace: 'nowrap' }}>
                <PhoneOutlined style={{ marginRight: 3 }} />
                {r.parentPhone}
              </div>
            )}
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    });
  }

  if (canRemind) {
    columns.push({
      title: isEnglish ? 'Action' : 'Đôn Đốc',
      key: 'action',
      align: 'right',
      fixed: 'right',
      width: 118,
      render: (_, r) => {
        if (r.prepStatus === PREP_STATUS.PREPARED) {
          return (
            <Tag color="success" style={{ margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
              ✓ {isEnglish ? 'Ready' : 'Đạt chuẩn'}
            </Tag>
          );
        }
        const rowKey = `${r.classId}_${r.studentId}`;
        const isReminded = Boolean(remindedMap[rowKey]);
        return (
          <Button
            size="small"
            type={isReminded ? 'default' : 'primary'}
            icon={isReminded ? <CheckOutlined /> : <BellOutlined />}
            disabled={isReminded}
            loading={sendingKey === rowKey}
            onClick={() => onSendReminder && onSendReminder(r)}
            data-testid={`btn-prep-remind-${r.studentId}`}
            style={{
              backgroundColor: isReminded ? '#f0fdf4' : '#7e22ce',
              borderColor: isReminded ? '#86efac' : '#7e22ce',
              color: isReminded ? '#15803d' : '#ffffff',
              fontWeight: 700,
              borderRadius: 6,
              minHeight: 30,
              whiteSpace: 'nowrap',
            }}
          >
            {isReminded
              ? isEnglish
                ? 'Sent'
                : 'Đã Nhắc'
              : isEnglish
              ? 'Remind'
              : 'Nhắc Bài'}
          </Button>
        );
      },
    });
  }

  return (
    <Table
      dataSource={students}
      columns={columns}
      rowKey={(r) => r.rowKey || `${r.classId}_${r.studentId}`}
      pagination={{ pageSize: 15, showSizeChanger: false }}
      size="small"
      scroll={{ x: 960 }}
      data-testid="prep-student-desktop-table"
    />
  );
};

export default PrepStudentTrackingList;
