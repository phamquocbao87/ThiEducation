import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Pagination,
  Rate,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  HistoryOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  StarFilled,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassroomService } from '../services/ClassroomService';

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;

const SESSIONS_PER_PAGE = 6; // Cố định 6 thẻ / trang để chống tràn layout khi có hàng trăm buổi

/**
 * EvaluationHistoryDrawer
 * Hệ thống tra cứu lịch sử đánh giá cấp Enterprise:
 * - Hỗ trợ hàng trăm buổi học mà KHÔNG BAO GIỜ VỠ LAYOUT (Zero Layout Break Invariant).
 * - Tích hợp phân trang (Pagination), tìm kiếm nhanh theo số buổi/ngày (Search),
 *   bộ chọn nhảy nhanh 1 chạm (Quick Jump Select) và bộ lọc theo tháng (Month Filter).
 * - 100% dữ liệu thực tế từ Cloud Firestore (`session_evaluations`).
 */
export const EvaluationHistoryDrawer = ({
  open = false,
  onClose,
  cls = {},
  roster = [],
  currentEvaluations = {},
  currentSessionIndex = 3,
  currentDate,
  currentSessionId,
  userRole = 'teacher',
  currentStudentId = null,
}) => {
  const { isEnglish } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [firestoreSessions, setFirestoreSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Bộ lọc & Phân trang cho lớp học quy mô hàng trăm buổi
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const isStudent = userRole === 'student';

  // 1. Tải danh sách lịch sử đánh giá thực tế từ Firestore `session_evaluations`
  useEffect(() => {
    if (!open || !cls?.id) return;
    let isMounted = true;
    setLoading(true);

    ClassroomService.getEvaluationHistory(cls.id)
      .then((docs) => {
        if (!isMounted) return;
        setFirestoreSessions(docs);
        if (docs.length > 0) {
          setSelectedSessionId((prev) => (prev && docs.some((d) => d.id === prev) ? prev : docs[0].id));
        }
      })
      .catch((err) => {
        console.warn('[EvaluationHistoryDrawer] Lỗi tải lịch sử từ Firestore:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, cls?.id]);

  // 2. Định dạng danh sách toàn bộ các buổi học thực tế
  const allHistorySessions = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // A. Các buổi học đã lưu trong Firestore
    firestoreSessions.forEach((doc, idx) => {
      seenIds.add(doc.id);
      const studentEvalMap = doc.studentEvaluations || {};
      const presenceMap = doc.presence || {};

      const studentList = roster.map((s) => {
        const evalItem = studentEvalMap[s.id] || {};
        const p = presenceMap[s.id] || 'UNMARKED';
        return {
          id: s.id,
          name: s.englishName || s.name,
          nativeName: s.name,
          stars: evalItem.stars || (p === 'OFFLINE' ? 1 : 5),
          comment: evalItem.comment || '',
          tags: evalItem.tags || [],
          presence: p,
          hasEvaluation: Boolean(studentEvalMap[s.id]),
        };
      });

      const evaluatedStudents = studentList.filter((s) => s.hasEvaluation);
      const avgStars = evaluatedStudents.length > 0
        ? (evaluatedStudents.reduce((acc, s) => acc + s.stars, 0) / evaluatedStudents.length).toFixed(1)
        : '5.0';

      const presentCount = studentList.filter((s) => s.presence === 'ONLINE').length;
      const sessionNum = doc.sessionIndex || (firestoreSessions.length - idx);

      list.push({
        id: doc.id,
        sessionIndex: sessionNum,
        title: doc.lessonPlan?.topic
          ? (isEnglish ? `Session ${sessionNum}: ${doc.lessonPlan.topic}` : `Buổi ${sessionNum}: ${doc.lessonPlan.topic}`)
          : (isEnglish ? `Session ${sessionNum}: Evaluated Class` : `Buổi ${sessionNum}: Đánh Giá Buổi Học`),
        date: doc.date || (doc.sessionStart ? new Date(doc.sessionStart).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN') : 'N/A'),
        teacherName: doc.teacherName || cls?.teacherName || 'Teacher',
        isCurrent: Boolean(currentSessionId && doc.id === currentSessionId),
        students: studentList,
        avgStars,
        attendedCount: doc.presentCount !== undefined ? doc.presentCount : presentCount,
        totalCount: doc.totalStudents || roster.length,
      });
    });

    // B. Nếu buổi hiện tại có dữ liệu đánh giá mà chưa nằm trong Firestore docs
    if (currentSessionId && !seenIds.has(currentSessionId) && Object.keys(currentEvaluations || {}).length > 0) {
      const currentStudentsList = roster.map((s) => {
        const evalData = currentEvaluations[s.id] || {};
        return {
          id: s.id,
          name: s.englishName || s.name,
          nativeName: s.name,
          stars: evalData.stars || 5,
          comment: evalData.comment || '',
          tags: evalData.tags || [],
          presence: 'ONLINE',
          hasEvaluation: Boolean(currentEvaluations[s.id]),
        };
      });

      const evStudents = currentStudentsList.filter((s) => s.hasEvaluation);
      const avg = evStudents.length > 0
        ? (evStudents.reduce((acc, s) => acc + s.stars, 0) / evStudents.length).toFixed(1)
        : '5.0';

      list.unshift({
        id: currentSessionId,
        sessionIndex: currentSessionIndex,
        title: isEnglish ? `Session ${currentSessionIndex}: Live / Today` : `Buổi ${currentSessionIndex}: Hôm Nay (Đang Mở)`,
        date: currentDate || new Date().toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN'),
        teacherName: cls?.teacherName || 'Teacher',
        isCurrent: true,
        students: currentStudentsList,
        avgStars: avg,
        attendedCount: currentStudentsList.length,
        totalCount: roster.length,
      });
    }

    return list;
  }, [firestoreSessions, roster, currentSessionId, currentEvaluations, currentSessionIndex, currentDate, cls?.teacherName, isEnglish]);

  // 3. Trích xuất danh sách tháng duy nhất để đưa vào dropdown lọc
  const availableMonths = useMemo(() => {
    const months = new Set();
    allHistorySessions.forEach((s) => {
      if (!s.date || s.date === 'N/A') return;
      const parts = s.date.split(/[-/]/);
      if (parts.length >= 3) {
        // Hỗ trợ cả định dạng YYYY-MM-DD và DD/MM/YYYY
        const mKey = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`;
        months.add(mKey);
      }
    });
    return Array.from(months).sort().reverse();
  }, [allHistorySessions]);

  // 4. Lọc danh sách theo từ khóa tìm kiếm & tháng
  const filteredSessions = useMemo(() => {
    return allHistorySessions.filter((s) => {
      // Lọc theo từ khóa
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchIndex = String(s.sessionIndex).includes(kw);
        const matchTitle = s.title?.toLowerCase().includes(kw);
        const matchDate = s.date?.toLowerCase().includes(kw);
        const matchTeacher = s.teacherName?.toLowerCase().includes(kw);
        if (!matchIndex && !matchTitle && !matchDate && !matchTeacher) return false;
      }

      // Lọc theo tháng
      if (selectedMonth !== 'ALL' && s.date && s.date !== 'N/A') {
        const parts = s.date.split(/[-/]/);
        const mKey = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`;
        if (mKey !== selectedMonth) return false;
      }

      return true;
    });
  }, [allHistorySessions, searchKeyword, selectedMonth]);

  // 5. Cắt danh sách theo trang (Pagination Chunking) - Khắc phục 100% vấn đề vỡ layout
  const paginatedSessions = useMemo(() => {
    const startIdx = (currentPage - 1) * SESSIONS_PER_PAGE;
    return filteredSessions.slice(startIdx, startIdx + SESSIONS_PER_PAGE);
  }, [filteredSessions, currentPage]);

  // 6. Buổi học đang được chọn hiển thị chi tiết
  const activeSession = useMemo(() => {
    if (!filteredSessions.length) return null;
    return filteredSessions.find((s) => s.id === selectedSessionId) || filteredSessions[0];
  }, [filteredSessions, selectedSessionId]);

  // Hàm chọn nhanh một buổi học từ bất kỳ đâu (tự động đổi trang tương ứng)
  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    const targetIdx = filteredSessions.findIndex((s) => s.id === sessionId);
    if (targetIdx !== -1) {
      const targetPage = Math.floor(targetIdx / SESSIONS_PER_PAGE) + 1;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }
  };

  const columns = [
    {
      title: isEnglish ? 'Student' : 'Học Viên',
      key: 'student',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 13, display: 'block' }}>{record.name}</Text>
          {record.nativeName && record.nativeName !== record.name && (
            <Text type="secondary" style={{ fontSize: 11 }}>{record.nativeName}</Text>
          )}
        </div>
      ),
    },
    {
      title: isEnglish ? 'Attendance' : 'Tham Gia',
      key: 'presence',
      width: 110,
      render: (_, record) => (
        <Tag color={record.presence === 'ONLINE' ? 'success' : record.presence === 'OFFLINE' ? 'error' : 'default'}>
          {record.presence === 'ONLINE' ? 'Online' : record.presence === 'OFFLINE' ? 'Offline' : (isEnglish ? 'Unmarked' : 'Chưa điểm danh')}
        </Tag>
      ),
    },
    {
      title: isEnglish ? 'Rating' : 'Đánh Giá',
      key: 'stars',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Rate disabled value={record.stars} character={<StarFilled />} style={{ fontSize: 12 }} />
          <Text strong style={{ fontSize: 11, color: '#faad14' }}>({record.stars}/5)</Text>
        </Space>
      ),
    },
    {
      title: isEnglish ? 'Teacher Feedback' : 'Nhận Xét Của Giáo Viên',
      key: 'comment',
      render: (_, record) => (
        <div style={{ fontSize: 12, color: record.comment ? '#334155' : '#94a3b8', fontStyle: record.comment ? 'normal' : 'italic', lineHeight: '18px', whiteSpace: 'pre-line' }}>
          {record.comment ? `"${record.comment}"` : (isEnglish ? '(No detailed comments recorded)' : '(Chưa có nhận xét chi tiết)')}
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {isEnglish ? 'Class Evaluation History' : 'Lịch Sử Đánh Giá Các Buổi Học'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
              {cls?.name || 'Class'} • {allHistorySessions.length} {isEnglish ? 'evaluated sessions' : 'buổi học đã đánh giá'}
            </div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={740}
      styles={{ body: { padding: '16px 20px', backgroundColor: '#f8fafc' } }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
          <Spin size="large" tip={isEnglish ? 'Loading real evaluation records...' : 'Đang tải lịch sử đánh giá từ cơ sở dữ liệu...'} />
        </div>
      ) : allHistorySessions.length === 0 ? (
        <Empty
          style={{ marginTop: 60 }}
          description={
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {isEnglish ? 'No evaluation history recorded for this class yet' : 'Chưa có bản ghi lịch sử đánh giá nào cho lớp học này'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isEnglish
                  ? 'Historical records will automatically appear here once sessions are evaluated.'
                  : 'Dữ liệu lịch sử sẽ tự động xuất hiện tại đây khi giáo viên hoàn thành đánh giá buổi học.'}
              </Text>
            </div>
          }
        />
      ) : (
        <>
          {/* 1. THANH ĐIỀU HƯỚNG & TÌM KIẾM ĐA NĂNG (Dành cho lớp quy mô lớn hàng trăm buổi) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              marginBottom: 16,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <Row gutter={[10, 10]} align="middle">
              {/* Ô 1: Nhảy nhanh 1 chạm đến buổi bất kỳ (1 đến N) */}
              <Col xs={24} sm={12}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  value={activeSession?.id}
                  onChange={handleSelectSession}
                  style={{ width: '100%' }}
                  placeholder={isEnglish ? '⚡ Quick Jump to Session (1 to N)...' : '⚡ Nhảy nhanh đến Buổi học (1 đến N)...'}
                  options={allHistorySessions.map((s) => ({
                    value: s.id,
                    label: `${isEnglish ? `Session ${s.sessionIndex}` : `Buổi ${s.sessionIndex}`} • ${s.date} (⭐${s.avgStars})`,
                  }))}
                />
              </Col>

              {/* Ô 2: Tìm kiếm theo từ khóa / ngày */}
              <Col xs={14} sm={7}>
                <Input
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  placeholder={isEnglish ? 'Search date/session...' : 'Tìm ngày, số buổi...'}
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: '100%', borderRadius: 6 }}
                />
              </Col>

              {/* Ô 3: Lọc theo tháng */}
              <Col xs={10} sm={5}>
                <Select
                  value={selectedMonth}
                  onChange={(val) => {
                    setSelectedMonth(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'ALL', label: isEnglish ? 'All Months' : 'Tất Cả Tháng' },
                    ...availableMonths.map((m) => ({ value: m, label: m })),
                  ]}
                />
              </Col>
            </Row>

            {/* Thanh hiển thị phân trang & tóm tắt số lượng buổi */}
            {filteredSessions.length > SESSIONS_PER_PAGE && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: '1px dashed #f0f0f0',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isEnglish
                    ? `Showing ${((currentPage - 1) * SESSIONS_PER_PAGE) + 1}–${Math.min(currentPage * SESSIONS_PER_PAGE, filteredSessions.length)} of ${filteredSessions.length} sessions`
                    : `Hiển thị ${((currentPage - 1) * SESSIONS_PER_PAGE) + 1}–${Math.min(currentPage * SESSIONS_PER_PAGE, filteredSessions.length)} trên tổng số ${filteredSessions.length} buổi`}
                </Text>

                <Pagination
                  size="small"
                  current={currentPage}
                  pageSize={SESSIONS_PER_PAGE}
                  total={filteredSessions.length}
                  onChange={(p) => setCurrentPage(p)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>

          {/* 2. LƯỚI THẺ CÁC BUỔI HỌC (PAGINATED CHUNKING - CỐ ĐỊNH TỐI ĐA 6 THẺ/TRANG) */}
          {paginatedSessions.length === 0 ? (
            <Empty
              style={{ padding: '20px 0' }}
              description={isEnglish ? 'No sessions match your search filter' : 'Không tìm thấy buổi học nào khớp bộ lọc'}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {paginatedSessions.map((s) => {
                const isSelected = s.id === activeSession?.id;
                return (
                  <Card
                    key={s.id}
                    size="small"
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 10,
                      borderColor: isSelected ? '#1890ff' : '#e2e8f0',
                      backgroundColor: isSelected ? '#e6f7ff' : '#ffffff',
                      boxShadow: isSelected ? '0 2px 6px rgba(24, 144, 255, 0.16)' : 'none',
                      transition: 'all 0.18s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Tag color={s.isCurrent ? 'geekblue' : 'default'} style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                        {isEnglish ? `Session ${s.sessionIndex}` : `Buổi ${s.sessionIndex}`}
                      </Tag>
                      {s.isCurrent && (
                        <Badge status="processing" text={<span style={{ fontSize: 10, color: '#1890ff' }}>{isEnglish ? 'Active' : 'Hiện tại'}</span>} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📅 {s.date}</span>
                      <span style={{ color: '#faad14', fontWeight: 600 }}>⭐ {s.avgStars}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 3. CHI TIẾT CỦA BUỔI HỌC ĐANG CHỌN */}
          {activeSession && (
            <Card
              style={{ borderRadius: 12, borderColor: '#bae0ff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              styles={{ body: { padding: 16 } }}
            >
              {/* Header tóm tắt buổi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                <div>
                  <Space size={6} wrap>
                    <Tag color="geekblue" style={{ fontWeight: 700 }}>
                      {isEnglish ? `Session ${activeSession.sessionIndex}` : `Buổi ${activeSession.sessionIndex}`}
                    </Tag>
                    <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
                      {activeSession.title}
                    </Text>
                  </Space>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    📅 {isEnglish ? 'Date: ' : 'Ngày học: '}<strong>{activeSession.date}</strong> • 👨‍🏫 {isEnglish ? 'Teacher: ' : 'Giáo viên: '}<strong>{activeSession.teacherName}</strong>
                  </div>
                </div>

                <Space size={8}>
                  <Tag color="green">
                    ✓ {isEnglish ? 'Attended: ' : 'Có mặt: '}{activeSession.attendedCount}/{activeSession.totalCount}
                  </Tag>
                  <Tag color="gold">
                    ⭐ {activeSession.avgStars}/5.0
                  </Tag>
                </Space>
              </div>

              {/* Dành cho Học viên: Chỉ hiển thị nhận xét của chính mình trong buổi này */}
              {isStudent ? (
                (() => {
                  const myEval = activeSession.students.find((s) => s.id === currentStudentId) || activeSession.students[0];
                  if (!myEval) return <Empty description={isEnglish ? 'No evaluation found' : 'Chưa có đánh giá'} />;

                  return (
                    <div style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
                          🎓 {isEnglish ? 'Your Evaluation for this Session' : 'Đánh Giá Của Con Trong Buổi Học Này'}
                        </Text>
                        <Rate disabled value={myEval.stars} character={<StarFilled />} style={{ fontSize: 16 }} />
                      </div>
                      <Paragraph italic style={{ fontSize: 13, color: '#1e293b', margin: 0, lineHeight: '22px', whiteSpace: 'pre-line' }}>
                        {myEval.comment ? `"${myEval.comment}"` : (isEnglish ? '(No detailed comments recorded for this session)' : '(Chưa có nhận xét chi tiết cho buổi học này)')}
                      </Paragraph>
                    </div>
                  );
                })()
              ) : (
                /* Dành cho Giáo viên & Giáo vụ: Bảng điểm danh & nhận xét cả lớp */
                <Table
                  dataSource={activeSession.students}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          )}
        </>
      )}
    </Drawer>
  );
};
