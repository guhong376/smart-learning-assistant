import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Input,
  message
} from 'antd';
import {
  AudioOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { Page } from '../ui/Page';
import { useFeynman } from '../features/feynman/useFeynman';
import type { WeakPoint } from '../features/feynman/types';
import { useResources } from '../features/resources/useResources';
import { useNavigate } from 'react-router-dom';
import { PptViewerModal } from '../ui/PptViewerModal';

const { TextArea } = Input;

export function FeynmanPage() {
  const feynman = useFeynman();
  const resources = useResources();
  const [msgApi, msgCtx] = message.useMessage();
  const navigate = useNavigate();
  const [jumpModal, setJumpModal] = useState<{
    open: boolean;
    title: string;
    url: string;
    tip?: string;
  }>({ open: false, title: '', url: '' });
  const [pptViewer, setPptViewer] = useState<{ open: boolean; fileName: string; page: number }>({
    open: false,
    fileName: '',
    page: 1
  });

  const openSecondPptInImport = () => {
    try {
      const raw = localStorage.getItem('sla.import.tasks.v1');
      if (!raw) throw new Error('no tasks');
      const tasks = JSON.parse(raw) as Array<any>;
      const pptTasks = (tasks || []).filter((t) => t?.kind === 'ppt');
      const second = pptTasks[1];
      if (!second?.id) throw new Error('no second ppt');
      // 优先：桌面端直接打开真实 PPT；否则退回应用内预览
      if (second.filePath && window.sla?.openPath) {
        void window.sla.openPath(second.filePath);
      } else {
        setPptViewer({ open: true, fileName: second.fileName || 'PPT', page: 12 });
      }
      navigate(`/import?open=${encodeURIComponent(second.id)}`);
    } catch {
      msgApi.info('未找到第 2 个 PPT 文件，请先在“资料导入与解析”里导入至少 2 个 PPT');
      navigate('/import');
    }
  };

  const weakPointsByType = useMemo(() => {
    const m: Record<string, WeakPoint[]> = {
      missing: [],
      logic_gap: [],
      common_mistake: []
    };
    feynman.weakPoints.forEach((wp) => {
      (m[wp.type] ||= []).push(wp);
    });
    return m;
  }, [feynman.weakPoints]);

  const typeLabels = {
    missing: { label: '缺失知识点', color: 'red' },
    logic_gap: { label: '逻辑断层', color: 'orange' },
    common_mistake: { label: '易错点', color: 'purple' }
  };

  return (
    <Page title="费曼问答" subtitle="AI 扮演提问者：引导解释 → 评估逻辑 → 标记薄弱点">
      {msgCtx}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 知识点选择 */}
        <Card>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Text strong>选择知识点</Typography.Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择知识点（可选，不选则随机提问）"
                  value={feynman.selectedKnowledgePoint}
                  onChange={feynman.setSelectedKnowledgePoint}
                  allowClear
                  options={feynman.knowledgePointOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => feynman.startQuestion()}
                disabled={feynman.questions.length === 0}
                block
              >
                随机提问
              </Button>
            </Col>
            <Col xs={24} sm={24} md={8}>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          {/* 问答区域 */}
          <Col xs={24} lg={14}>
            {feynman.currentQuestion ? (
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* 问题 */}
                  <div>
                    <Typography.Title level={5}>问题</Typography.Title>
                    <Card size="small" style={{ background: '#f5f5f5' }}>
                      <Typography.Text>{feynman.currentQuestion.question}</Typography.Text>
                    </Card>
                    {feynman.currentQuestion.hints && feynman.currentQuestion.hints.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          提示：
                        </Typography.Text>
                        <Space wrap size={4}>
                          {feynman.currentQuestion.hints.map((hint, i) => (
                            <Tag key={i} color="blue" style={{ margin: 0, fontSize: 11 }}>
                              {hint}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}
                  </div>

                  {/* 回答输入 */}
                  <div>
                    <Typography.Title level={5}>你的回答</Typography.Title>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <TextArea
                        rows={6}
                        placeholder="请用文字详细解释这个问题..."
                        value={feynman.currentAnswer}
                        onChange={(e) => feynman.setCurrentAnswer(e.target.value)}
                        disabled={feynman.isRecording}
                      />
                      <Space>
                        <Button
                          type="primary"
                          icon={<FileTextOutlined />}
                          onClick={() => {
                            if (feynman.currentAnswer.trim()) {
                              feynman.submitAnswer('text', feynman.currentAnswer);
                            }
                          }}
                          disabled={!feynman.currentAnswer.trim() || feynman.isRecording}
                        >
                          提交文字回答
                        </Button>
                        <Button
                          type={feynman.isRecording ? 'default' : 'primary'}
                          danger={feynman.isRecording}
                          icon={feynman.isRecording ? <SoundOutlined spin /> : <AudioOutlined />}
                          onClick={feynman.isRecording ? feynman.stopRecording : feynman.startRecording}
                        >
                          {feynman.isRecording ? '停止录音' : '语音回答'}
                        </Button>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {feynman.isRecording ? '正在录音...' : ''}
                        </Typography.Text>
                      </Space>
                    </Space>
                  </div>

                  {/* 分析结果 */}
                  {feynman.analysis && (
                    <div>
                      <Typography.Title level={5}>分析结果</Typography.Title>
                      <Card size="small">
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          {/* 评分 */}
                          <div>
                            <Space>
                              <Typography.Text strong>综合评分：</Typography.Text>
                              <Progress
                                type="circle"
                                percent={feynman.analysis.score}
                                format={(percent) => `${percent}分`}
                                strokeColor={feynman.analysis.score >= 80 ? '#52c41a' : feynman.analysis.score >= 60 ? '#faad14' : '#ff4d4f'}
                              />
                            </Space>
                            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                              {feynman.analysis.feedback}
                            </Typography.Text>
                          </div>

                          <Divider style={{ margin: '8px 0' }} />

                          {/* 覆盖情况 */}
                          <Descriptions size="small" column={1}>
                            <Descriptions.Item
                              label={
                                <Space>
                                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                  已覆盖
                                </Space>
                              }
                            >
                              {feynman.analysis.coverage.covered.length > 0 ? (
                                <Space wrap>
                                  {feynman.analysis.coverage.covered.map((item, i) => (
                                    <Tag key={i} color="success" style={{ margin: 0 }}>
                                      {item}
                                    </Tag>
                                  ))}
                                </Space>
                              ) : (
                                <Typography.Text type="secondary">无</Typography.Text>
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item
                              label={
                                <Space>
                                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                  缺失
                                </Space>
                              }
                            >
                              {feynman.analysis.coverage.missing.length > 0 ? (
                                <Space wrap>
                                  {feynman.analysis.coverage.missing.map((item, i) => (
                                    <Tag key={i} color="error" style={{ margin: 0 }}>
                                      {item}
                                    </Tag>
                                  ))}
                                </Space>
                              ) : (
                                <Typography.Text type="secondary">无</Typography.Text>
                              )}
                            </Descriptions.Item>
                            {feynman.analysis.logicGaps.length > 0 && (
                              <Descriptions.Item label="逻辑断层">
                                <Space wrap>
                                  {feynman.analysis.logicGaps.map((gap, i) => (
                                    <Tag key={i} color="warning" style={{ margin: 0 }}>
                                      {gap}
                                    </Tag>
                                  ))}
                                </Space>
                              </Descriptions.Item>
                            )}
                            {feynman.analysis.commonMistakes.length > 0 && (
                              <Descriptions.Item label="易错点">
                                <Space wrap>
                                  {feynman.analysis.commonMistakes.map((mistake, i) => (
                                    <Tag key={i} color="purple" style={{ margin: 0 }}>
                                      {mistake}
                                    </Tag>
                                  ))}
                                </Space>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Space>
                      </Card>
                    </div>
                  )}

                  {/* 关联资源回看 */}
                  {feynman.analysis && (
                    <div>
                      <Typography.Title level={5}>关联资源回看</Typography.Title>
                      <Card size="small">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Button
                            type="link"
                            icon={<FileTextOutlined />}
                            onClick={openSecondPptInImport}
                          >
                            查看相关PPT
                          </Button>
                          <Button
                            type="link"
                            icon={<PlayCircleOutlined />}
                            onClick={() =>
                              setJumpModal({
                                open: true,
                                title: '播放相关录音（示例）',
                                url: 'https://www.bilibili.com/video/BV1xx411c7mD/',
                                tip: '用于演示：点击即可打开外部链接'
                              })
                            }
                          >
                            播放相关录音
                          </Button>
                          <Button
                            type="link"
                            icon={<FileTextOutlined />}
                            onClick={() =>
                              setJumpModal({
                                open: true,
                                title: '查看相关笔记（示例）',
                                url: 'https://zhuanlan.zhihu.com/p/123456789',
                                tip: '用于演示：点击即可打开外部链接'
                              })
                            }
                          >
                            查看相关笔记
                          </Button>
                          <Button
                            type="link"
                            icon={<ReloadOutlined />}
                            onClick={() =>
                              setJumpModal({
                                open: true,
                                title: '同类题目练习（示例）',
                                url: 'https://www.bilibili.com/video/BV1xx411c7mD/',
                                tip: '用于演示：点击即可打开外部链接'
                              })
                            }
                          >
                            同类题目练习
                          </Button>
                        </Space>
                      </Card>
                    </div>
                  )}
                </Space>
              </Card>
            ) : (
              <Card>
                <Typography.Text type="secondary">
                  请选择知识点或点击"随机提问"开始问答
                </Typography.Text>
              </Card>
            )}
          </Col>

          {/* 薄弱点统计 */}
          <Col xs={24} lg={10}>
            <Card>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                薄弱点统计 ({feynman.weakPoints.length})
              </Typography.Title>
              {feynman.weakPoints.length === 0 ? (
                <Typography.Text type="secondary">暂无薄弱点记录</Typography.Text>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {Object.entries(weakPointsByType).map(([type, points]) => {
                    if (points.length === 0) return null;
                    const cfg = typeLabels[type as keyof typeof typeLabels];
                    return (
                      <div key={type}>
                        <Space>
                          <Tag color={cfg.color}>{cfg.label}</Tag>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {points.length} 个
                          </Typography.Text>
                        </Space>
                        <List
                          size="small"
                          dataSource={points.slice(0, 5)}
                          renderItem={(wp) => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <Typography.Text style={{ fontSize: 12 }}>{wp.description}</Typography.Text>
                            </List.Item>
                          )}
                        />
                        {points.length > 5 && (
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            还有 {points.length - 5} 个...
                          </Typography.Text>
                        )}
                      </div>
                    );
                  })}
                </Space>
              )}
            </Card>

            {/* 历史回答 */}
            {feynman.answers.length > 0 && (
              <Card style={{ marginTop: 16 }}>
                <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>
                  历史回答 ({feynman.answers.length})
                </Typography.Title>
                <List
                  size="small"
                  dataSource={feynman.answers.slice(-5).reverse()}
                  renderItem={(ans) => (
                    <List.Item>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space>
                          <Tag>{ans.mode === 'text' ? '文字' : '语音'}</Tag>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(ans.createdAt).toLocaleString()}
                          </Typography.Text>
                        </Space>
                        <Typography.Text ellipsis style={{ fontSize: 12 }}>
                          {ans.content}
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>
        </Row>
      </Space>

      <Modal
        title={jumpModal.title}
        open={jumpModal.open}
        onCancel={() => setJumpModal((p) => ({ ...p, open: false }))}
        footer={[
          <Button key="close" onClick={() => setJumpModal((p) => ({ ...p, open: false }))}>
            关闭
          </Button>,
          <Button
            key="open"
            type="primary"
            onClick={() => {
              if (!jumpModal.url) return;
              // 录屏演示：外链优先跳到“第三方资源整合”，并选中 B 站视频资源
              const url = jumpModal.url;
              const isBili = url.includes('bilibili.com') || jumpModal.title.includes('B站');
              const created = isBili ? resources.add(url, 'bilibili') : resources.add(url);
              if (created && isBili) {
                navigate(`/resources?tab=bilibili&open=${encodeURIComponent(created.id)}`);
                msgApi.success('已跳转到第三方资源整合，并定位到 B 站资源');
                setJumpModal((p) => ({ ...p, open: false }));
                return;
              }
              resources.recordExternalJump(`跳转：${jumpModal.title}`, url);
              window.open(url, '_blank', 'noopener,noreferrer');
              msgApi.success('已打开链接，并记录到资源历史');
            }}
          >
            打开链接
          </Button>
        ]}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {jumpModal.tip ? <Typography.Text type="secondary">{jumpModal.tip}</Typography.Text> : null}
          <Tag>{jumpModal.url}</Tag>
        </Space>
      </Modal>

      <PptViewerModal
        open={pptViewer.open}
        fileName={pptViewer.fileName}
        page={pptViewer.page}
        pages={Array.from({ length: Math.max(12, pptViewer.page || 1) }).map((_, idx) => ({
          page: idx + 1,
          text: `第 ${idx + 1} 页：${pptViewer.fileName}（示例内容）`
        }))}
        filePath={undefined}
        onClose={() => setPptViewer({ open: false, fileName: '', page: 1 })}
        onPageChange={(p) => setPptViewer((s) => ({ ...s, page: p }))}
      />
    </Page>
  );
}
