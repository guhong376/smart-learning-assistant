import React, { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  Modal,
  Radio,
  Space,
  Switch,
  Tag,
  Typography,
  message
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  FolderOutlined,
  LockOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Page } from '../ui/Page';
import { useSettings } from '../features/settings/useSettings';
import { useAuth } from '../features/auth/useAuth';

export function SettingsPage() {
  const navigate = useNavigate();
  const settingsHook = useSettings();
  const auth = useAuth();
  const [dataDirModalVisible, setDataDirModalVisible] = useState(false);
  const [tempDataDir, setTempDataDir] = useState(settingsHook.settings.dataDirectory);

  const handleSelectDataDirectory = () => {
    // Mock: 实际应使用 Electron dialog 选择目录
    const dir = prompt('请输入数据目录路径:', settingsHook.settings.dataDirectory || '');
    if (dir !== null) {
      setTempDataDir(dir);
      settingsHook.updateSettings({ dataDirectory: dir });
      message.success('数据目录已更新');
    }
  };

  const handleSyncLogin = () => {
    Modal.info({
      title: '多端同步',
      content: '此功能需要后端/云端支持。',
      okText: '知道了'
    });
  };

  const handleDeviceBinding = () => {
    Modal.info({
      title: '设备绑定',
      content: `当前设备 ID: ${settingsHook.settings.deviceId || '未生成'}\n\n此功能需要后端支持。`,
      okText: '知道了'
    });
  };

  const handleDataEncryption = () => {
    Modal.info({
      title: '数据加密',
      content: '此功能需要本地/后端加密策略支持。',
      okText: '知道了'
    });
  };

  return (
    <Page title="设置" subtitle="外观、同步、隐私与数据">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 账号信息 */}
        <Card title="账号信息">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined />
                  <span>用户名</span>
                </Space>
              }
            >
              <Space>
                <Typography.Text strong>{auth.user?.username}</Typography.Text>
                {auth.user?.email && (
                  <Typography.Text type="secondary">({auth.user.email})</Typography.Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {auth.user?.createdAt ? (
                <Typography.Text>
                  {new Date(auth.user.createdAt).toLocaleString('zh-CN')}
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">未知</Typography.Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="操作">
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认退出',
                    content: '确定要退出登录吗？',
                    onOk: () => {
                      auth.logout();
                      navigate('/login');
                    }
                  });
                }}
              >
                退出登录
              </Button>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 外观设置 */}
        <Card title="外观设置">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item
              label={
                <Space>
                  <span>夜间模式</span>
                </Space>
              }
            >
              <Switch
                checked={settingsHook.settings.theme === 'dark'}
                onChange={(checked) => {
                  settingsHook.updateSettings({ theme: checked ? 'dark' : 'light' });
                  message.success(`已切换到${checked ? '夜间' : '日间'}模式`);
                }}
              />
              <Typography.Text type="secondary" style={{ marginLeft: 12 }}>
                {settingsHook.settings.theme === 'dark' ? '当前为夜间模式' : '当前为日间模式'}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="字体大小">
              <Radio.Group
                value={settingsHook.settings.fontSize}
                onChange={(e) => {
                  settingsHook.updateSettings({ fontSize: e.target.value });
                  message.success('字体大小已更新');
                }}
              >
                <Radio value="small">小</Radio>
                <Radio value="medium">中</Radio>
                <Radio value="large">大</Radio>
              </Radio.Group>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 数据与存储 */}
        <Card title="数据与存储">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item
              label={
                <Space>
                  <FolderOutlined />
                  <span>数据目录</span>
                </Space>
              }
            >
              <Space>
                <Input
                  value={settingsHook.settings.dataDirectory || '未设置'}
                  readOnly
                  style={{ width: 400 }}
                  placeholder="数据存储目录"
                />
                <Button onClick={handleSelectDataDirectory}>选择目录</Button>
              </Space>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                文档、索引、缓存等数据将存储在此目录
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="导出数据">
              <Space>
                <Button icon={<DownloadOutlined />} onClick={settingsHook.exportData}>
                  导出所有数据
                </Button>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  导出设置、计划、答案等数据为 JSON 文件
                </Typography.Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="清理缓存">
              <Space>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={settingsHook.clearCache}
                >
                  清理缓存
                </Button>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  清理临时文件和缓存数据
                </Typography.Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 同步与账号 */}
        <Card title="同步与账号">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item
              label={
                <Space>
                  <SyncOutlined />
                  <span>多端同步</span>
                </Space>
              }
            >
              <Space>
                <Switch
                  checked={settingsHook.settings.syncEnabled}
                  onChange={(checked) => {
                    if (checked) {
                      handleSyncLogin();
                    } else {
                      settingsHook.updateSettings({ syncEnabled: false, syncAccount: undefined });
                      message.info('已关闭多端同步');
                    }
                  }}
                />
                {settingsHook.settings.syncEnabled ? (
                  <Space>
                    <Tag color="success">已启用</Tag>
                    {settingsHook.settings.syncAccount ? (
                      <Typography.Text>
                        <UserOutlined /> {settingsHook.settings.syncAccount}
                      </Typography.Text>
                    ) : (
                      <Button type="link" size="small" onClick={handleSyncLogin}>
                        登录账号
                      </Button>
                    )}
                  </Space>
                ) : (
                  <Tag>未启用</Tag>
                )}
              </Space>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                待接入
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined />
                  <span>设备绑定</span>
                </Space>
              }
            >
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleDeviceBinding}>
                  查看/绑定设备
                </Button>
                {settingsHook.settings.deviceId && (
                  <Tag color="blue">设备 ID: {settingsHook.settings.deviceId.substring(0, 8)}...</Tag>
                )}
              </Space>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                绑定设备以保障数据安全（需要后端支持）
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 隐私与安全 */}
        <Card title="隐私与安全">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item
              label={
                <Space>
                  <LockOutlined />
                  <span>数据加密</span>
                </Space>
              }
            >
              <Space>
                <Switch
                  checked={settingsHook.settings.dataEncryption}
                  onChange={(checked) => {
                    if (checked) {
                      handleDataEncryption();
                    } else {
                      settingsHook.updateSettings({ dataEncryption: false });
                      message.info('已关闭数据加密');
                    }
                  }}
                />
                {settingsHook.settings.dataEncryption ? (
                  <Tag color="success">已启用</Tag>
                ) : (
                  <Tag>未启用</Tag>
                )}
              </Space>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                待接入
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 重置设置 */}
        <Card>
          <Space>
            <Button danger onClick={() => {
              Modal.confirm({
                title: '确认重置',
                content: '确定要重置所有设置吗？此操作不可恢复。',
                onOk: () => {
                  settingsHook.resetSettings();
                  message.success('设置已重置');
                }
              });
            }}>
              重置所有设置
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              恢复默认设置
            </Typography.Text>
          </Space>
        </Card>
      </Space>
    </Page>
  );
}
