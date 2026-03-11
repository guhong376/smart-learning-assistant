import React, { useState } from 'react';
import { Button, Card, Form, Input, Space, Tabs, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import type { LoginCredentials, RegisterData } from '../features/auth/types';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLogin = async (values: LoginCredentials) => {
    const result = await auth.login(values);
    if (result.success) {
      message.success('登录成功');
      navigate('/dashboard');
    } else {
      message.error(result.error || '登录失败');
    }
  };

  const handleRegister = async (values: RegisterData) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    const result = await auth.register(values);
    if (result.success) {
      message.success('注册成功');
      navigate('/dashboard');
    } else {
      message.error(result.error || '注册失败');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, var(--theme-gradient-from, #667eea) 0%, var(--theme-gradient-mid, #8b5cf6) 50%, var(--theme-gradient-to, #764ba2) 100%)`,
        padding: '20px'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              智能学习助手
            </Typography.Title>
            <Typography.Text type="secondary">欢迎使用</Typography.Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as 'login' | 'register');
              loginForm.resetFields();
              registerForm.resetFields();
            }}
            items={[
              {
                key: 'login',
                label: '登录'
              },
              {
                key: 'register',
                label: '注册'
              }
            ]}
          />

          {activeTab === 'login' ? (
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={handleLogin}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={auth.loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              form={registerForm}
              layout="vertical"
              onFinish={handleRegister}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名长度至少3位' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名（至少3位）"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="email"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱（可选）"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度至少6位' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码（至少6位）"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    }
                  })
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={auth.loading}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          )}

          <Typography.Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
            登录后可使用全部功能
          </Typography.Text>
        </Space>
      </Card>
    </div>
  );
}

