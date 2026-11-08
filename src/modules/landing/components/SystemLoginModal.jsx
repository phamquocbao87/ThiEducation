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
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { LANDING_ASSETS } from '../models/landing.model';
import { useAuth } from '../../../core/context/AuthContext';
import { localizeSystemMessage } from '../../../core/i18n/i18n';

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

  // Tự động chuyển đổi ngôn ngữ thông báo lỗi khi người dùng đổi ngôn ngữ EN / VI
  useEffect(() => {
    if (authError) {
      setAuthError((prev) => localizeSystemMessage(prev, language));
    }
  }, [language]);

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
      const email = values.email?.trim();
      const password = values.password;
      const result = await loginWithEmail(email, password);
      if (result && result.success) {
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error('[Email SignIn Error]:', err);
      const localizedError = localizeSystemMessage(err.message || 'Tài khoản hoặc mật khẩu không đúng.', language);
      setAuthError(localizedError);
      message.error(localizedError);
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="min(420px, calc(100vw - 24px))"
      centered
      style={{ maxWidth: 'calc(100vw - 24px)', margin: '0 auto' }}
      styles={{
        body: { padding: '12px 4px 6px' },
      }}
    >
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
          {language === 'en' ? 'or sign in with email' : 'hoặc đăng nhập bằng email'}
        </Text>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>

      {/* 2. Đăng nhập bằng Email / Password */}
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
          name="email"
          label={<Text strong>{language === 'en' ? 'Email' : 'Email'}</Text>}
          rules={[
            {
              required: true,
              message: language === 'en' ? 'Please enter your email' : 'Vui lòng nhập email của bạn',
            },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Input
            size="large"
            prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
            placeholder="name@lakeducation.com"
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
    </Modal>
  );
};
