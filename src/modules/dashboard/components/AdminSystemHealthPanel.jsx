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
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

const { Text } = Typography;

export const AdminSystemHealthPanel = ({
  healthData,
  adminDemographics = {},
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
  const isMobile = useIsMobile();

  const { totalActiveUsers = 0, totalDisabledUsers = 0, countsByRole = {} } = adminDemographics;

  const serviceColumns = useMemo(
    () => [
      {
        title: t('dashboard.adminHealth.colServiceCode'),
        dataIndex: 'id',
        key: 'id',
        width: 140,
        render: (val) => <Text strong style={{ whiteSpace: 'nowrap' }}>{val}</Text>,
      },
      {
        title: t('dashboard.adminHealth.colServiceName'),
        dataIndex: 'name',
        key: 'name',
        minWidth: 160,
      },
      {
        title: t('dashboard.adminHealth.colStatus'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status) => <Tag color="green" style={{ margin: 0, whiteSpace: 'nowrap' }}>{status}</Tag>,
      },
      {
        title: t('dashboard.adminHealth.colLatency'),
        dataIndex: 'latency',
        key: 'latency',
        width: 100,
        render: (v) => <Tag color="blue" style={{ margin: 0, whiteSpace: 'nowrap' }}>{v}</Tag>,
      },
      {
        title: t('dashboard.adminHealth.colLastCheck'),
        dataIndex: 'lastCheck',
        key: 'lastCheck',
        width: 130,
        render: (v) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span>,
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
        width: 180,
        render: (v) => <Text strong style={{ color: '#1890ff', whiteSpace: 'nowrap' }}>📁 {v}</Text>,
      },
      {
        title: t('dashboard.adminHealth.colFolderPurpose'),
        dataIndex: 'purpose',
        key: 'purpose',
        minWidth: 200,
      },
      {
        title: t('dashboard.adminHealth.colQuickAccess'),
        dataIndex: 'folderId',
        key: 'folderId',
        width: 140,
        render: (id) => (
          <Button
            size="small"
            type="link"
            icon={<FolderOpenOutlined />}
            style={{ whiteSpace: 'nowrap', padding: 0 }}
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
      {/* 0. Hàng Thống Kê Cơ Cấu 6 Roles RBAC Thực Tế */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderTop: '3px solid #1890ff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <Text strong style={{ fontSize: isMobile ? 13 : 15 }}>
              {isEnglish ? 'User Demographics (6 Roles)' : 'Cơ Cấu Tài Khoản 6 Roles'}
            </Text>
          </Space>
          <Space size={4}>
            <Tag color="green" style={{ margin: 0, whiteSpace: 'nowrap' }}>{isEnglish ? 'Active:' : 'Hoạt động:'} {totalActiveUsers}</Tag>
            {totalDisabledUsers > 0 && <Tag color="volcano" style={{ margin: 0, whiteSpace: 'nowrap' }}>{isEnglish ? 'Disabled:' : 'Khóa:'} {totalDisabledUsers}</Tag>}
          </Space>
        </div>

        <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]}>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>IT Admin</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#cf1322' }}>{countsByRole.admin || 0}</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>Director</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#fa8c16' }}>{countsByRole.director || 0}</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>Academic</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#722ed1' }}>{countsByRole.academic || 0}</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>Teacher</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#16a34a' }}>{countsByRole.teacher || 0}</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>Accountant</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#13c2c2' }}>{countsByRole.accountant || 0}</div>
            </div>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <div style={{ padding: isMobile ? '6px 4px' : '8px 12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 10 : 11, color: '#64748b' }}>Student</div>
              <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#1890ff' }}>{countsByRole.student || 0}</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        <Col xs={12} sm={12} xl={6}>
          <Card style={{ borderColor: '#52c41a', borderRadius: 8, height: '100%' }} styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 13 }}>{t('dashboard.adminHealth.systemUptime')}</span>}
              value={healthData.uptime}
              prefix={<SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#52c41a', fontWeight: 'bold', fontSize: isMobile ? 16 : 22, whiteSpace: 'nowrap' } }}
            />
            <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12, display: 'block', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('dashboard.adminHealth.uptimeDesc')}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card style={{ borderColor: '#1890ff', borderRadius: 8, height: '100%' }} styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 13 }}>{t('dashboard.adminHealth.cpuRamUsage')}</span>}
              value={`${healthData.cpuUsage}% / ${healthData.memoryUsage}%`}
              prefix={<CloudServerOutlined style={{ color: '#1890ff', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#1890ff', fontWeight: 'bold', fontSize: isMobile ? 15 : 20, whiteSpace: 'nowrap' } }}
            />
            <Progress percent={healthData.memoryUsage} size="small" status="active" style={{ marginTop: 4 }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card style={{ borderColor: '#722ed1', borderRadius: 8, height: '100%' }} styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 13 }}>{t('dashboard.adminHealth.firestoreHot')}</span>}
              value="< 150 MB"
              prefix={<DatabaseOutlined style={{ color: '#722ed1', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold', fontSize: isMobile ? 15 : 18, whiteSpace: 'nowrap' } }}
            />
            <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12, display: 'block', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isEnglish ? 'Account: ' : 'Tài khoản: '}{healthData.firebaseAccount}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card style={{ borderColor: '#fa8c16', borderRadius: 8, height: '100%' }} styles={{ body: { padding: isMobile ? '12px 10px' : '16px 20px' } }}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 13 }}>{t('dashboard.adminHealth.driveStorage')}</span>}
              value="Drive Storage"
              prefix={<GlobalOutlined style={{ color: '#fa8c16', fontSize: isMobile ? 14 : 18 }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 'bold', fontSize: isMobile ? 14 : 17, whiteSpace: 'nowrap' } }}
            />
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontSize: isMobile ? 10 : 12, textAlign: 'left', justifyContent: 'flex-start', marginTop: 4 }}
              onClick={() => window.open(healthData.driveRootUrl, '_blank')}
            >
              {isEnglish ? 'Project Root →' : 'Thư Mục Gốc →'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: isMobile ? 12 : 20, borderColor: '#91d5ff' }}
        styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
        title={
          <Space>
            <CloudUploadOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
              {isEnglish
                ? (isMobile ? 'Backup & Archive' : 'On-Demand Database Backup & Archive')
                : (isMobile ? 'Sao Lưu & Cắt Dữ Liệu' : 'Cơ Chế Sao Lưu & Cắt Dữ Liệu Năm Cũ')}
            </Text>
          </Space>
        }
        extra={
          <Button
            size="small"
            type="link"
            style={{ padding: 0 }}
            icon={<FolderOpenOutlined />}
            onClick={() => window.open(healthData.driveRootUrl, '_blank')}
          >
            {isEnglish ? (isMobile ? 'Drive Root →' : 'Root Folder on Drive →') : (isMobile ? 'Thư mục Drive →' : 'Thư Mục Trên Google Drive →')}
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} md={10}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={isBackingUp}
              onClick={onBackupToDrive}
              block
              style={{ height: 38 }}
            >
              {isEnglish ? '1. Backup Current Database to Drive' : '1. Backup Toàn Bộ Database Lên Drive'}
            </Button>
          </Col>
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{isEnglish ? '2. Cut-off Year:' : '2. Cắt năm:'}</Text>
              <Select
                value={selectedCutoffYear}
                onChange={onChangeCutoffYear}
                style={{ width: isMobile ? 110 : 150 }}
                options={[
                  { value: '2024', label: isEnglish ? 'Year 2024' : 'Năm 2024' },
                  { value: '2025', label: isEnglish ? 'Year 2025' : 'Năm 2025' },
                  { value: '2026', label: isEnglish ? 'Year 2026' : 'Năm 2026' },
                ]}
              />
              <Button
                danger
                type="primary"
                icon={<ScissorOutlined />}
                loading={isCuttingOff}
                onClick={onCutoffYearToDrive}
                style={{ height: 32 }}
              >
                {isEnglish ? `Archive ${selectedCutoffYear}` : `Cắt ${selectedCutoffYear}`}
              </Button>
            </div>
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
        style={{ marginTop: isMobile ? 12 : 20 }}
        styles={{ body: { padding: isMobile ? '12px 12px' : '20px 24px' } }}
        title={
          <Space>
            <CloudServerOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
              {isEnglish
                ? (isMobile ? 'System Health' : 'Infrastructure & Cloud Health')
                : (isMobile ? 'Sức Khỏe Hệ Thống' : 'Trạng Thái Sức Khỏe Hạ Tầng & Dịch Vụ')}
            </Text>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={onRunDiagnostic}>
            {isEnglish ? (isMobile ? 'Test' : 'Diagnostic') : (isMobile ? 'Kiểm tra' : 'Chẩn Đoán')}
          </Button>
        }
      >
        <Table
          columns={serviceColumns}
          dataSource={healthData.services}
          rowKey="id"
          pagination={false}
          scroll={{ x: 600 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AdminSystemHealthPanel;
