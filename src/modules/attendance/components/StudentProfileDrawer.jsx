import React, { useState } from 'react';
import { Drawer, List, Card, Tag, Rate, Input, Button, Space, Typography, Row, Col } from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const StudentProfileDrawer = ({
  open,
  selectedClass,
  students,
  canEditNote,
  onClose,
  onSaveStudentNote,
}) => {
  const [editingNotes, setEditingNotes] = useState({});

  const handleNoteChange = (studentId, val) => {
    setEditingNotes((prev) => ({ ...prev, [studentId]: val }));
  };

  return (
    <Drawer
      title={`Hồ Sơ & Nhận Xét Từng Học Viên — ${selectedClass?.name || 'Toàn bộ lớp'}`}
      placement="right"
      width={620}
      onClose={onClose}
      open={open}
    >
      <List
        dataSource={students}
        renderItem={(st) => {
          const currentNote = editingNotes[st.id] ?? st.latestTeacherNote;
          return (
            <Card
              key={st.id}
              size="small"
              style={{ marginBottom: 14, borderColor: '#d9d9d9' }}
              title={
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{st.name} ({st.englishName})</Text>
                  <Tag color="blue">{st.id}</Tag>
                  <Tag color="purple">{st.level}</Tag>
                </Space>
              }
              extra={<Tag color="green">Chuyên cần: {st.attendanceRate}%</Tag>}
            >
              <Row gutter={[8, 4]} style={{ marginBottom: 8 }}>
                <Col span={12}><Text type="secondary">Phụ huynh:</Text> {st.parentName} ({st.phone})</Col>
                <Col span={12}><Text type="secondary">Độ tuổi:</Text> {st.age} tuổi</Col>
                <Col span={12}>🗣️ Phát âm: <Rate disabled defaultValue={st.pronunciationScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🔤 Đánh vần: <Rate disabled defaultValue={st.spellingScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🎯 Nghiêm túc: <Rate disabled defaultValue={st.seriousnessScore} style={{ fontSize: 12 }} /></Col>
                <Col span={12}>🎧 Nghe hiểu: <Rate disabled defaultValue={st.listeningScore} style={{ fontSize: 12 }} /></Col>
              </Row>

              {canEditNote ? (
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={currentNote}
                    onChange={(e) => handleNoteChange(st.id, e.target.value)}
                    placeholder="Nhập nhận xét riêng cho học viên này..."
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => onSaveStudentNote(st.id, currentNote)}
                  >
                    Lưu Nhận Xét
                  </Button>
                </Space.Compact>
              ) : (
                <div style={{ background: '#f6ffed', padding: 8, borderRadius: 6 }}>
                  <Text strong>Nhận xét của Giáo viên:</Text> <Text italic>"{st.latestTeacherNote}"</Text>
                </div>
              )}
            </Card>
          );
        }}
      />
    </Drawer>
  );
};

