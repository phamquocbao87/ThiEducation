import React, { useMemo } from 'react';
import { Table, Tag, Typography, Empty } from 'antd';
import { formatCurrency } from '../../../shared/utils/formatter';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const TeacherContractTable = ({ contracts }) => {
  const { isEnglish, language, t } = useLanguage();

  const columns = useMemo(
    () => [
      {
        title: t('contracts.table.colContractCode'),
        dataIndex: 'id',
        key: 'id',
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: t('contracts.table.colTeacherName'),
        dataIndex: 'teacherName',
        key: 'teacherName',
        render: (text) => (
          <Text strong style={{ color: '#1890ff' }}>
            {text}
          </Text>
        ),
      },
      {
        title: t('contracts.table.colContractType'),
        dataIndex: 'type',
        key: 'type',
        render: (type) => (
          <Tag
            color={
              (type || '').includes('Full-time')
                ? 'blue'
                : (type || '').includes('Part-time')
                ? 'cyan'
                : 'orange'
            }
          >
            {type}
          </Tag>
        ),
      },
      {
        title: t('contracts.table.colRatePerSession'),
        dataIndex: 'ratePerSession',
        key: 'ratePerSession',
        render: (val) => (
          <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
            {formatCurrency(val)}
          </Text>
        ),
      },
      {
        title: t('contracts.table.colMinSessions'),
        dataIndex: 'minSessionsPerMonth',
        key: 'minSessionsPerMonth',
        render: (val) => `${val} ${t('contracts.table.unitSessions')}`,
      },
      {
        title: t('contracts.table.colStartDate'),
        dataIndex: 'startDate',
        key: 'startDate',
      },
      {
        title: t('contracts.table.colEndDate'),
        dataIndex: 'endDate',
        key: 'endDate',
      },
      {
        title: t('contracts.table.colStatus'),
        dataIndex: 'status',
        key: 'status',
        render: (status) => <Tag color="green">{status || 'Active'}</Tag>,
      },
    ],
    [isEnglish, language, t]
  );

  return (
    <Table
      columns={columns}
      dataSource={contracts}
      rowKey="id"
      scroll={{ x: 800 }}
      pagination={{ pageSize: 5 }}
      locale={{
        emptyText: (
          <Empty
            description={t('contracts.table.emptyContracts')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  );
};

export default TeacherContractTable;
