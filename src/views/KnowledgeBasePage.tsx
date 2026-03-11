import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tree,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { Page } from '../ui/Page';
import { useKnowledgeBase } from '../features/kb/useKnowledgeBase';
import type { DocumentItem, KnowledgeTag, VectorStatus } from '../features/kb/types';

export function KnowledgeBasePage() {
  const kb = useKnowledgeBase();
  const [filterStatus, setFilterStatus] = useState<VectorStatus | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [tagDrawerVisible, setTagDrawerVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<KnowledgeTag | null>(null);
  const [tagForm] = Form.useForm();
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeForm] = Form.useForm();

  const filteredDocs = useMemo(() => {
    let docs = kb.documents;
    if (filterStatus !== 'all') docs = docs.filter((d) => d.vectorStatus === filterStatus);
    if (filterSubject !== 'all') docs = docs.filter((d) => d.subject === filterSubject);
    if (filterChapter !== 'all') docs = docs.filter((d) => d.chapter === filterChapter);
    return docs;
  }, [kb.documents, filterStatus, filterSubject, filterChapter]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    kb.documents.forEach((d) => {
      if (d.subject) set.add(d.subject);
    });
    return Array.from(set);
  }, [kb.documents]);

  const chapters = useMemo(() => {
    const set = new Set<string>();
    kb.documents.forEach((d) => {
      if (d.chapter) set.add(d.chapter);
    });
    return Array.from(set);
  }, [kb.documents]);

  const statusCounts = useMemo(() => {
    return {
      indexed: kb.byStatus.indexed.length,
      pending: kb.byStatus.pending.length,
      failed: kb.byStatus.failed.length,
      processing: kb.byStatus.processing.length
    };
  }, [kb.byStatus]);

  const handleRetry = (doc: DocumentItem) => {
    kb.retryIndex(doc.id);
    message.info('正在重新索引...');
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    tagForm.resetFields();
    setTagDrawerVisible(true);
  };

  const handleEditTag = (tag: KnowledgeTag) => {
    setEditingTag(tag);
    tagForm.setFieldsValue({
      name: tag.name,
      alias: tag.alias?.join(',') || '',
      parentId: tag.parentId || undefined
    });
    setTagDrawerVisible(true);
  };

  const handleSaveTag = () => {
    tagForm.validateFields().then((values) => {
      if (editingTag) {
        kb.updateTag(editingTag.id, {
          name: values.name,
          alias: values.alias ? values.alias.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          parentId: values.parentId
        });
        message.success('标签已更新');
      } else {
        kb.createTag({
          name: values.name,
          alias: values.alias ? values.alias.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          parentId: values.parentId,
          level: values.parentId ? 2 : 1
        });
        message.success('标签已创建');
      }
      setTagDrawerVisible(false);
      setEditingTag(null);
    });
  };

  const handleMergeTags = () => {
    mergeForm.validateFields().then((values) => {
      kb.mergeTags(values.sourceId, values.targetId);
      message.success('标签已合并');
      setMergeModalVisible(false);
      mergeForm.resetFields();
    });
  };

  const columns: ColumnsType<DocumentItem> = [
    {
      title: '文档',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{text}</Typography.Text>
          <Space size={4} wrap>
            <Tag color="blue">{record.type.toUpperCase()}</Tag>
            {record.subject && <Tag>{record.subject}</Tag>}
            {record.chapter && <Tag color="purple">{record.chapter}</Tag>}
          </Space>
        </Space>
      )
    },
    {
      title: '向量状态',
      dataIndex: 'vectorStatus',
      key: 'vectorStatus',
      width: 120,
      render: (status: VectorStatus, record) => {
        const statusConfig = {
          indexed: { icon: <CheckCircleOutlined />, color: 'success', text: '已索引' },
          pending: { icon: <ClockCircleOutlined />, color: 'warning', text: '待索引' },
          failed: { icon: <CloseCircleOutlined />, color: 'error', text: '失败' },
          processing: { icon: <SyncOutlined spin />, color: 'processing', text: '处理中' }
        };
        const cfg = statusConfig[status];
        return (
          <Space direction="vertical" size={2}>
            <Tag color={cfg.color} icon={cfg.icon}>
              {cfg.text}
            </Tag>
            {record.errorMessage && (
              <Typography.Text type="danger" style={{ fontSize: 11 }}>
                {record.errorMessage}
              </Typography.Text>
            )}
          </Space>
        );
      }
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoints',
      key: 'knowledgePoints',
      render: (points: string[]) => (
        <Space wrap size={4}>
          {points.length > 0 ? (
            points.map((kp) => (
              <Tag key={kp} color="purple" style={{ margin: 0, fontSize: 11 }}>
                {kp}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              未关联
            </Typography.Text>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.vectorStatus === 'failed' && (
            <Button type="link" size="small" onClick={() => handleRetry(record)}>
              重试
            </Button>
          )}
        </Space>
      )
    }
  ];

  const tagTreeData = useMemo(() => {
    const buildTree = (tags: KnowledgeTag[], parentId?: string): any[] => {
      return tags
        .filter((t) => t.parentId === parentId)
        .map((t) => ({
          title: (
            <Space>
              <Typography.Text>{t.name}</Typography.Text>
              {t.alias && t.alias.length > 0 && (
                <Tag color="default" style={{ fontSize: 11 }}>
                  别名: {t.alias.join(', ')}
                </Tag>
              )}
              <Tag color="blue" style={{ fontSize: 11 }}>
                {t.documentCount} 文档
              </Tag>
            </Space>
          ),
          key: t.id,
          children: buildTree(tags, t.id)
        }));
    };
    return buildTree(kb.tags);
  }, [kb.tags]);

  return (
    <Page title="知识库与标签" subtitle="向量库/文档库的可视化管理入口">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Space direction="vertical" size={4}>
                <Typography.Text type="secondary">已索引</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                  {statusCounts.indexed}
                </Typography.Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Space direction="vertical" size={4}>
                <Typography.Text type="secondary">待索引</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: '#faad14' }}>
                  {statusCounts.pending}
                </Typography.Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Space direction="vertical" size={4}>
                <Typography.Text type="secondary">失败</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                  {statusCounts.failed}
                </Typography.Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Space direction="vertical" size={4}>
                <Typography.Text type="secondary">处理中</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {statusCounts.processing}
                </Typography.Title>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <Card>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="筛选状态"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '已索引', value: 'indexed' },
                  { label: '待索引', value: 'pending' },
                  { label: '失败', value: 'failed' },
                  { label: '处理中', value: 'processing' }
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="筛选学科"
                value={filterSubject}
                onChange={setFilterSubject}
                options={[{ label: '全部', value: 'all' }, ...subjects.map((s) => ({ label: s, value: s }))]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="筛选章节"
                value={filterChapter}
                onChange={setFilterChapter}
                options={[{ label: '全部', value: 'all' }, ...chapters.map((c) => ({ label: c, value: c }))]}
              />
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Space>
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => kb.triggerRebuild()}>
                  重建索引
                </Button>
                <Button icon={<SyncOutlined />} onClick={() => kb.triggerOptimize()}>
                  优化索引
                </Button>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  索引任务：{kb.indexTasks.filter((t) => t.status === 'running').length} 个进行中
                </Typography.Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 索引任务列表 */}
        {kb.indexTasks.length > 0 && (
          <Card size="small">
            <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
              索引任务
            </Typography.Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {kb.indexTasks.map((task) => (
                <div key={task.id}>
                  <Space>
                    <Typography.Text strong>
                      {task.type === 'rebuild' ? '重建索引' : task.type === 'optimize' ? '优化索引' : '增量更新'}
                    </Typography.Text>
                    <Tag color={task.status === 'running' ? 'processing' : task.status === 'completed' ? 'success' : 'default'}>
                      {task.status === 'running' ? '进行中' : task.status === 'completed' ? '已完成' : '待处理'}
                    </Tag>
                    {task.progress !== undefined && (
                      <Progress percent={task.progress} size="small" style={{ width: 200 }} />
                    )}
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        )}

        <Row gutter={16}>
          {/* 资料列表 */}
          <Col xs={24} lg={16}>
            <Card>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                资料列表 ({filteredDocs.length})
              </Typography.Title>
              <Table
                columns={columns}
                dataSource={filteredDocs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>

          {/* 知识点标签树 */}
          <Col xs={24} lg={8}>
            <Card
              title="知识点标签体系"
              extra={
                <Space>
                  <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleCreateTag}>
                    创建
                  </Button>
                  <Button type="link" size="small" icon={<MergeCellsOutlined />} onClick={() => setMergeModalVisible(true)}>
                    合并
                  </Button>
                </Space>
              }
            >
              <Tree
                showLine
                defaultExpandAll
                treeData={tagTreeData}
                titleRender={(node) => (
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>{node.title}</span>
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          const tag = kb.tags.find((t) => t.id === node.key);
                          if (tag) handleEditTag(tag);
                        }}
                      />
                    </Space>
                  </Space>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      {/* 标签编辑抽屉 */}
      <Drawer
        title={editingTag ? '编辑标签' : '创建标签'}
        open={tagDrawerVisible}
        onClose={() => {
          setTagDrawerVisible(false);
          setEditingTag(null);
          tagForm.resetFields();
        }}
        width={400}
        extra={
          <Button type="primary" onClick={handleSaveTag}>
            保存
          </Button>
        }
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item label="标签名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：导数" />
          </Form.Item>
          <Form.Item label="别名（用逗号分隔）" name="alias">
            <Input placeholder="例如：微商,导函数" />
          </Form.Item>
          <Form.Item label="父标签" name="parentId">
            <Select
              placeholder="选择父标签（可选，用于层级）"
              allowClear
              options={kb.tags.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 合并标签弹窗 */}
      <Modal
        title="合并标签"
        open={mergeModalVisible}
        onOk={handleMergeTags}
        onCancel={() => {
          setMergeModalVisible(false);
          mergeForm.resetFields();
        }}
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item label="源标签（将被合并）" name="sourceId" rules={[{ required: true }]}>
            <Select
              placeholder="选择要合并的标签"
              options={kb.tags.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
          <Form.Item label="目标标签（保留）" name="targetId" rules={[{ required: true }]}>
            <Select
              placeholder="选择保留的标签"
              options={kb.tags.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            源标签的别名和文档将合并到目标标签
          </Typography.Text>
        </Form>
      </Modal>
    </Page>
  );
}
