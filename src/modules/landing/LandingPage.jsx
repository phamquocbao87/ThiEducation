import React, { useState, useEffect } from 'react';
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

  const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);

  // Tự động bật Modal Đăng Nhập nếu người dùng bị Route Guard chặn lại vì chưa đăng nhập
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get('redirect');
      if (redir) {
        setPendingRedirectUrl(redir);
      }
      if (params.get('require_login') === 'true') {
        setLoginModalOpen(true);
        message.warning(
          language === 'en'
            ? 'Please sign in to access the LAK EDUCATION portal.'
            : 'Vui lòng đăng nhập để truy cập hệ thống LAK EDUCATION.'
        );
        const url = new URL(window.location.href);
        url.searchParams.delete('require_login');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, [language]);

  const handleLoginSuccess = (authResultOrId) => {
    let authResult;
    if (authResultOrId && typeof authResultOrId === 'object' && authResultOrId.success) {
      authResult = authResultOrId;
    } else {
      authResult = loginWithAccount(authResultOrId);
    }
    setLoginModalOpen(false);

    if (authResult && authResult.success) {
      const { user } = authResult;
      const target = resolveErpTargetAfterLogin(user, language);

      message.success(
        language === 'en'
          ? `Welcome back, ${user.name}!`
          : `Xin chào, ${user.name}!`
      );

      if (target.isExternalRedirect) {
        window.location.href = target.url;
      } else {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectUrl = (params && params.get('redirect')) || pendingRedirectUrl;
        navigate(redirectUrl || target.path);
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
