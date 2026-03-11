import React, { useMemo, useState } from 'react';
import { Layout, Menu, Typography, Dropdown, Space, Avatar } from 'antd';
import {
  AppstoreOutlined,
  CameraOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  ReadOutlined,
  SettingOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

const { Sider, Header, Content } = Layout;

type NavKey =
  | '/dashboard'
  | '/import'
  | '/photo-search'
  | '/resources'
  | '/plan'
  | '/feynman'
  | '/reports'
  | '/settings';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = useMemo<NavKey>(() => {
    const p = location.pathname as NavKey;
    const all: NavKey[] = [
      '/dashboard',
      '/import',
      '/photo-search',
      '/resources',
      '/plan',
      '/feynman',
      '/reports',
      '/settings'
    ];
    return all.includes(p) ? p : '/dashboard';
  }, [location.pathname]);

  return (
    <Layout className="sla-app">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ padding: 14 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {collapsed ? 'SLA' : '智能学习助手'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: '/dashboard', icon: <AppstoreOutlined />, label: '总览' },
            { key: '/import', icon: <FileAddOutlined />, label: '资料导入与解析' },
            { key: '/photo-search', icon: <CameraOutlined />, label: '拍题反向检索' },
            { key: '/resources', icon: <ReadOutlined />, label: '第三方资源整合' },
            { key: '/plan', icon: <ThunderboltOutlined />, label: '复习计划' },
            { key: '/feynman', icon: <FileSearchOutlined />, label: '费曼问答' },
            { key: '/reports', icon: <LineChartOutlined />, label: '学习报告' },
            { key: '/settings', icon: <SettingOutlined />, label: '设置' }
          ]}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {auth.user && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: auth.user.username
                  },
                  {
                    key: 'settings',
                    icon: <SettingOutlined />,
                    label: '设置',
                    onClick: () => navigate('/settings')
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    danger: true,
                    onClick: () => {
                      auth.logout();
                      navigate('/login');
                    }
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer', padding: '0 12px' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                {!collapsed && (
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {auth.user.username}
                  </Typography.Text>
                )}
              </Space>
            </Dropdown>
          )}
        </Header>
        <Content className="sla-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}


