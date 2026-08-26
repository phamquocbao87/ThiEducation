import React from 'react';
import { Table } from 'antd';

export const DataTable = ({ columns, dataSource, rowKey = "id", pageSize = 5, ...rest }) => {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      scroll={{ x: 800 }}
      pagination={{ pageSize }}
      {...rest}
    />
  );
};
