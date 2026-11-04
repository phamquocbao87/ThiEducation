import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { resolveErpTargetAfterLogin } from '../../core/config/siteConfig';
import { LANDING_CONTENT } from './models/landing.model';
import { LandingHeaderHero } from './components/LandingHeaderHero';
import { LandingCurriculumStages } from './components/LandingCurriculumStages';
import { LandingWritingAndBooks } from './components/LandingWritingAndBooks';
import { SystemLoginModal } from './components/SystemLoginModal';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { loginWithAccount } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const content = LANDING_CONTENT[language] || LANDING_CONTENT.en;

  const handleLoginSuccess = (targetUserId) => {
    const authResult = loginWithAccount(targetUserId);
    setLoginModalOpen(false);

    if (authResult.success) {
      const { user } = authResult;
      const target = resolveErpTargetAfterLogin(user, language);

      message.success(
        language === 'en'
          ? `Signed in successfully as ${user.name} (${user.role.toUpperCase()}). Redirecting to ERP Workspace...`
          : `Đăng nhập thành công: ${user.name} (Vai trò: ${user.role.toUpperCase()}). Đang mở màn hình ERP tương ứng...`
      );

      if (target.isExternalRedirect) {
        window.location.href = target.url;
      } else {
        navigate(target.path);
      }
    }
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
