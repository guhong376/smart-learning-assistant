import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import { PlusOutlined, LinkOutlined, PlayCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { Page } from '../ui/Page';
import { useResources } from '../features/resources/useResources';
import { ResourceCard } from '../features/resources/ResourceCard';
import type { AnyResource, BilibiliResource, ZhihuResource, Keyframe, ResourceHistoryEntry } from '../features/resources/types';
import { useKnowledgeCatalog } from '../features/catalog/useKnowledgeCatalog';
import { useSearchParams } from 'react-router-dom';

export function ResourcesPage() {
  const resources = useResources();
  const catalog = useKnowledgeCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<AnyResource | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    const openId = searchParams.get('open');
    if (openId) {
      const r = resources.resources.find((x) => x.id === openId);
      if (r) {
        // 打开编辑抽屉并记录一次“跳转”历史，方便录屏展示
        handleEdit(r);
        resources.recordJump(r.id);
        // 清掉 open，避免每次刷新都重复记录
        const next = new URLSearchParams(searchParams);
        next.delete('open');
        setSearchParams(next, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, resources.resources]);

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const res = resources.add(values.url, values.type);
      if (res) {
        message.success('资源添加成功');
        setAddModalVisible(false);
        form.resetFields();
        // 自动打开编辑抽屉
        setEditingResource(res);
        setEditDrawerVisible(true);
      } else {
        message.error('无法解析该链接，请检查 URL 格式');
      }
    });
  };

  const handleEdit = (resource: AnyResource) => {
    setEditingResource(resource);
    const baseFields: any = {
      title: resource.title,
      description: resource.description || '',
      knowledgePoints: resource.knowledgePoints,
      tags: resource.tags
    };
    if (resource.type === 'zhihu') {
      const zr = resource as ZhihuResource;
      baseFields.summary = zr.summary || '';
      baseFields.viewpoints = zr.viewpoints || [];
    }
    editForm.setFieldsValue(baseFields);
    setEditDrawerVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingResource) return;
    editForm.validateFields().then((values) => {
      const update: Partial<AnyResource> = {
        title: values.title,
        description: values.description,
        knowledgePoints: values.knowledgePoints || [],
        tags: values.tags || []
      };
      if (editingResource.type === 'zhihu') {
        (update as Partial<ZhihuResource>).summary = values.summary || '';
        (update as Partial<ZhihuResource>).viewpoints = values.viewpoints || [];
      }
      resources.update(editingResource.id, update);
      message.success('保存成功');
      setEditDrawerVisible(false);
      setEditingResource(null);
    });
  };

  const handleAddKeyframe = () => {
    if (!editingResource || editingResource.type !== 'bilibili') return;
    editForm.validateFields(['keyframe']).then((values) => {
      const kf: Keyframe = {
        id: `kf_${Date.now()}`,
        timestamp: values.keyframe.timestamp,
        label: values.keyframe.label,
        knowledgePoint: values.keyframe.knowledgePoint
      };
      resources.addKeyframe(editingResource.id, kf);
      editForm.setFieldsValue({ keyframe: { timestamp: '', label: '', knowledgePoint: undefined } });
      message.success('关键帧已添加');
    });
  };

  const handleJump = (resource: AnyResource) => {
    if (resource.type === 'bilibili' || resource.type === 'zhihu' || resource.type === 'other') {
      resources.recordJump(resource.id);
      window.open(resource.url, '_blank');
    } else {
      message.info('笔记应用跳转需要 Electron 支持（待实现）');
    }
  };

  const historyLabel = (h: ResourceHistoryEntry) => {
    switch (h.action) {
      case 'add':
        return '添加';
      case 'update':
        return '更新';
      case 'delete':
        return '删除';
      case 'jump':
        return '跳转';
      default:
        return h.action;
    }
  };

  const bilibiliResources = useMemo(() => resources.byType.bilibili || [], [resources.byType]);
  const zhihuResources = useMemo(() => resources.byType.zhihu || [], [resources.byType]);
  const noteResources = useMemo(() => resources.byType.note || [], [resources.byType]);
  const otherResources = useMemo(() => resources.byType.other || [], [resources.byType]);

  const allKnowledgePoints = useMemo(() => catalog.flatKnowledge.map((kp) => ({ label: kp.title, value: kp.key })), [catalog]);

  return (
    <Page title="第三方资源整合" subtitle="B站 / 知乎 / 笔记应用联动与知识点关联">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
              添加资源
            </Button>
            <Typography.Text type="secondary">
              支持 B站视频、知乎文章、笔记应用链接导入
            </Typography.Text>
          </Space>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          items={[
            {
              key: 'all',
              label: `全部 (${resources.resources.length})`,
              children: (
                <div>
                  {resources.resources.length === 0 ? (
                    <Card>
                      <Typography.Text type="secondary">暂无资源，点击上方"添加资源"开始导入</Typography.Text>
                    </Card>
                  ) : (
                    resources.resources.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        onEdit={() => handleEdit(r)}
                        onDelete={() => {
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除资源"${r.title}"吗？`,
                            onOk: () => {
                              resources.remove(r.id);
                              message.success('已删除');
                            }
                          });
                        }}
                        onJump={() => handleJump(r)}
                      />
                    ))
                  )}
                </div>
              )
            },
            {
              key: 'history',
              label: `历史 (${resources.history.length})`,
              children: (
                <Card>
                  {resources.history.length === 0 ? (
                    <Typography.Text type="secondary">暂无历史记录</Typography.Text>
                  ) : (
                    <List
                      size="small"
                      dataSource={resources.history}
                      renderItem={(h) => (
                        <List.Item
                          actions={[
                            h.url ? (
                              <Button
                                key="open"
                                size="small"
                                type="primary"
                                onClick={() => window.open(h.url!, '_blank')}
                              >
                                打开
                              </Button>
                            ) : null
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space wrap>
                                <Tag color={h.action === 'jump' ? 'blue' : h.action === 'delete' ? 'red' : 'purple'}>
                                  {historyLabel(h)}
                                </Tag>
                                <Typography.Text strong>{h.title}</Typography.Text>
                              </Space>
                            }
                            description={
                              <Space wrap>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  {new Date(h.ts).toLocaleString()}
                                </Typography.Text>
                                {h.url ? <Tag>{h.url}</Tag> : null}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              )
            },
            {
              key: 'bilibili',
              label: (
                <Space>
                  <PlayCircleOutlined />
                  B站 ({bilibiliResources.length})
                </Space>
              ),
              children: (
                <div>
                  {bilibiliResources.length === 0 ? (
                    <Card>
                      <Typography.Text type="secondary">暂无 B站视频资源</Typography.Text>
                    </Card>
                  ) : (
                    bilibiliResources.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        onEdit={() => handleEdit(r)}
                        onDelete={() => {
                          Modal.confirm({
                            title: '确认删除',
                            onOk: () => {
                              resources.remove(r.id);
                              message.success('已删除');
                            }
                          });
                        }}
                        onJump={() => handleJump(r)}
                      />
                    ))
                  )}
                </div>
              )
            },
            {
              key: 'zhihu',
              label: (
                <Space>
                  <FileTextOutlined />
                  知乎 ({zhihuResources.length})
                </Space>
              ),
              children: (
                <div>
                  {zhihuResources.length === 0 ? (
                    <Card>
                      <Typography.Text type="secondary">暂无知乎文章资源</Typography.Text>
                    </Card>
                  ) : (
                    zhihuResources.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        onEdit={() => handleEdit(r)}
                        onDelete={() => {
                          Modal.confirm({
                            title: '确认删除',
                            onOk: () => {
                              resources.remove(r.id);
                              message.success('已删除');
                            }
                          });
                        }}
                        onJump={() => handleJump(r)}
                      />
                    ))
                  )}
                </div>
              )
            },
            {
              key: 'note',
              label: `笔记 (${noteResources.length})`,
              children: (
                <div>
                  {noteResources.length === 0 ? (
                    <Card>
                      <Typography.Text type="secondary">暂无笔记资源</Typography.Text>
                    </Card>
                  ) : (
                    noteResources.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        onEdit={() => handleEdit(r)}
                        onDelete={() => {
                          Modal.confirm({
                            title: '确认删除',
                            onOk: () => {
                              resources.remove(r.id);
                              message.success('已删除');
                            }
                          });
                        }}
                        onJump={() => handleJump(r)}
                      />
                    ))
                  )}
                </div>
              )
            }
          ]}
        />
      </Space>

      {/* 添加资源弹窗 */}
      <Modal
        title="添加资源"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="资源类型" name="type">
            <Select
              placeholder="选择类型（可选，系统会自动识别）"
              options={[
                { label: '自动识别', value: undefined },
                { label: 'B站视频', value: 'bilibili' },
                { label: '知乎文章', value: 'zhihu' },
                { label: '笔记应用', value: 'note' },
                { label: '其他', value: 'other' }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="资源链接"
            name="url"
            rules={[{ required: true, message: '请输入资源链接' }]}
          >
            <Input
              placeholder="例如：https://www.bilibili.com/video/BVxxxxx 或 https://zhuanlan.zhihu.com/p/xxxxx"
              prefix={<LinkOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑资源抽屉 */}
      <Drawer
        title={editingResource ? `编辑：${editingResource.title}` : '编辑资源'}
        open={editDrawerVisible}
        onClose={() => {
          setEditDrawerVisible(false);
          setEditingResource(null);
          editForm.resetFields();
        }}
        width={600}
        extra={
          <Button type="primary" onClick={handleSaveEdit}>
            保存
          </Button>
        }
      >
        {editingResource && (
          <Form form={editForm} layout="vertical">
            <Form.Item label="标题" name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} placeholder="资源描述（可选）" />
            </Form.Item>
            <Form.Item label="关联知识点" name="knowledgePoints">
              <Select
                mode="multiple"
                placeholder="选择知识点"
                        options={allKnowledgePoints}
                        showSearch
                        filterOption={(input, option) => {
                          const label = typeof option?.label === 'string' ? option.label : String(option?.label ?? '');
                          return label.toLowerCase().includes(input.toLowerCase());
                        }}
              />
            </Form.Item>
            <Form.Item label="标签" name="tags">
              <Select mode="tags" placeholder="输入标签，回车添加" />
            </Form.Item>

            {/* B站：关键帧标注 */}
            {editingResource.type === 'bilibili' && (
              <>
                <Typography.Title level={5}>关键帧标注</Typography.Title>
                <List
                  size="small"
                  bordered
                  dataSource={(editingResource as BilibiliResource).keyframes}
                  renderItem={(kf) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => {
                            resources.removeKeyframe(editingResource.id, kf.id);
                            message.success('已删除关键帧');
                          }}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <Space>
                        <Tag color="blue">{formatTime(kf.timestamp)}</Tag>
                        <Typography.Text>{kf.label}</Typography.Text>
                        {kf.knowledgePoint && <Tag color="purple">{kf.knowledgePoint}</Tag>}
                      </Space>
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无关键帧' }}
                />
                <Form.Item label="添加关键帧" style={{ marginTop: 16 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name={['keyframe', 'timestamp']} noStyle rules={[{ required: true }]}>
                      <InputNumber
                        placeholder="时间（秒）"
                        min={0}
                        style={{ width: '30%' }}
                      />
                    </Form.Item>
                    <Form.Item name={['keyframe', 'label']} noStyle rules={[{ required: true }]}>
                      <Input placeholder="标注内容" style={{ width: '40%' }} />
                    </Form.Item>
                    <Form.Item name={['keyframe', 'knowledgePoint']} noStyle>
                      <Select
                        placeholder="知识点（可选）"
                        options={allKnowledgePoints}
                        showSearch
                        style={{ width: '30%' }}
                      />
                    </Form.Item>
                    <Button type="primary" onClick={handleAddKeyframe}>
                      添加
                    </Button>
                  </Space.Compact>
                </Form.Item>
              </>
            )}

            {/* 知乎：摘要和观点 */}
            {editingResource.type === 'zhihu' && (
              <>
                <Form.Item label="摘要" name="summary">
                  <Input.TextArea rows={4} placeholder="文章摘要" />
                </Form.Item>
                <Form.Item label="核心观点" name="viewpoints">
                  <Select mode="tags" placeholder="输入观点，回车添加" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Drawer>
    </Page>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
