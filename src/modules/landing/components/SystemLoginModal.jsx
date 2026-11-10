import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Divider,
  Typography,
  Checkbox,
  message,
  Alert,
  Avatar,
  Tag,
  Space,
  Spin,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  LoginOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';
import { useAuth } from '../../../core/context/AuthContext';
import { localizeSystemMessage } from '../../../core/i18n/i18n';
import {
  detectLoginIdentifierType,
  ROLE_COLORS,
  ROLE_LABELS,
} from '../../../modules/users/models/user.model';
import { DriveStorageService } from '../../../core/services/DriveStorageService';

const { Title, Text } = Typography;

const GoogleColorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8, verticalAlign: 'middle' }}>
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export const SystemLoginModal = ({
  open,
  language,
  onCancel,
  onLoginSuccess,
}) => {
  const [form] = Form.useForm();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [authError, setAuthError] = useState('');

  // Trạng thái chọn hồ sơ khi SĐT/Email gắn với nhiều học viên / vai trò
  const [candidateProfiles, setCandidateProfiles] = useState(null);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [selectingTargetId, setSelectingTargetId] = useState(null);

  const watchedIdentifier = Form.useWatch('identifier', form) || '';
  const detectedType = detectLoginIdentifierType(watchedIdentifier);

  // Tự động chuyển đổi ngôn ngữ thông báo lỗi khi người dùng đổi ngôn ngữ EN / VI
  useEffect(() => {
    if (authError) {
      setAuthError((prev) => localizeSystemMessage(prev, language));
    }
  }, [language]);

  const handleModalClose = () => {
    setCandidateProfiles(null);
    setPendingCredentials(null);
    setSelectingTargetId(null);
    setAuthError('');
    onCancel();
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setAuthError('');
    try {
      const result = await loginWithGoogle();
      if (result && result.success) {
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error('[Google SignIn Error]:', err);
      const localizedError = localizeSystemMessage(err.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại.', language);
      setAuthError(localizedError);
      message.error(localizedError);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSignIn = async (values) => {
    setLoadingEmail(true);
    setAuthError('');
    try {
      const identifier = (values.identifier || values.email || '').trim();
      const password = values.password;
      const result = await loginWithEmail(identifier, password);
      if (result?.requireProfileSelection) {
        setCandidateProfiles(result.matchedProfiles);
        setPendingCredentials({ identifier, password });
        return;
      }
      if (result && result.success) {
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error('[Email/Phone SignIn Error]:', err);
      const localizedError = localizeSystemMessage(err.message || 'Tài khoản hoặc mật khẩu không đúng.', language);
      setAuthError(localizedError);
      message.error(localizedError);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSelectProfile = async (targetProfile) => {
    if (!pendingCredentials) return;
    const targetId = targetProfile.id || targetProfile.code;
    setSelectingTargetId(targetId);
    setAuthError('');
    try {
      const result = await loginWithEmail(
        pendingCredentials.identifier,
        pendingCredentials.password,
        targetId
      );
      if (result && result.success) {
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error('[Select Profile Login Error]:', err);
      const localizedError = localizeSystemMessage(err.message || 'Lỗi đăng nhập vào hồ sơ này.', language);
      setAuthError(localizedError);
      message.error(localizedError);
    } finally {
      setSelectingTargetId(null);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleModalClose}
      footer={null}
      width="min(440px, calc(100vw - 24px))"
      centered
      style={{ maxWidth: 'calc(100vw - 24px)', margin: '0 auto' }}
      styles={{
        body: { padding: '16px 16px 12px' },
      }}
    >
      {candidateProfiles && candidateProfiles.length > 0 ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Avatar
              size={52}
              style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: 24, marginBottom: 8 }}
              icon={<UserOutlined />}
            />
            <Title level={4} style={{ margin: '0 0 4px 0', color: '#0f172a', fontWeight: 800 }}>
              {language === 'en' ? 'Select Child / Profile' : 'Chọn Hồ Sơ Vào Học / Làm Việc'}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {language === 'en'
                ? 'Multiple accounts found for this login. Choose one to continue:'
                : 'Thông tin này liên kết với nhiều tài khoản. Vui lòng chọn hồ sơ:'}
            </Text>
          </div>

          {authError && (
            <Alert
              type="error"
              showIcon
              message={authError}
              style={{ marginBottom: 14 }}
              closable
              onClose={() => setAuthError('')}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {candidateProfiles.map((p) => {
              const targetKey = p.id || p.code;
              const isSelecting = selectingTargetId === targetKey;
              const roleColor = ROLE_COLORS[p.role] || 'blue';
              const roleName = language === 'en' ? (ROLE_LABELS.en?.[p.role] || p.role) : (ROLE_LABELS.vi?.[p.role] || p.role);

              return (
                <div
                  key={targetKey}
                  data-profile-id={targetKey}
                  className="lak-profile-candidate-card"
                  onClick={() => !isSelecting && handleSelectProfile(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: isSelecting ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.background = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar
                      size={44}
                      src={DriveStorageService.formatAvatarUrl(p.avatar, 100)}
                      icon={<UserOutlined />}
                      style={{ border: `2px solid ${roleColor === 'red' ? '#ff4d4f' : '#38bdf8'}` }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                          {p.name}
                        </Text>
                        {p.englishName && (
                          <Tag color="cyan" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                            {p.englishName}
                          </Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Tag color={roleColor} style={{ margin: 0, fontSize: 11 }}>
                          {roleName}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {targetKey}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {isSelecting ? (
                    <Spin size="small" />
                  ) : (
                    <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                  )}
                </div>
              );
            })}
          </div>

          <Button
            block
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setCandidateProfiles(null);
              setPendingCredentials(null);
              setAuthError('');
            }}
            style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
          >
            {language === 'en' ? 'Back to Login Form' : 'Quay Lại Form Đăng Nhập'}
          </Button>
        </div>
      ) : (
        <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src={LANDING_ASSETS.iconLaptopCap}
          alt="LAK EDUCATION"
          style={{ width: 52, height: 52, objectFit: 'contain', marginBottom: 10 }}
        />
        <Title level={3} style={{ margin: '0 0 4px 0', color: '#122B4D', fontWeight: 800 }}>
          {language === 'en' ? 'Welcome Back' : 'Đăng Nhập'}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {language === 'en'
            ? 'Sign in to your LAK EDUCATION account'
            : 'Đăng nhập vào tài khoản LAK EDUCATION của bạn'}
        </Text>
      </div>

      {authError && (
        <Alert
          type="error"
          showIcon
          message={authError}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setAuthError('')}
        />
      )}

      {/* 1. Đăng nhập bằng Google */}
      <Button
        size="large"
        block
        loading={loadingGoogle}
        onClick={handleGoogleSignIn}
        style={{
          height: 46,
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 15,
          color: '#1f2937',
          borderColor: '#d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <GoogleColorIcon />
        <span>
          {language === 'en' ? 'Continue with Google' : 'Đăng nhập bằng Google'}
        </span>
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <Text
          type="secondary"
          style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}
        >
          {language === 'en' ? 'or sign in with email / phone' : 'hoặc đăng nhập bằng email / số điện thoại'}
        </Text>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* 2. Đăng nhập bằng Email / Số điện thoại & Mật khẩu */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          remember: true,
        }}
        onFinish={handleEmailSignIn}
        requiredMark={false}
      >
        <Form.Item
          name="identifier"
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text strong>
                {language === 'en' ? 'Email or Phone Number' : 'Email hoặc Số điện thoại'}
              </Text>
              {detectedType === 'phone' && (
                <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>
                  📱 {language === 'en' ? 'Student Phone' : 'Số điện thoại'}
                </span>
              )}
              {detectedType === 'email' && (
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                  ✉️ {language === 'en' ? 'Email Account' : 'Tài khoản Email'}
                </span>
              )}
              {detectedType === 'code' && (
                <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                  🪪 {language === 'en' ? 'User ID' : 'Mã tài khoản'}
                </span>
              )}
            </div>
          }
          rules={[
            {
              required: true,
              message: language === 'en' ? 'Please enter your email or phone number' : 'Vui lòng nhập email hoặc số điện thoại',
            },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Input
            size="large"
            prefix={
              detectedType === 'phone' ? (
                <PhoneOutlined style={{ color: '#0891b2' }} />
              ) : detectedType === 'code' ? (
                <IdcardOutlined style={{ color: '#7c3aed' }} />
              ) : (
                <MailOutlined style={{ color: '#9ca3af' }} />
              )
            }
            placeholder={
              language === 'en'
                ? 'email@lakeducation.com or 0909xxxxxx'
                : 'email@lakeducation.com hoặc 0909xxxxxx'
            }
            style={{ borderRadius: 10 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Text strong>{language === 'en' ? 'Password' : 'Mật khẩu'}</Text>}
          rules={[
            {
              required: true,
              message: language === 'en' ? 'Please enter your password' : 'Vui lòng nhập mật khẩu',
            },
          ]}
          style={{ marginBottom: 14 }}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
            placeholder="••••••••"
            style={{ borderRadius: 10 }}
          />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{language === 'en' ? 'Remember me' : 'Ghi nhớ đăng nhập'}</Checkbox>
          </Form.Item>
          <Button type="link" size="small" style={{ padding: 0 }}>
            {language === 'en' ? 'Forgot password?' : 'Quên mật khẩu?'}
          </Button>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loadingEmail}
          icon={<LoginOutlined />}
          style={{
            height: 46,
            fontWeight: 700,
            fontSize: 15,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            boxShadow: '0 6px 16px rgba(24, 144, 255, 0.35)',
          }}
        >
          {language === 'en' ? 'Sign In' : 'Đăng Nhập'}
        </Button>
      </Form>
        </>
      )}
    </Modal>
  );
};
