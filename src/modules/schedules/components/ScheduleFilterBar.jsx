import React from 'react';
import { Card, Space, Select, Typography } from 'antd';
import { DAYS_OF_WEEK } from '../models/schedules.model';

const { Text } = Typography;

export const ScheduleFilterBar = ({ selectedDayFilter, onChangeDayFilter }) => {
  return (
    <Card styles={{ body: { padding: 12 } }} style={{ marginBottom: 16 }}>
      <Space wrap>
        <Text strong>Lọc Thời Khóa Biểu theo Thứ:</Text>
        <Select
          value={selectedDayFilter}
          style={{ width: 180 }}
          onChange={onChangeDayFilter}
          options={DAYS_OF_WEEK}
        />
      </Space>
    </Card>
  );
};

