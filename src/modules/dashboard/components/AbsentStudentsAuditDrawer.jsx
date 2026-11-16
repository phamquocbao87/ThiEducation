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

export const AbsentStudentsAuditDrawer = ({
  open,
  onClose,
  absentRecords = [],
  todayAbsentCount = 0,
}) => {
  const { isEnglish } = useLanguage();
  const isMobile = useIsMobile(768);
  const [searchText, setSearchText] = useState('');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  const filteredRecords = useMemo(() => {
    if (!searchText) return absentRecords;
    const lower = searchText.toLowerCase().trim();
    return absentRecords.filter(
      (r) =>
        r.studentName.toLowerCase().includes(lower) ||
        r.englishName.toLowerCase().includes(lower) ||
        r.studentCode.toLowerCase().includes(lower) ||
        r.className.toLowerCase().includes(lower) ||
        r.date.toLowerCase().includes(lower)
    );
  }, [absentRecords, searchText]);

  const columns = [
    {
      title: isEnglish ? 'Date' : 'Ngày Vắng',
      key: 'date',
      width: 140,
      render: (_, r) => (
        <div>
          <Tag color={r.isToday ? 'error' : 'default'} style={{ fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {r.isToday ? (isEnglish ? '🔴 Today' : '🔴 Hôm nay') : r.date}
          </Tag>
          {r.isToday && (
            <div style={{ fontSize: 10, color: '#cf1322', marginTop: 2, fontWeight: 600 }}>
              {r.date}
            </div>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      minWidth: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar style={{ backgroundColor: '#ff4d4f', fontWeight: 700 }}>
            {r.englishName.charAt(0).toUpperCase()}
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
            {r.studentName !== r.englishName && (
              <Text type="secondary" style={{ fontSize: 11 }}>
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
      width: 170,
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
      width: 140,
      render: (_, r) => {
        const cleanPhone = String(r.parentPhone || '').replace(/[\s\-().]/g, '');
        return cleanPhone ? (
          <Space size={4}>
            <Button
              size="small"
              icon={<PhoneOutlined />}
              href={`tel:${cleanPhone}`}
              style={{ fontSize: 11, padding: '0 6px', height: 24 }}
            >
              {cleanPhone.slice(-4)}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<MessageOutlined />}
              href={`https://zalo.me/${cleanPhone}`}
              target="_blank"
              style={{ backgroundColor: '#1890ff', fontSize: 11, padding: '0 6px', height: 24 }}
            >
              Zalo
            </Button>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>--</Text>
        );
      },
    },
    {
      title: isEnglish ? 'Reason / Notes' : 'Lý Do / Ghi Chú',
      key: 'note',
      minWidth: 160,
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
            <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 3 }}>
              "{r.note}"
            </div>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Action' : 'Hành Động',
      key: 'action',
      width: 90,
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
                  : 'Kiểm Toán Học Viên Vắng Học & Không Vào Lớp'}
              </span>
            </Space>
            <Tag color="error" style={{ borderRadius: 12, fontWeight: 700, padding: '2px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>
              {isEnglish ? `Today: ${todayAbsentCount} absent` : `Hôm nay: ${todayAbsentCount} em vắng`}
            </Tag>
          </div>
        }
        placement="right"
        width={isMobile ? '100%' : 780}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}
        data-testid="absent-students-audit-drawer"
      >
        <div style={{ marginBottom: 14 }}>
          <Input
            placeholder={isEnglish ? 'Search student name, code, class, or date...' : 'Tìm kiếm theo tên học viên, mã HV, lớp học hoặc ngày...'}
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
                ? 'No absent student records found. Perfect attendance!'
                : 'Không có dữ liệu học viên vắng học nào. Chuyên cần 100%!'
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            dataSource={filteredRecords}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
            size="small"
            scroll={{ x: 700 }}
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
