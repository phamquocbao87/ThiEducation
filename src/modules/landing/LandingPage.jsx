import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { LANDING_CONTENT } from './models/landing.model';
import { LandingHeaderHero } from './components/LandingHeaderHero';
import { LandingCurriculumStages } from './components/LandingCurriculumStages';
import { LandingWritingAndBooks } from './components/LandingWritingAndBooks';
import { SystemLoginModal } from './components/SystemLoginModal';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { impersonateAccount, exitImpersonation } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const content = LANDING_CONTENT[language] || LANDING_CONTENT.en;

  const handleLoginSuccess = (targetUserId) => {
    if (targetUserId === 'ADM001') {
      exitImpersonation();
    } else {
      impersonateAccount(targetUserId);
    }
    setLoginModalOpen(false);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <LandingHeaderHero
        content={content}
        language={language}
        onChangeLanguage={setLanguage}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      <LandingCurriculumStages content={content} />

      <LandingWritingAndBooks
        content={content}
        language={language}
      />

      <SystemLoginModal
        open={loginModalOpen}
        language={language}
        onCancel={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
