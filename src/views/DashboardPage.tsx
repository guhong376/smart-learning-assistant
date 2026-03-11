import React, { useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography
} from 'antd';
import {
  ArrowRightOutlined,
  FileAddOutlined,
  CameraOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Page } from '../ui/Page';
import { usePlan } from '../features/plan/usePlan';
import { useKnowledgeBase } from '../features/kb/useKnowledgeBase';
import { useReports } from '../features/reports/useReports';
import { useFeynman } from '../features/feynman/useFeynman';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function DashboardPage() {
  const navigate = useNavigate();
  const plan = usePlan();
  const kb = useKnowledgeBase();
  const reports = useReports();
  const feynman = useFeynman();

  const todayTasks = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return plan.tasksByDate[today] || [];
  }, [plan.tasksByDate]);

  const todayDone = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'done').length;
  }, [todayTasks]);

  const greeting = useMemo(() => {
    const h = dayjs().hour();
    if (h < 6) return '凌晨好';
    if (h < 12) return '上午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }, []);

  const todayTotalMinutes = useMemo(() => todayTasks.reduce((sum, t) => sum + t.minutes, 0), [todayTasks]);
  const todayDoneMinutes = useMemo(
    () => todayTasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + t.minutes, 0),
    [todayTasks]
  );

  const quickActions = [
    {
      key: 'import',
      title: '资料导入',
      icon: <FileAddOutlined />,
      color: '#3b82f6',
      path: '/import',
      description: '上传 PPT、录音、笔记等'
    },
    {
      key: 'photo-search',
      title: '拍题检索',
      icon: <CameraOutlined />,
      color: '#60a5fa',
      path: '/photo-search',
      description: '拍照搜题，快速定位'
    },
    {
      key: 'plan',
      title: '复习计划',
      icon: <ThunderboltOutlined />,
      color: '#8b5cf6',
      path: '/plan',
      description: '查看今日任务'
    },
    {
      key: 'feynman',
      title: '费曼问答',
      icon: <FileSearchOutlined />,
      color: '#ec4899',
      path: '/feynman',
      description: 'AI 提问练习'
    }
  ];

  const recentActivities = useMemo(() => {
    const activities: Array<{ id: string; type: string; title: string; time: string; ts: number; path: string }> = [];
    
    // 最近的答案
    feynman.answers.slice(-3).reverse().forEach((ans) => {
      const ts = new Date(ans.createdAt).getTime();
      activities.push({
        id: `ans_${ans.id}`,
        type: 'feynman',
        title: `费曼问答：${ans.content.substring(0, 30)}...`,
        time: dayjs(ans.createdAt).fromNow(),
        ts,
        path: '/feynman'
      });
    });

    // 最近的文档
    kb.documents.slice(-3).reverse().forEach((doc) => {
      const ts = new Date(doc.createdAt).getTime();
      activities.push({
        id: `doc_${doc.id}`,
        type: 'document',
        title: `文档：${doc.title}`,
        time: dayjs(doc.createdAt).fromNow(),
        ts,
        path: '/kb'
      });
    });

    return activities.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [feynman.answers, kb.documents]);

  return (
    <Page title="总览" subtitle="把学习数据、计划与检索入口集中在一个地方">
      <div className="sla-dashboard">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 顶部横幅 */}
          <Card className="sla-hero-card" bordered={false}>
            <div className="sla-hero-inner">
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {greeting}，{dayjs().format('M月D日')}
                </Typography.Title>
                <Typography.Text type="secondary">
                  今天计划学习 <strong>{todayTotalMinutes}</strong> 分钟，已完成 <strong>{todayDoneMinutes}</strong> 分钟
                </Typography.Text>
              </div>
              <Space wrap>
                <Tag color="blue">
                  <DatabaseOutlined /> 文档 {kb.byStatus.indexed.length}/{kb.documents.length}
                </Tag>
                <Tag color="purple">
                  <FireOutlined /> 薄弱点 {feynman.weakPoints.length}
                </Tag>
                <Button type="primary" onClick={() => navigate('/plan')} icon={<ArrowRightOutlined />}>
                  去看今日计划
                </Button>
              </Space>
            </div>
          </Card>

        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card className="sla-kpi-card sla-kpi-blue">
              <Statistic
                title="今日任务"
                value={todayDone}
                suffix={`/ ${todayTasks.length}`}
                valueStyle={{ color: '#3b82f6', fontWeight: 600 }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="sla-kpi-card sla-kpi-green">
              <Statistic
                title="已索引文档"
                value={kb.byStatus.indexed.length}
                suffix={`/ ${kb.documents.length}`}
                valueStyle={{ color: '#22c55e', fontWeight: 600 }}
                prefix={<FileAddOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="sla-kpi-card sla-kpi-red">
              <Statistic
                title="薄弱点"
                value={feynman.weakPoints.length}
                valueStyle={{ color: '#ef4444', fontWeight: 600 }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="sla-kpi-card sla-kpi-purple">
              <Statistic
                title="学习准确率"
                value={reports.metrics.feynmanAccuracy}
                suffix="%"
                valueStyle={{ color: '#8b5cf6', fontWeight: 600 }}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 快速入口 */}
        <Card title="快速入口" className="sla-section-card">
          <Row gutter={16}>
            {quickActions.map((action) => (
              <Col xs={24} sm={12} md={6} key={action.key}>
                <Card
                  hoverable
                  className="sla-quick-card"
                  style={{ ['--accent' as any]: action.color }}
                  onClick={() => navigate(action.path)}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div className="sla-quick-icon" style={{ color: action.color }}>
                      {action.icon}
                    </div>
                    <Typography.Text strong>{action.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {action.description}
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={16}>
          {/* 今日任务 */}
          <Col xs={24} lg={12}>
            <Card
              title="今日任务"
              extra={
                <Button type="link" size="small" onClick={() => navigate('/plan')}>
                  查看全部
                </Button>
              }
            >
              {todayTasks.length === 0 ? (
                <div style={{ padding: '12px 0' }}>
                  <Empty description="今日暂无任务" />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Button type="primary" onClick={() => navigate('/plan')}>
                      生成复习计划
                    </Button>
                  </div>
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={todayTasks.slice(0, 5)}
                  renderItem={(task) => (
                    <List.Item
                      actions={[
                        <Tag
                          key="status"
                          color={task.status === 'done' ? 'success' : 'processing'}
                        >
                          {task.status === 'done' ? '已完成' : '待完成'}
                        </Tag>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          task.status === 'done' ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <ClockCircleOutlined style={{ color: '#1890ff' }} />
                          )
                        }
                        title={
                          <Typography.Text delete={task.status === 'done'}>
                            {task.title}
                          </Typography.Text>
                        }
                        description={
                          <Space size="small">
                            <Tag color="blue">{task.subject}</Tag>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {task.minutes} 分钟
                            </Typography.Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 最近活动 */}
          <Col xs={24} lg={12}>
            <Card title="最近活动">
              {recentActivities.length === 0 ? (
                <Empty description="暂无活动记录" />
              ) : (
                <List
                  size="small"
                  dataSource={recentActivities}
                  renderItem={(activity) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(activity.path)}
                    >
                      <List.Item.Meta
                        avatar={
                          activity.type === 'feynman' ? (
                            <FileSearchOutlined style={{ color: '#ec4899' }} />
                          ) : (
                            <FileAddOutlined style={{ color: '#3b82f6' }} />
                          )
                        }
                        title={
                          <Typography.Text ellipsis style={{ fontSize: 13 }}>
                            {activity.title}
                          </Typography.Text>
                        }
                        description={
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {activity.time}
                          </Typography.Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '6px 0' }} />

        {/* 学习指标概览 */}
        <Card title="学习指标概览">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <div className="sla-kpi-card sla-kpi-blue">
                <Statistic
                  title="相关度"
                  value={reports.metrics.relevance}
                  suffix="%"
                  valueStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="sla-kpi-card sla-kpi-purple">
                <Statistic
                  title="强化次数"
                  value={reports.metrics.reinforcementCount}
                  valueStyle={{ color: '#8b5cf6', fontWeight: 600 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="sla-kpi-card sla-kpi-green">
                <Statistic
                  title="费曼准确率"
                  value={reports.metrics.feynmanAccuracy}
                  suffix="%"
                  valueStyle={{ color: '#22c55e', fontWeight: 600 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="sla-kpi-card sla-kpi-red">
                <Statistic
                  title="错误率"
                  value={reports.metrics.mistakeRate}
                  suffix="%"
                  valueStyle={{ color: '#ef4444', fontWeight: 600 }}
                />
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="link" onClick={() => navigate('/reports')}>
              查看详细报告 →
            </Button>
          </div>
        </Card>
        </Space>
      </div>
    </Page>
  );
}
