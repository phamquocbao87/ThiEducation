import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Table,
  Tag,
  Avatar,
  Space,
  Typography,
  Button,
  Input,
  Badge,
  Empty,
  Tooltip,
  Segmented,
  Card,
} from 'antd';
import {
  UserDeleteOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MessageOutlined,
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { StudentProfileDrawer } from '../../attendance/components/StudentProfileDrawer';

const { Text, Title } = Typography;

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return phone;
};

export const AbsentStudentsAuditDrawer = ({
  open,
  onClose,
  absentRecords = [],
  todayAbsentCount = 0,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile(768);
  const [searchText, setSearchText] = useState('');
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'all' | 'excused' | 'unexcused'
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // Thống kê số lượng theo danh mục
  const counts = useMemo(() => {
    const today = absentRecords.filter((r) => r.isToday).length;
    const excused = absentRecords.filter((r) => r.hasOfficialRequest || r.isExcused).length;
    const unexcused = absentRecords.filter((r) => !r.hasOfficialRequest && !r.isExcused).length;
    return {
      today,
      all: absentRecords.length,
      excused,
      unexcused,
    };
  }, [absentRecords]);

  // Lọc theo Tab và Search Text
  const filteredRecords = useMemo(() => {
    let list = absentRecords;

    if (filterTab === 'today') {
      list = list.filter((r) => r.isToday);
    } else if (filterTab === 'excused') {
      list = list.filter((r) => r.hasOfficialRequest || r.isExcused);
    } else if (filterTab === 'unexcused') {
      list = list.filter((r) => !r.hasOfficialRequest && !r.isExcused);
    }

    if (!searchText) return list;
    const lower = searchText.toLowerCase().trim();
    return list.filter(
      (r) =>
        (r.studentName || '').toLowerCase().includes(lower) ||
        (r.englishName || '').toLowerCase().includes(lower) ||
        (r.studentCode || '').toLowerCase().includes(lower) ||
        (r.className || '').toLowerCase().includes(lower) ||
        (r.date || '').toLowerCase().includes(lower) ||
        (r.parentPhone || '').includes(lower)
    );
  }, [absentRecords, filterTab, searchText]);

  const columns = [
    {
      title: isEnglish ? 'Date' : 'Ngày Vắng',
      key: 'date',
      width: 120,
      render: (_, r) => (
        <div>
          <Tag color={r.isToday ? 'error' : 'default'} style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {r.isToday ? (isEnglish ? '🔴 Today' : '🔴 Hôm nay') : r.date}
          </Tag>
          {r.isToday && (
            <div style={{ fontSize: 11, color: '#cf1322', marginTop: 2, fontWeight: 600 }}>
              {r.date}
            </div>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      width: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar style={{ backgroundColor: r.hasOfficialRequest ? '#fa8c16' : '#ff4d4f', fontWeight: 700 }}>
            {(r.englishName || 'S').charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap' }}>
                {r.englishName}
              </Text>
              <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}>
                {r.studentCode}
              </Tag>
            </div>
            {r.studentName && r.studentName !== r.englishName && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {r.studentName}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Class & Teacher' : 'Lớp & Giáo Viên',
      key: 'class',
      width: 160,
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 12, color: '#0958d9', display: 'block', lineHeight: 1.2 }}>
            {r.className}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {isEnglish ? 'Teacher: ' : 'GV: '}{r.teacherName}
          </Text>
        </div>
      ),
    },
    {
      title: isEnglish ? 'Parent Contact' : 'Liên Hệ Phụ Huynh',
      key: 'contact',
      width: 170,
      render: (_, r) => {
        const cleanPhone = String(r.parentPhone || '').replace(/\D/g, '');
        const displayPhone = formatPhoneNumber(r.parentPhone);
        return cleanPhone ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
              📞 {displayPhone}
            </div>
            <Space size={4}>
              <Button
                size="small"
                icon={<PhoneOutlined />}
                href={`tel:${cleanPhone}`}
                style={{ fontSize: 10, padding: '0 6px', height: 22, borderRadius: 4 }}
              >
                {isEnglish ? 'Call' : 'Gọi'}
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<MessageOutlined />}
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                style={{ backgroundColor: '#0068ff', borderColor: '#0068ff', fontSize: 10, padding: '0 6px', height: 22, borderRadius: 4 }}
              >
                Zalo
              </Button>
            </Space>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>--</Text>
        );
      },
    },
    {
      title: isEnglish ? 'Reason / Status' : 'Lý Do / Trạng Thái',
      key: 'note',
      width: 150,
      render: (_, r) => (
        <div>
          {r.hasOfficialRequest ? (
            <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ fontSize: 10, margin: 0, padding: '0 4px', whiteSpace: 'nowrap' }}>
              {isEnglish ? 'Excused Absence' : 'Có đơn xin phép'}
            </Tag>
          ) : (
            <Tag color="error" style={{ fontSize: 10, margin: 0, padding: '0 4px', whiteSpace: 'nowrap' }}>
              {isEnglish ? 'Unexcused' : 'Vắng không phép'}
            </Tag>
          )}
          {r.note && (
            <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 3, lineHeight: 1.2 }}>
              "{r.note}"
            </div>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Action' : 'Hành Động',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          style={{ fontSize: 11, borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
          onClick={() => setSelectedStudentForProfile({ id: r.studentId, name: r.studentName, englishName: r.englishName })}
          data-testid={`btn-view-absent-student-${r.studentId}`}
        >
          {isEnglish ? 'Profile' : 'Hồ Sơ'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
            <Space size={8}>
              <UserDeleteOutlined style={{ color: '#cf1322', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                {isEnglish
                  ? 'Absent Students & Attendance Audit'
                  : 'Kiểm Toán Học Viên Vắng Học'}
              </span>
            </Space>
            <Tag color="error" style={{ borderRadius: 12, fontWeight: 700, padding: '2px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>
              {isEnglish ? `Today: ${todayAbsentCount} absent` : `Hôm nay: ${todayAbsentCount} em vắng`}
            </Tag>
          </div>
        }
        placement="right"
        width={isMobile ? '100%' : 840}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
        data-testid="absent-students-audit-drawer"
      >
        {/* Bộ lọc Tabs chuyên nghiệp */}
        <div style={{ marginBottom: 12 }}>
          <Segmented
            block
            value={filterTab}
            onChange={setFilterTab}
            options={[
              {
                label: isEnglish ? `🔴 Today (${counts.today})` : `🔴 Hôm nay (${counts.today})`,
                value: 'today',
              },
              {
                label: isEnglish ? `📅 All (${counts.all})` : `📅 Tất cả (${counts.all})`,
                value: 'all',
              },
              {
                label: isEnglish ? `📝 Excused (${counts.excused})` : `📝 Có phép (${counts.excused})`,
                value: 'excused',
              },
              {
                label: isEnglish ? `⚠️ Unexcused (${counts.unexcused})` : `⚠️ Không phép (${counts.unexcused})`,
                value: 'unexcused',
              },
            ]}
            style={{ borderRadius: 8 }}
            data-testid="segmented-filter-absent-students"
          />
        </div>

        {/* Ô Tìm Kiếm */}
        <div style={{ marginBottom: 14 }}>
          <Input
            placeholder={isEnglish ? 'Search student name, code, class, date or phone...' : 'Tìm kiếm theo tên học viên, mã HV, lớp học, ngày hoặc SĐT...'}
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: 8, height: 38 }}
            data-testid="input-search-absent-students"
          />
        </div>

        {filteredRecords.length === 0 ? (
          <Empty
            description={
              isEnglish
                ? 'No absent student records found in this category. Perfect attendance!'
                : 'Không có dữ liệu học viên vắng học nào trong mục này. Chuyên cần 100%!'
            }
            style={{ padding: '40px 0' }}
          />
        ) : isMobile ? (
          /* ========================================================= */
          /* 📱 GIAO DIỆN DI ĐỘNG: DANH SÁCH THẺ (MOBILE CARD VIEW)     */
          /* 100% Zero Overflow-X, Nút bấm lớn chuẩn Touch Ergonomics   */
          /* ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredRecords.map((r) => {
              const cleanPhone = String(r.parentPhone || '').replace(/\D/g, '');
              const displayPhone = formatPhoneNumber(r.parentPhone);
              return (
                <Card
                  key={r.id}
                  size="small"
                  style={{
                    borderRadius: 10,
                    borderColor: r.isToday ? '#ffccc7' : '#e2e8f0',
                    backgroundColor: r.isToday ? '#fff2f0' : '#ffffff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                  styles={{ body: { padding: '12px' } }}
                  data-testid={`card-absent-student-${r.studentId}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar
                        size={36}
                        style={{
                          backgroundColor: r.hasOfficialRequest ? '#fa8c16' : '#ff4d4f',
                          fontWeight: 700,
                        }}
                      >
                        {(r.englishName || 'S').charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                            {r.englishName}
                          </Text>
                          <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 4px', borderRadius: 4 }}>
                            {r.studentCode}
                          </Tag>
                        </div>
                        {r.studentName && r.studentName !== r.englishName && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {r.studentName}
                          </Text>
                        )}
                      </div>
                    </div>

                    <Tag
                      color={r.isToday ? 'error' : 'default'}
                      style={{ fontWeight: 700, margin: 0, borderRadius: 6, fontSize: 11 }}
                    >
                      {r.isToday ? (isEnglish ? '🔴 Today' : '🔴 Hôm nay') : r.date}
                    </Tag>
                  </div>

                  {/* Thông tin lớp & Trạng thái */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>{r.className}</span>
                      <span style={{ color: '#64748b', marginLeft: 6 }}>• GV: {r.teacherName}</span>
                    </div>
                    {r.hasOfficialRequest ? (
                      <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ fontSize: 10, margin: 0 }}>
                        {isEnglish ? 'Excused' : 'Có phép'}
                      </Tag>
                    ) : (
                      <Tag color="error" style={{ fontSize: 10, margin: 0 }}>
                        {isEnglish ? 'Unexcused' : 'Không phép'}
                      </Tag>
                    )}
                  </div>

                  {/* Ghi chú lý do nếu có */}
                  {r.note && (
                    <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginBottom: 10, background: 'rgba(0,0,0,0.02)', padding: '4px 8px', borderRadius: 4 }}>
                      💬 "{r.note}"
                    </div>
                  )}

                  {/* Hàng nút hành động chuẩn Mobile ngón tay cái (Height 38px) */}
                  <div style={{ display: 'grid', gridTemplateColumns: cleanPhone ? '1fr 1fr 80px' : '1fr', gap: 6, marginTop: 4 }}>
                    {cleanPhone && (
                      <>
                        <Button
                          icon={<PhoneOutlined />}
                          href={`tel:${cleanPhone}`}
                          style={{
                            height: 38,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            borderColor: '#cbd5e1',
                          }}
                        >
                          {isEnglish ? 'Call' : 'Gọi Điện'}
                        </Button>
                        <Button
                          type="primary"
                          icon={<MessageOutlined />}
                          href={`https://zalo.me/${cleanPhone}`}
                          target="_blank"
                          style={{
                            height: 38,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            backgroundColor: '#0068ff',
                            borderColor: '#0068ff',
                          }}
                        >
                          Zalo
                        </Button>
                      </>
                    )}
                    <Button
                      icon={<EyeOutlined />}
                      style={{
                        height: 38,
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                      onClick={() => setSelectedStudentForProfile({ id: r.studentId, name: r.studentName, englishName: r.englishName })}
                      data-testid={`btn-view-absent-student-mobile-${r.studentId}`}
                    >
                      {isEnglish ? 'Profile' : 'Hồ Sơ'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ========================================================= */
          /* 🖥️ GIAO DIỆN MÁY TÍNH: BẢNG TABLE THOÁNG ĐÃNG 840PX        */
          /* 100% Zero Overflow-X, Không Cần Scroll X Bị Ép Ngang      */
          /* ========================================================= */
          <Table
            dataSource={filteredRecords}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
            size="small"
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        )}
      </Drawer>

      {/* Drawer xem chi tiết hồ sơ học viên */}
      <StudentProfileDrawer
        open={Boolean(selectedStudentForProfile)}
        onClose={() => setSelectedStudentForProfile(null)}
        students={selectedStudentForProfile ? [selectedStudentForProfile] : []}
        selectedClass={{ name: 'Chi tiết học viên' }}
      />
    </>
  );
};
