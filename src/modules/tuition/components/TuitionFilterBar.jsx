import React from 'react';
import { Card, Row, Col, Input, Space, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { TUITION_STATUS_OPTIONS } from '../models/tuition.model';

const { Text } = Typography;

export const TuitionFilterBar = ({
  searchText,
  onChangeSearch,
  statusFilter,
  onChangeStatus,
}) => {
  return (
    <Card styles={{ body: { padding: 12 } }} style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} justify="space-between">
        <Col xs={24} sm={12}>
          <Input
            placeholder="Tìm theo tên học viên, mã HV, lớp học hoặc phụ huynh..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space>
            <Text strong>Trạng thái:</Text>
            <Select
              value={statusFilter}
              style={{ width: 160 }}
              onChange={onChangeStatus}
              options={TUITION_STATUS_OPTIONS}
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

