import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Avatar,
  Space,
  Typography,
  Switch,
  Badge,
  Empty,
  Tooltip,
  Statistic,
  message,
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  PhoneOutlined,
  MessageOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  IdcardOutlined,
  HomeOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { PermissionService } from '../../../core/services/PermissionService';
import { matchesMultiFields } from '../../../shared/utils/searchUtils';

const { Text, Title } = Typography;

export const StudentCardGrid = ({
  students = [],
  allClasses = [],
  courses = [],
  currentUser,
  canManage = false,
  onViewStudent,
  onEditStudent,
  onToggleStatus,
  onOpenCreateStudent,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const { isEnglish, language } = useLanguage();

  const [searchText, setSearchText] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusOverrides, setStatusOverrides] = useState({});

  const handleToggle = async (student, checked) => {
    const studentCode = student.code || student.id;
    const newStatus = checked ? 'Active' : 'Disabled';
    setStatusOverrides((prev) => ({ ...prev, [studentCode]: newStatus }));
    if (onToggleStatus) {
      try {
        await onToggleStatus(student, checked);
      } catch (err) {
        setStatusOverrides((prev) => ({ ...prev, [studentCode]: !checked ? 'Active' : 'Disabled' }));
      }
    }
  };

  // Bản đồ tra cứu nhanh lớp học theo classId
  const classMap = useMemo(() => {
    const map = new Map();
    (allClasses || []).forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [allClasses]);

  // Thống kê số lượng học viên
  const stats = useMemo(() => {
    const total = students.length;
    let enrolled = 0;
    let unassigned = 0;
    const families = new Set();

    students.forEach((s) => {
      const classIds = s.enrolledClassIds || [];
      // Cũng kiểm tra xem học viên có trong danh sách studentIds của lớp nào không
      const isInAnyClass =
        classIds.length > 0 ||
        allClasses.some((cls) => (cls.studentIds || []).includes(s.id) || (cls.studentIds || []).includes(s.code));

      if (isInAnyClass) {
        enrolled++;
      } else {
        unassigned++;
      }

      if (s.familyId) {
        families.add(s.familyId);
      }
    });

    return {
      total,
      enrolled,
      unassigned,
      familiesCount: families.size,
    };
  }, [students, allClasses]);

  // Lọc danh sách học viên
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Lọc theo trạng thái
      if (statusFilter !== 'ALL') {
        const studentCode = s.code || s.id;
        const currentStatus = statusOverrides[studentCode] || s.status || 'Active';
        const isActive = currentStatus.toLowerCase() === 'active';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Lớp học đang tham gia
      const studentClassIds = new Set(s.enrolledClassIds || []);
      allClasses.forEach((cls) => {
        if ((cls.studentIds || []).includes(s.id) || (cls.studentIds || []).includes(s.code)) {
          studentClassIds.add(cls.id);
        }
      });

      // Lọc theo lớp
      if (selectedClassFilter !== 'ALL') {
        if (!studentClassIds.has(selectedClassFilter)) return false;
      }

      // 3. Tìm kiếm thông minh 2 chiều tiếng Việt
      if (searchText.trim()) {
        const searchFields = [
          s.name,
          s.englishName,
          s.code,
          s.id,
          s.phone,
          s.phone2,
          s.parentName,
          s.email,
        ];
        // Thêm tên các lớp vào trường tìm kiếm
        studentClassIds.forEach((cId) => {
          const cls = classMap.get(cId);
          if (cls) {
            searchFields.push(cls.name || cls.id);
          }
        });

        if (!matchesMultiFields(searchFields, searchText.trim())) {
          return false;
        }
      }

      return true;
    });
  }, [students, statusFilter, selectedClassFilter, searchText, allClasses, classMap, statusOverrides]);

  // Màu sắc ngẫu nhiên hoặc theo ID cho Avatar
  const getAvatarColor = (idOrCode = '') => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068', '#108ee9', '#722ed1'];
    let hash = 0;
    for (let i = 0; i < idOrCode.length; i++) {
      hash = idOrCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  return (
    <div data-testid="student-management-card-grid-container">
      {/* 1. Thẻ Thống Kê Tổng Quan Học Viên */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{isEnglish ? 'Total Students' : 'Tổng Học Viên'}</span>}
              value={stats.total}
              valueStyle={{ color: '#15803d', fontWeight: 700 }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>{isEnglish ? 'Enrolled in Classes' : 'Đang Có Lớp'}</span>}
              value={stats.enrolled}
              valueStyle={{ color: '#1d4ed8', fontWeight: 700 }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#9a3412', fontWeight: 600 }}>{isEnglish ? 'Waiting List' : 'Chưa Xếp Lớp'}</span>}
              value={stats.unassigned}
              valueStyle={{ color: '#ea580c', fontWeight: 700 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#6b21a8', fontWeight: 600 }}>{isEnglish ? 'Family Clusters' : 'Cụm Gia Đình'}</span>}
              value={stats.familiesCount}
              valueStyle={{ color: '#7e22ce', fontWeight: 700 }}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Thanh Công Cụ: Tìm Kiếm, Bộ Lọc Theo Lớp & Nút Thêm Mới */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 18,
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
        styles={{ body: { padding: isMobile ? '12px 10px' : '14px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={10}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder={isEnglish ? 'Search by Vietnamese/English name, student code, phone...' : 'Tìm theo tên tiếng Việt/Anh, mã học viên, SĐT phụ huynh...'}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: '100%', height: 40, borderRadius: 8 }}
              data-testid="input-search-student-cards"
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              value={selectedClassFilter}
              onChange={setSelectedClassFilter}
              style={{ width: '100%', height: 40 }}
              data-testid="select-filter-student-class"
            >
              <Select.Option value="ALL">
                🏫 {isEnglish ? 'All Classes' : 'Tất Cả Lớp'} ({allClasses.length})
              </Select.Option>
              {allClasses.map((cls) => (
                <Select.Option key={cls.id} value={cls.id}>
                  {cls.name || cls.id} ({cls.studentIds?.length || 0} HV)
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={6} md={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%', height: 40 }}
              data-testid="select-filter-student-status"
            >
              <Select.Option value="ALL">{isEnglish ? 'All Status' : 'Tất Cả Trạng Thái'}</Select.Option>
              <Select.Option value="ACTIVE">🟢 {isEnglish ? 'Active' : 'Đang Theo Học'}</Select.Option>
              <Select.Option value="INACTIVE">⚪ {isEnglish ? 'Inactive' : 'Tạm Dừng'}</Select.Option>
            </Select>
          </Col>

          <Col xs={24} md={5} style={{ textAlign: isMobile ? 'left' : 'right' }}>
            {canManage && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  if (onOpenCreateStudent) {
                    onOpenCreateStudent();
                  } else {
                    navigate('/user-management/register');
                  }
                }}
                data-testid="btn-add-new-student-card"
                style={{
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                  fontWeight: 600,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {isEnglish ? '+ New Student' : '+ Thêm Học Viên'}
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* 3. Lưới Card Học Viên (Responsive 3 Cột trên Desktop, 1 Cột trên Mobile) */}
      {filteredStudents.length === 0 ? (
        <Empty
          description={
            isEnglish
              ? 'No matching students found. Try clearing your search filters.'
              : 'Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.'
          }
          style={{ padding: '40px 16px' }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredStudents.map((student) => {
            const studentCode = student.code || student.id;
            const currentStatus = statusOverrides[studentCode] || student.status || 'Active';
            const isActive = currentStatus.toLowerCase() === 'active';

            // Tìm các lớp học mà học sinh này tham gia
            const enrolledClasses = [];
            const checkedClassIds = new Set(student.enrolledClassIds || []);
            allClasses.forEach((cls) => {
              if (
                checkedClassIds.has(cls.id) ||
                (cls.studentIds || []).includes(student.id) ||
                (cls.studentIds || []).includes(student.code)
              ) {
                enrolledClasses.push(cls);
              }
            });

            // Số điện thoại phụ huynh sạch
            const cleanPhone = (student.phone || student.phoneNumber || '').replace(/[^0-9]/g, '');
            const canChangeStatus = PermissionService.canChangeUserStatus(currentUser, student);

            return (
              <Col xs={24} sm={12} lg={8} key={student.id || studentCode}>
                <Card
                  hoverable
                  data-testid={`student-card-${studentCode}`}
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                  styles={{
                    body: {
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    },
                  }}
                >
                  {/* Khối 1: Header Card (Avatar + Tên tiếng Việt + Tên tiếng Anh + Mã học viên) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                          size={48}
                          style={{
                            backgroundColor: getAvatarColor(studentCode),
                            fontWeight: 700,
                            fontSize: 18,
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          {(student.englishName || student.name || 'S').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.3 }}>
                            {student.name}
                          </div>
                          <Space size={6} wrap style={{ marginTop: 2 }}>
                            {student.englishName && (
                              <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 700, fontSize: 11, margin: 0 }}>
                                🌟 {student.englishName}
                              </Tag>
                            )}
                            <Tag style={{ borderRadius: 4, fontSize: 11, margin: 0, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                              {studentCode}
                            </Tag>
                          </Space>
                        </div>
                      </div>

                      <Tag color={isActive ? 'success' : 'default'} style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                        {isActive ? (isEnglish ? 'Active' : 'Đang học') : (isEnglish ? 'Inactive' : 'Tạm dừng')}
                      </Tag>
                    </div>

                    {/* Khối 2: Lớp học đang tham gia */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 12,
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
                        📚 {isEnglish ? 'Enrolled Classes:' : 'Lớp Học Đang Tham Gia:'}
                      </div>
                      {enrolledClasses.length === 0 ? (
                        <Tag color="orange" style={{ borderRadius: 4, fontSize: 11 }}>
                          ⏳ {isEnglish ? 'Not assigned to any class yet' : 'Chưa xếp lớp'}
                        </Tag>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {enrolledClasses.map((cls) => (
                            <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ fontWeight: 600, color: '#0958d9' }}>
                                🏫 {cls.name || cls.id}
                              </span>
                              <span style={{ color: '#64748b', fontSize: 11 }}>
                                👨‍🏫 {cls.teacherName || 'Teacher Maj'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Khối 3: Thông tin phụ huynh & Liên hệ nhanh */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>
                          📞 {isEnglish ? 'Parent Phone:' : 'SĐT Phụ Huynh:'}
                        </span>
                        <Space size={6}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {student.phone || student.phoneNumber || (isEnglish ? 'Not updated' : 'Chưa cập nhật')}
                          </span>
                          {cleanPhone && (
                            <>
                              <Tooltip title={isEnglish ? 'Open Zalo Chat' : 'Nhắn tin qua Zalo'}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<MessageOutlined style={{ color: '#0284c7' }} />}
                                  href={`https://zalo.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`btn-zalo-student-${studentCode}`}
                                  style={{ padding: '0 4px', height: 24 }}
                                />
                              </Tooltip>
                              <Tooltip title={isEnglish ? 'Call Parent' : 'Gọi điện cho phụ huynh'}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PhoneOutlined style={{ color: '#16a34a' }} />}
                                  href={`tel:${cleanPhone}`}
                                  data-testid={`btn-call-student-${studentCode}`}
                                  style={{ padding: '0 4px', height: 24 }}
                                />
                              </Tooltip>
                            </>
                          )}
                        </Space>
                      </div>

                      {student.familyId && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>🏡 {isEnglish ? 'Family Cluster:' : 'Cụm Gia Đình:'}</span>
                          <Tag color="purple" style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>
                            {student.familyId}
                          </Tag>
                        </div>
                      )}

                      {student.tuitionStatus && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>💰 {isEnglish ? 'Tuition Status:' : 'Học Phí:'}</span>
                          <Tag color={student.tuitionStatus === 'PAID' ? 'green' : 'volcano'} style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>
                            {student.tuitionStatus === 'PAID' ? (isEnglish ? 'Paid' : 'Đã Đóng') : (isEnglish ? 'Pending' : 'Chờ Đóng')}
                          </Tag>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Khối 4: Chân Card (Nút Hồ Sơ, Nút Sửa, và Switch Bật/Tắt) */}
                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: 12,
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<IdcardOutlined />}
                        onClick={() => {
                          if (onViewStudent) {
                            onViewStudent(student);
                          } else {
                            navigate(`/user-management/${studentCode}`);
                          }
                        }}
                        data-testid={`btn-view-profile-${studentCode}`}
                        style={{ borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap' }}
                      >
                        {isEnglish ? 'Profile' : 'Hồ Sơ'}
                      </Button>

                      {canManage && (
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            if (onEditStudent) {
                              onEditStudent(student);
                            } else {
                              navigate(`/user-management/${studentCode}`);
                            }
                          }}
                          data-testid={`btn-edit-student-${studentCode}`}
                          style={{ borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap' }}
                        >
                          {isEnglish ? 'Edit' : 'Sửa'}
                        </Button>
                      )}
                    </Space>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {isActive ? (isEnglish ? 'Active' : 'Đang học') : (isEnglish ? 'Paused' : 'Tạm dừng')}
                      </span>
                      <Tooltip title={!canChangeStatus ? (isEnglish ? 'You do not have permission to change status' : 'Bạn không có quyền đổi trạng thái') : undefined}>
                        <Switch
                          size="small"
                          checked={isActive}
                          disabled={!canChangeStatus}
                          onChange={(checked) => handleToggle(student, checked)}
                          data-testid={`switch-status-student-${studentCode}`}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default StudentCardGrid;
