import React, { useMemo, useState } from 'react';
import {
  Button,
  Calendar,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  List,
  Row,
  Select,
  Space,
  Tag,
  Typography
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { Page } from '../ui/Page';
import { usePlan } from '../features/plan/usePlan';
import type { PlanTask, PlanTaskType } from '../features/plan/types';

export function PlanPage() {
  const plan = usePlan();
  const [selectedDate, setSelectedDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
  const [form] = Form.useForm();

  const dayTasks = useMemo(() => plan.tasksByDate[selectedDate] ?? [], [plan.tasksByDate, selectedDate]);

  const summary = useMemo(() => {
    const all = plan.tasks;
    const done = all.filter((t) => t.status === 'done').length;
    const totalMin = all.reduce((s, t) => s + t.minutes, 0);
    const doneMin = all.filter((t) => t.status === 'done').reduce((s, t) => s + t.minutes, 0);
    return { count: all.length, done, totalMin, doneMin };
  }, [plan.tasks]);

  return (
    <Page title="复习计划" subtitle="动态规划：剩余天数 × 学分权重 × 错误率 × 掌握度">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              目标设置
            </Typography.Title>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                examDate: dayjs(plan.goal.examDate),
                dailyMinutes: plan.goal.dailyMinutes,
                subjects: plan.goal.subjects.map((s) => `${s.name}|${s.weight}`)
              }}
              onValuesChange={(_, all) => {
                const exam = (all.examDate as Dayjs | undefined)?.format('YYYY-MM-DD') ?? plan.goal.examDate;
                const dailyMinutes = Number(all.dailyMinutes ?? plan.goal.dailyMinutes);
                const subjects = (all.subjects as string[] | undefined) ?? [];
                plan.setGoal({
                  examDate: exam,
                  dailyMinutes,
                  subjects: subjects
                    .map((x) => {
                      const [name, weight] = x.split('|');
                      return { id: name, name, weight: Number(weight ?? 1) };
                    })
                    .filter((s) => s.name.trim().length > 0)
                });
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item label="考试日期" name="examDate" required>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="每日可用时长（分钟）" name="dailyMinutes" required>
                    <InputNumber min={30} max={600} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="科目（示例：数学|5）" name="subjects" required>
                    <Select
                      mode="tags"
                      placeholder="输入：科目名|权重（1-5），回车添加"
                      options={[
                        { label: '数学|5', value: '数学|5' },
                        { label: '英语|3', value: '英语|3' },
                        { label: '物理|3', value: '物理|3' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Space wrap>
              <Button type="primary" onClick={() => plan.generate()}>
                生成计划
              </Button>
              <Tag>
                任务：{summary.count}（完成 {summary.done}）
              </Tag>
              <Tag>
                时长：{summary.doneMin}/{summary.totalMin} 分钟
              </Tag>
              <Typography.Text type="secondary">
                说明：计划会根据剩余天数、科目权重与任务完成情况动态调整。
              </Typography.Text>
            </Space>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={14}>
            <Card>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                日程视图
              </Typography.Title>
              <Calendar
                className="sla-plan-calendar"
                fullscreen={false}
                value={dayjs(selectedDate)}
                onSelect={(v) => setSelectedDate(v.format('YYYY-MM-DD'))}
                cellRender={(value) => {
                  const ymd = value.format('YYYY-MM-DD');
                  const items = plan.tasksByDate[ymd] ?? [];
                  if (!items.length) return null;
                  const done = items.filter((t) => t.status === 'done').length;
                  const total = items.length;
                  const isComplete = done === total;
                  const types = topTypeBadges(items);
                  
                  return (
                    <div style={{ padding: '2px 0' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        <span style={{ 
                          color: isComplete ? '#52c41a' : '#1890ff',
                          fontWeight: isComplete ? 500 : 400
                        }}>
                          {done}/{total}
                        </span>
                        {types.length > 0 && (
                          <span style={{ 
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: typeColor(types[0]) === 'geekblue' ? '#1890ff' : 
                                           typeColor(types[0]) === 'gold' ? '#faad14' :
                                           typeColor(types[0]) === 'red' ? '#ff4d4f' : '#722ed1',
                            marginLeft: '4px'
                          }} />
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                {dayjs(selectedDate).format('YYYY年MM月DD日')} 任务清单
              </Typography.Title>
              {dayTasks.length ? (
                <List
                  bordered
                  size="small"
                  dataSource={dayTasks}
                  renderItem={(t) => (
                    <List.Item
                      style={{ 
                        padding: '12px 16px',
                        opacity: t.status === 'done' ? 0.6 : 1,
                        borderLeft: `3px solid ${
                          typeColor(t.type) === 'geekblue' ? '#1890ff' : 
                          typeColor(t.type) === 'gold' ? '#faad14' :
                          typeColor(t.type) === 'red' ? '#ff4d4f' : '#722ed1'
                        }`
                      }}
                      actions={[
                        <Button 
                          key="toggle" 
                          size="small" 
                          type={t.status === 'done' ? 'default' : 'primary'} 
                          onClick={() => plan.toggleDone(t.id)}
                        >
                          {t.status === 'done' ? '撤销' : '完成'}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ marginBottom: '4px' }}>
                            <Typography.Text 
                              delete={t.status === 'done'} 
                              strong={t.status !== 'done'}
                              style={{ fontSize: '14px' }}
                            >
                              {t.title}
                            </Typography.Text>
                          </div>
                        }
                        description={
                          <Space size="small" wrap style={{ fontSize: '12px' }}>
                            <Tag color={typeColor(t.type)} style={{ margin: 0 }}>
                              {typeLabel(t.type)}
                            </Tag>
                            <Tag color="blue" style={{ margin: 0 }}>
                              {t.subject}
                            </Tag>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                              {t.minutes} 分钟 · 优先级 {t.priority}
                            </Typography.Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                  <Typography.Text type="secondary">该日期暂无任务</Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                    请先设置目标并生成计划
                  </Typography.Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    </Page>
  );
}

function typeLabel(t: PlanTaskType) {
  switch (t) {
    case 'review':
      return '复习';
    case 'practice':
      return '练习';
    case 'feynman':
      return '费曼';
    case 'mistakes':
      return '错题';
    default:
      return t;
  }
}

function typeColor(t: PlanTaskType) {
  switch (t) {
    case 'review':
      return 'geekblue';
    case 'practice':
      return 'purple';
    case 'feynman':
      return 'gold';
    case 'mistakes':
      return 'red';
    default:
      return 'default';
  }
}

function topTypeBadges(items: PlanTask[]): PlanTaskType[] {
  const counts = new Map<PlanTaskType, number>();
  items.forEach((t) => counts.set(t.type, (counts.get(t.type) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}


