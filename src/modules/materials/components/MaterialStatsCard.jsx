import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  BookOutlined,
  CustomerServiceOutlined,
  DesktopOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../../core/context/LanguageContext';

export const MaterialStatsCard = ({ materials = [] }) => {
  const { isEnglish } = useLanguage();

  const total = materials.length;
  const pdfCount = materials.filter((m) => m.type === 'PDF').length;
  const audioCount = materials.filter((m) => m.type === 'AUDIO').length;
  const slidesCount = materials.filter((m) => m.type === 'SLIDES').length;
  const otherCount = total - (pdfCount + audioCount + slidesCount);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #1677ff',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <Statistic
            title={
              <span style={{ fontSize: 13, color: '#64748b' }}>
                📁 {isEnglish ? 'Total Materials' : 'Tổng Học Liệu'}
              </span>
            }
            value={total}
            prefix={<FolderOpenOutlined style={{ color: '#1677ff' }} />}
            valueStyle={{ fontWeight: 700, fontSize: 24, color: '#0f172a' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #0958d9',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <Statistic
            title={
              <span style={{ fontSize: 13, color: '#64748b' }}>
                📘 {isEnglish ? 'Student Books (PDF)' : 'Sách Học Sinh (PDF)'}
              </span>
            }
            value={pdfCount}
            prefix={<FilePdfOutlined style={{ color: '#0958d9' }} />}
            valueStyle={{ fontWeight: 700, fontSize: 24, color: '#0958d9' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #fa8c16',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <Statistic
            title={
              <span style={{ fontSize: 13, color: '#64748b' }}>
                🎧 {isEnglish ? 'Audio Albums (Drive)' : 'Audio Luyện Nghe'}
              </span>
            }
            value={audioCount}
            prefix={<CustomerServiceOutlined style={{ color: '#fa8c16' }} />}
            valueStyle={{ fontWeight: 700, fontSize: 24, color: '#fa8c16' }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={12} md={6} lg={6}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #52c41a',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <Statistic
            title={
              <span style={{ fontSize: 13, color: '#64748b' }}>
                📊 {isEnglish ? 'Slides & Practice' : 'Slide & Sách Bài Tập'}
              </span>
            }
            value={slidesCount + otherCount}
            prefix={<DesktopOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ fontWeight: 700, fontSize: 24, color: '#52c41a' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

