import { Card, Col, Empty, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassLiveCard } from './ClassLiveCard';

export const ClassMonitoringPanel = ({ classes = [], role }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return <Card title={t('classroom.monitoring')} style={{ marginTop: 20 }}>
    {classes.length ? <Row gutter={[16, 16]}>
      {classes.map((cls) => <Col key={cls.id} xs={24} md={12} lg={8}>
        <ClassLiveCard cls={cls} role={role} onClick={() => navigate(`/classroom/${encodeURIComponent(cls.id)}`)} />
      </Col>)}
    </Row> : <Empty description={t('classroom.noSession')} />}
  </Card>;
};
