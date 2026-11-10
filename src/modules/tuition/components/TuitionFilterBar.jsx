import React from 'react';
import { Card, Row, Col, Input, Space, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getTuitionStatusOptions } from '../models/tuition.model';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TuitionFilterBar = ({
  searchText,
  onChangeSearch,
  statusFilter,
  onChangeStatus,
}) => {
  const { isEnglish } = useLanguage();

  return (
    <Card styles={{ body: { padding: 12 } }} style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} justify="space-between">
        <Col xs={24} sm={12}>
          <Input
            placeholder={
              isEnglish
                ? 'Search student by code, name, phone, class...'
                : 'Tìm theo tên học viên, mã HV, lớp học hoặc phụ huynh...'
            }
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onChangeSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space>
            <Text strong>{isEnglish ? 'Status:' : 'Trạng thái:'}</Text>
            <Select
              value={statusFilter}
              style={{ width: 160 }}
              onChange={onChangeStatus}
              options={getTuitionStatusOptions(isEnglish)}
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
