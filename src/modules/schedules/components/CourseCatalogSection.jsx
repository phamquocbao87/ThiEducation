import React from 'react';
import { Row, Col, Card, Tag, Typography, Button, Space } from 'antd';
import { BookOutlined, PlusOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/formatter';

const { Text, Title } = Typography;

export const CourseCatalogSection = ({ courses, canManage, onOpenCreateCourse }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <Space>
              <BookOutlined style={{ color: '#1890ff' }} />
              <span>Danh Mục Khóa Học Đang Triển Khai ({courses.length})</span>
            </Space>
          </Title>
        </Col>
        {canManage && (
          <Col>
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={onOpenCreateCourse}>
              Tạo Khóa Học Mới
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 16]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} lg={6} key={course.id}>
            <Card
              size="small"
              hoverable
              title={<Text strong style={{ color: '#1890ff' }}>{course.name}</Text>}
              extra={<Tag color="green">{course.id}</Tag>}
            >
              <div><Text type="secondary">Trình độ:</Text> <Tag color="blue">{course.level}</Tag></div>
              <div style={{ marginTop: 4 }}><Text type="secondary">Thời lượng:</Text> <Text strong>{course.durationWeeks} tuần</Text></div>
              <div style={{ marginTop: 4 }}><Text type="secondary">Quy mô:</Text> <Text strong>{course.activeClasses} lớp ({course.enrolledStudents} HV)</Text></div>
              <div style={{ marginTop: 4 }}><Text type="secondary">Học phí:</Text> <Text strong style={{ color: '#722ed1' }}>{formatCurrency(course.feePerMonth)}/tháng</Text></div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

