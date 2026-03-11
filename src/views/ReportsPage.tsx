import React, { useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Page } from '../ui/Page';
import { useReports } from '../features/reports/useReports';
import dayjs from 'dayjs';

export function ReportsPage() {
  const reports = useReports();

  const chartData = useMemo(() => {
    return reports.trendData.map((d) => ({
      date: dayjs(d.date).format('MM-DD'),
      relevance: d.relevance,
      feynmanAccuracy: d.feynmanAccuracy,
      mistakeRate: d.mistakeRate,
      reviewIntensity: d.reviewIntensity
    }));
  }, [reports.trendData]);

  const milestoneIcons = {
    achievement: (
      <span className="sla-timeline-dot">
        <TrophyOutlined />
      </span>
    ),
    improvement: (
      <span className="sla-timeline-dot">
        <CheckCircleOutlined />
      </span>
    ),
    warning: (
      <span className="sla-timeline-dot">
        <WarningOutlined />
      </span>
    )
  };

  return (
    <Page title="学习报告" subtitle="周/月效率曲线、薄弱点分布、推送建议">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 指标面板 */}
        <Card>
          <Typography.Title level={5} style={{ margin: '0 0 16px 0' }}>
            学习指标
          </Typography.Title>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small">
                <Statistic
                  title="相关度"
                  value={reports.metrics.relevance}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress
                  percent={reports.metrics.relevance}
                  strokeColor="#1890ff"
                  size="small"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  课堂片段与作业知识点相关度
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" className="sla-kpi-card sla-kpi-purple">
                <Statistic
                  title="强化次数"
                  value={reports.metrics.reinforcementCount}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  薄弱点强化次数
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" className="sla-kpi-card sla-kpi-green">
                <Statistic
                  title="费曼准确率"
                  value={reports.metrics.feynmanAccuracy}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress
                  percent={reports.metrics.feynmanAccuracy}
                  strokeColor="#52c41a"
                  size="small"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  费曼问答平均准确率
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card size="small" className="sla-kpi-card sla-kpi-red">
                <Statistic
                  title="错误率"
                  value={reports.metrics.mistakeRate}
                  suffix="%"
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <Progress
                  percent={reports.metrics.mistakeRate}
                  strokeColor="#ff4d4f"
                  size="small"
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  作业错误率
                </Typography.Text>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 周/月报告 */}
        <Card
          title="趋势报告"
          extra={
            <Segmented
              value={reports.period}
              onChange={(v) => reports.setPeriod(v as 'week' | 'month')}
              options={[
                { label: '最近一周', value: 'week' },
                { label: '最近一月', value: 'month' }
              ]}
            />
          }
        >
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              {/* 简化的趋势图（使用 Progress 条模拟） */}
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>相关度趋势</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {chartData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <Typography.Text style={{ width: 60, fontSize: 11 }}>{d.date}</Typography.Text>
                        <Progress
                          percent={d.relevance}
                          strokeColor="#1890ff"
                          size="small"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8 }}
                        />
                        <Typography.Text style={{ width: 40, fontSize: 11, textAlign: 'right' }}>
                          {Math.round(d.relevance)}%
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Typography.Text strong>费曼准确率趋势</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {chartData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <Typography.Text style={{ width: 60, fontSize: 11 }}>{d.date}</Typography.Text>
                        <Progress
                          percent={d.feynmanAccuracy}
                          strokeColor="#52c41a"
                          size="small"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8 }}
                        />
                        <Typography.Text style={{ width: 40, fontSize: 11, textAlign: 'right' }}>
                          {Math.round(d.feynmanAccuracy)}%
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Typography.Text strong>错误率趋势</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {chartData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <Typography.Text style={{ width: 60, fontSize: 11 }}>{d.date}</Typography.Text>
                        <Progress
                          percent={d.mistakeRate}
                          strokeColor="#ff4d4f"
                          size="small"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8 }}
                        />
                        <Typography.Text style={{ width: 40, fontSize: 11, textAlign: 'right' }}>
                          {Math.round(d.mistakeRate)}%
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                </div>
              </Space>
            </Col>
            <Col xs={24} lg={8}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                里程碑
              </Typography.Title>
              <Timeline>
                {reports.milestones.map((m) => (
                  <Timeline.Item key={m.id} dot={milestoneIcons[m.type]}>
                    <Typography.Text strong>{m.title}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(m.date).format('YYYY-MM-DD')}
                    </Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {m.description}
                    </Typography.Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Col>
          </Row>
        </Card>

        {/* 薄弱点分布 */}
        <Card title="薄弱点分布">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                按章节
              </Typography.Title>
              <List
                size="small"
                dataSource={reports.weakPointDistribution.byChapter}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color="blue">{index + 1}</Tag>
                        <Typography.Text>{item.chapter}</Typography.Text>
                      </Space>
                      <Typography.Text strong>{item.count}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
            <Col xs={24} md={8}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                按知识点
              </Typography.Title>
              <List
                size="small"
                dataSource={reports.weakPointDistribution.byKnowledgePoint}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color="purple">{index + 1}</Tag>
                        <Typography.Text>{item.knowledgePoint}</Typography.Text>
                      </Space>
                      <Typography.Text strong>{item.count}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
            <Col xs={24} md={8}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                按类型
              </Typography.Title>
              <List
                size="small"
                dataSource={reports.weakPointDistribution.byType}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag
                          color={
                            item.type === '缺失知识点'
                              ? 'red'
                              : item.type === '逻辑断层'
                                ? 'orange'
                                : 'purple'
                          }
                        >
                          {index + 1}
                        </Tag>
                        <Typography.Text>{item.type}</Typography.Text>
                      </Space>
                      <Typography.Text strong>{item.count}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </Card>

        {/* 智能推荐 */}
        <Card
          title="智能推荐"
          extra={
            <Button type="link" size="small" icon={<ReloadOutlined />}>
              刷新推荐
            </Button>
          }
        >
          <List
            dataSource={reports.recommendations}
            renderItem={(rec) => {
              const icons = {
                material: <FileTextOutlined style={{ color: '#1890ff' }} />,
                question: <LineChartOutlined style={{ color: '#52c41a' }} />,
                review: <PlayCircleOutlined style={{ color: '#faad14' }} />
              };
              const typeLabels = {
                material: '资料',
                question: '题目',
                review: '复习'
              };
              return (
                <List.Item
                  actions={[
                    <Button type="link" size="small" key="go">
                      前往
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={icons[rec.type]}
                    title={
                      <Space>
                        <Typography.Text strong>{rec.title}</Typography.Text>
                        <Tag>{typeLabels[rec.type]}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Typography.Text>{rec.description}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          目标知识点：{rec.targetKnowledgePoint}
                        </Typography.Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      </Space>
    </Page>
  );
}
