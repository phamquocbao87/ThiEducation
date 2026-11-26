import React, { useEffect, useState } from 'react';
import { Card, Col, Empty, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../core/context/LanguageContext';
import { ClassLiveCard } from './ClassLiveCard';
import { PendingEvaluationTaskService } from '../services/PendingEvaluationTaskService';
import { PendingEvaluationTasksCard } from './PendingEvaluationTasksCard';

export const ClassMonitoringPanel = ({ classes = [], role }) => {
  const { t, isEnglish } = useLanguage();
  const navigate = useNavigate();
  const [evalTasks, setEvalTasks] = useState([]);

  useEffect(() => {
    let active = true;
    if (!classes.length || !['director', 'admin'].includes(role)) return undefined;
    PendingEvaluationTaskService.getPendingEvaluations({
      classes,
      userRole: role,
      isEnglish,
    })
      .then((list) => {
        if (active) setEvalTasks(list || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [classes, role, isEnglish]);

  return (
    <div style={{ marginTop: 20 }}>
      {['director', 'admin'].includes(role) && evalTasks.length > 0 && (
        <PendingEvaluationTasksCard tasks={evalTasks} />
      )}
      <Card title={t('classroom.monitoring')}>
        {classes.length ? <Row gutter={[16, 16]}>
          {classes.map((cls) => <Col key={cls.id} xs={24} sm={12} md={12} lg={12} xl={8} xxl={6}>
            <ClassLiveCard cls={cls} role={role} onClick={() => navigate(`/classroom/${encodeURIComponent(cls.id)}`)} />
          </Col>)}
        </Row> : <Empty description={t('classroom.noSession')} />}
      </Card>
    </div>
  );
};
