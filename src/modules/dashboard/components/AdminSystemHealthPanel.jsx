import React, { useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Progress,
  Table,
  Button,
  Space,
  Typography,
  Badge,
  Select,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  CloudUploadOutlined,
  ScissorOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

const { Text } = Typography;

export const AdminSystemHealthPanel = ({
  healthData,
  selectedCutoffYear,
  onChangeCutoffYear,
  isBackingUp,
  isCuttingOff,
  recentDriveArchives,
  onRunDiagnostic,
  onBackupToDrive,
  onCutoffYearToDrive,
}) => {
  const { isEnglish, language, t } = useLanguage();

  const serviceColumns = useMemo(
    () => [
      {
        title: t('dashboard.adminHealth.colServiceCode'),
        dataIndex: 'id',
        key: 'id',
        render: (val) => <Text strong>{val}</Text>,
      },
      {
        title: t('dashboard.adminHealth.colServiceName'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('dashboard.adminHealth.colStatus'),
        dataIndex: 'status',
        key: 'status',
        render: (status) => <Badge status="success" text={<Tag color="green">{status}</Tag>} />,
      },
      {
        title: t('dashboard.adminHealth.colLatency'),
        dataIndex: 'latency',
        key: 'latency',
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: t('dashboard.adminHealth.colLastCheck'),
        dataIndex: 'lastCheck',
        key: 'lastCheck',
      },
    ],
    [isEnglish, language, t]
  );

  const folderColumns = useMemo(
    () => [
      {
        title: t('dashboard.adminHealth.colFolderDrivePath'),
        dataIndex: 'code',
        key: 'code',
        render: (v) => <Text strong style={{ color: '#1890ff' }}>📁 {v}</Text>,
      },
      {
        title: t('dashboard.adminHealth.colFolderPurpose'),
        dataIndex: 'purpose',
        key: 'purpose',
      },
      {
        title: t('dashboard.adminHealth.colQuickAccess'),
        dataIndex: 'folderId',
        key: 'folderId',
        render: (id) => (
          <Button
            size="small"
            type="link"
            icon={<FolderOpenOutlined />}
            onClick={() => window.open(`https://drive.google.com/drive/folders/${id}`, '_blank')}
          >
            {t('dashboard.adminHealth.btnOpenFolder')}
          </Button>
        ),
      },
    ],
    [isEnglish, language, t]
  );

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8, height: '100%' }}>
            <Statistic
              title={t('dashboard.adminHealth.systemUptime')}
              value={healthData.uptime}
              prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('dashboard.adminHealth.uptimeDesc')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8, height: '100%' }}>
            <Statistic
              title={t('dashboard.adminHealth.cpuRamUsage')}
              value={`${healthData.cpuUsage}% / ${healthData.memoryUsage}%`}
              prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold', fontSize: 20 } }}
            />
            <Progress percent={healthData.memoryUsage} size="small" status="active" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8, height: '100%' }}>
            <Statistic
              title={t('dashboard.adminHealth.firestoreHot')}
              value="< 150 MB / 1 GB"
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold', fontSize: 18 } }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isEnglish ? 'Account:' : 'Tài khoản:'} {healthData.firebaseAccount}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card style={{ borderColor: '#fa8c16', borderRadius: 8, height: '100%' }}>
            <Statistic
              title={t('dashboard.adminHealth.driveStorage')}
              value="lakeducation_com"
              prefix={<GlobalOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 'bold', fontSize: 17 } }}
            />
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontSize: 12, textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => window.open(healthData.driveRootUrl, '_blank')}
            >
              {isEnglish ? 'Open Project Root Folder →' : 'Mở Thư Mục Gốc Dự Án →'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 20, borderColor: '#91d5ff' }}
        title={
          <Space>
            <CloudUploadOutlined style={{ color: '#1890ff' }} />
            <Text strong>
              {isEnglish
                ? 'On-Demand Database Backup & Yearly Data Cut-off Archive'
                : 'Cơ Chế Sao Lưu (Backup) & Cắt Dữ Liệu Năm Cũ Theo Yêu Cầu (On-Demand Year Cut-off)'}
            </Text>
          </Space>
        }
        extra={
          <Button
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => window.open(healthData.driveRootUrl, '_blank')}
          >
            {isEnglish ? 'Download Full Root Folder on Drive' : 'Tải Trọn Bộ Thư Mục Gốc Trên Google Drive'}
          </Button>
        }
      >
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} md={10}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={isBackingUp}
              onClick={onBackupToDrive}
              block
            >
              {isEnglish ? '1. Backup Full Current Database to Drive' : '1. Backup Toàn Bộ Database Hiện Tại Lên Drive'}
            </Button>
          </Col>
          <Col xs={24} md={14}>
            <Space wrap>
              <Text strong>{isEnglish ? '2. Select Year to Cut-off & Archive:' : '2. Chọn năm cần cắt dữ liệu:'}</Text>
              <Select
                value={selectedCutoffYear}
                onChange={onChangeCutoffYear}
                style={{ width: 150 }}
                options={[
                  { value: '2024', label: isEnglish ? 'Year 2024 Data' : 'Dữ liệu năm 2024' },
                  { value: '2025', label: isEnglish ? 'Year 2025 Data' : 'Dữ liệu năm 2025' },
                  { value: '2026', label: isEnglish ? 'Year 2026 Data' : 'Dữ liệu năm 2026' },
                ]}
              />
              <Button
                danger
                type="primary"
                icon={<ScissorOutlined />}
                loading={isCuttingOff}
                onClick={onCutoffYearToDrive}
              >
                {isEnglish ? `Cut & Archive ${selectedCutoffYear} to Drive` : `Cắt & Đẩy Năm ${selectedCutoffYear} Sang Drive`}
              </Button>
            </Space>
          </Col>
        </Row>

        {recentDriveArchives.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 6 }}>
            <Text strong style={{ color: '#389e0d', display: 'block', marginBottom: 6 }}>
              {isEnglish
                ? 'Recent Backup / Cut-off archives pushed to Google Drive in this session:'
                : 'Các gói Backup / Cut-off vừa đẩy lên Google Drive trong phiên này:'}
            </Text>
            {recentDriveArchives.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text>{item.fileName} ({item.folderPath})</Text>
                <Space>
                  <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => window.open(item.downloadUrl, '_blank')}>
                    {isEnglish ? 'Download JSON' : 'Tải File JSON'}
                  </Button>
                  <Button size="small" type="link" onClick={() => window.open(item.driveUrl, '_blank')}>
                    {isEnglish ? 'View on Drive' : 'Xem trên Drive'}
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        )}

        <Table
          columns={folderColumns}
          dataSource={healthData.driveFolderTree}
          rowKey="code"
          pagination={false}
          size="small"
          scroll={{ x: 700 }}
        />
      </Card>

      <Card
        style={{ marginTop: 20 }}
        title={
          <Space>
            <CloudServerOutlined style={{ color: '#1890ff' }} />
            <Text strong>
              {isEnglish
                ? 'Infrastructure & Connected Cloud Services Health Check'
                : 'Trạng Thái Sức Khỏe Hạ Tầng & Dịch Vụ (System Health Check)'}
            </Text>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={onRunDiagnostic}>
            {t('dashboard.adminHealth.btnRunDiagnostic')}
          </Button>
        }
      >
        <Table
          columns={serviceColumns}
          dataSource={healthData.services}
          rowKey="id"
          pagination={false}
          scroll={{ x: 700 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AdminSystemHealthPanel;
