import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  List,
  Progress,
  Space,
  Tag,
  Typography,
  Upload
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { Page } from '../ui/Page';
import { usePasteImage } from '../features/photoSearch/usePasteImage';
import { mockExtractFromImage } from '../features/photoSearch/mockVision';
import { mockSearchByExtraction } from '../features/photoSearch/mockSearch';
import { mockAiSolve } from '../features/photoSearch/mockSolver';
import type { AiSolution, SearchHit, VisionExtraction } from '../features/photoSearch/types';
import { useResources } from '../features/resources/useResources';
import { PptViewerModal } from '../ui/PptViewerModal';
import { useNavigate } from 'react-router-dom';

export function PhotoSearchPage() {
  const { Dragger } = Upload;
  const resources = useResources();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [extraction, setExtraction] = useState<VisionExtraction | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [jump, setJump] = useState<SearchHit | null>(null);
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<AiSolution | null>(null);
  const [pptViewer, setPptViewer] = useState<{ open: boolean; fileName: string; page: number }>({
    open: false,
    fileName: '',
    page: 1
  });

  const resetAll = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageName(null);
    setExtraction(null);
    setHits([]);
    setJump(null);
    setSolution(null);
    setSolving(false);
    setPptViewer({ open: false, fileName: '', page: 1 });
  }, [imageUrl]);

  const runPipeline = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      // 清理旧的
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
      setImageName(file.name || '粘贴图片');
      setHits([]);
      setExtraction(null);
      setSolution(null);

      setExtracting(true);
      try {
        const ex = await mockExtractFromImage(file.name || 'pasted-image.png');
        setExtraction(ex);
        setSearching(true);
        try {
          // mockExtractFromImage 对同一 fileName 是确定性的；这里复用同一个 ex，避免两次调用导致不一致
          const res = await mockSearchByExtraction(ex);
          setHits(res);
        } finally {
          setSearching(false);
        }
      } finally {
        setExtracting(false);
      }
    },
    [imageUrl]
  );

  usePasteImage((files) => {
    const f = files[0];
    if (f) void runPipeline(f);
  });

  const grouped = useMemo(() => {
    const g: Record<string, SearchHit[]> = {};
    for (const h of hits) (g[h.source] ||= []).push(h);
    return g;
  }, [hits]);

  return (
    <Page title="拍题反向检索" subtitle="图片 → 语义提取 → 多源定位跳转">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="提示"
          description="在本页按 Ctrl+V 可直接粘贴截图/图片；可识别题干并在多来源资料中定位相关内容。"
        />

        <Space wrap>
          <Button onClick={resetAll} disabled={!imageUrl}>
            清空
          </Button>
          <Tag color={extracting ? 'gold' : extraction ? 'green' : 'default'}>
            {extracting ? '识别中…' : extraction ? '已识别' : '未识别'}
          </Tag>
          <Tag color={searching ? 'gold' : hits.length ? 'green' : 'default'}>
            {searching ? '检索中…' : hits.length ? `命中 ${hits.length}` : '暂无命中'}
          </Tag>
        </Space>

        <Dragger
          multiple={false}
          showUploadList={false}
          beforeUpload={() => false}
          accept="image/*"
          onChange={(info) => {
            const f = (info.fileList as UploadFile[]).map((x) => x.originFileObj).filter(Boolean)[0] as File | undefined;
            if (f) void runPipeline(f);
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            拖拽图片到这里，或 Ctrl+V 粘贴截图
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            支持粘贴截图或拖拽上传图片，自动识别并在多来源资料中定位相关内容
          </Typography.Paragraph>
        </Dragger>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              题目预览
            </Typography.Title>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageName ?? 'image'}
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10 }}
              />
            ) : (
              <Empty description="请粘贴或上传一张题目图片" />
            )}
          </Space>
        </Card>

        <Card>
          <Typography.Title level={5} style={{ margin: 0 }}>
            识别结果
          </Typography.Title>
          <Divider style={{ margin: '10px 0' }} />
          {extracting ? <Progress percent={60} status="active" /> : null}
          {extraction ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="题干/说明">{extraction.promptText}</Descriptions.Item>
                <Descriptions.Item label="关键词">
                  <Space wrap>
                    {extraction.keywords.map((k) => (
                      <Tag key={k} color="blue">
                        {k}
                      </Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="公式">
                  {extraction.formulas?.length ? (
                    <Space wrap>
                      {extraction.formulas.map((f) => (
                        <Tag key={f}>{f}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">（无）</Typography.Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          ) : (
            <Typography.Text type="secondary">等待识别…</Typography.Text>
          )}
        </Card>

        <Card>
          <Typography.Title level={5} style={{ margin: 0 }}>
            检索命中（多源）
          </Typography.Title>
          <Divider style={{ margin: '10px 0' }} />
          {searching ? <Progress percent={55} status="active" /> : null}
          {hits.length ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {(['ppt', 'audio', 'whiteboard', 'note', 'video', 'article'] as const).map((src) =>
                grouped[src]?.length ? (
                  <div key={src}>
                    <Typography.Text strong>{sourceLabel(src)}</Typography.Text>
                    <List
                      style={{ marginTop: 8 }}
                      bordered
                      dataSource={grouped[src]}
                      renderItem={(h) => (
                        <List.Item
                          actions={[
                            <Button key="jump" size="small" type="primary" onClick={() => setJump(h)}>
                              跳转
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space wrap>
                                <Typography.Text strong>{h.title}</Typography.Text>
                                <Tag>{Math.round(h.score * 100)}%</Tag>
                              </Space>
                            }
                            description={<Typography.Text type="secondary">{h.snippet}</Typography.Text>}
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ) : null
              )}
            </Space>
          ) : (
            <Typography.Text type="secondary">暂无命中（请先粘贴/上传图片）</Typography.Text>
          )}
        </Card>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Typography.Title level={5} style={{ margin: 0 }}>
                AI 解答与解析
              </Typography.Title>
              <Button
                type="primary"
                disabled={!extraction || solving}
                loading={solving}
                onClick={async () => {
                  if (!extraction) return;
                  setSolving(true);
                  try {
                    const sol = await mockAiSolve(extraction, hits);
                    setSolution(sol);
                  } finally {
                    setSolving(false);
                  }
                }}
              >
                生成答案与解析
              </Button>
            </Space>

            {!extraction ? (
              <Typography.Text type="secondary">请先粘贴/上传题目图片并完成识别。</Typography.Text>
            ) : solving ? (
              <Progress percent={65} status="active" />
            ) : solution ? (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="提示"
                  description="答案与解析由 AI 生成，仅供参考；请结合课堂资料核对关键步骤。"
                />

                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="答案">{solution.answer}</Descriptions.Item>
                  <Descriptions.Item label="置信度">
                    <Tag
                      color={
                        solution.confidence >= 0.85 ? 'green' : solution.confidence >= 0.75 ? 'blue' : 'gold'
                      }
                    >
                      {Math.round(solution.confidence * 100)}%
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="核心要点">
                    <Space wrap>
                      {solution.keyPoints.map((k) => (
                        <Tag key={k} color="purple">
                          {k}
                        </Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '10px 0' }} />

                <Typography.Text strong>分步解析</Typography.Text>
                <List
                  size="small"
                  bordered
                  dataSource={solution.steps}
                  renderItem={(s, idx) => (
                    <List.Item>
                      <Space>
                        <Tag color="blue">{idx + 1}</Tag>
                        <Typography.Text>{s}</Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />

                <Divider style={{ margin: '10px 0' }} />

                <Typography.Text strong>参考来源（来自检索命中）</Typography.Text>
                {solution.refs.length ? (
                  <List
                    size="small"
                    bordered
                    dataSource={solution.refs}
                    renderItem={(r) => (
                      <List.Item
                        actions={[
                          <Button
                            key="jump"
                            size="small"
                            onClick={() => {
                              const h = hits.find((x) => x.id === r.hitId);
                              if (h) setJump(h);
                            }}
                          >
                            去定位
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space wrap>
                              <Typography.Text strong>{r.title}</Typography.Text>
                              <Tag>{sourceLabel(r.source)}</Tag>
                              <Tag>{Math.round(r.score * 100)}%</Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Typography.Text type="secondary">（暂无引用来源）</Typography.Text>
                )}
              </Space>
            ) : (
              <Typography.Text type="secondary">点击“生成答案与解析”即可获得 AI 解答。</Typography.Text>
            )}
          </Space>
        </Card>
      </Space>

      <Drawer title="跳转定位" open={!!jump} onClose={() => setJump(null)} width={680}>
        {jump ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="来源">{sourceLabel(jump.source)}</Descriptions.Item>
              <Descriptions.Item label="标题">{jump.title}</Descriptions.Item>
              <Descriptions.Item label="说明">{jump.snippet}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '8px 0' }} />

            <Typography.Title level={5} style={{ margin: 0 }}>
              定位信息
            </Typography.Title>
            <Descriptions bordered size="small" column={1}>
              {jump.location.type === 'ppt_page' ? (
                <>
                  <Descriptions.Item label="PPT 文件">{jump.location.fileName}</Descriptions.Item>
                  <Descriptions.Item label="页码">第 {jump.location.page} 页</Descriptions.Item>
                </>
              ) : null}
              {jump.location.type === 'audio_ts' ? (
                <>
                  <Descriptions.Item label="音频文件">{jump.location.fileName}</Descriptions.Item>
                  <Descriptions.Item label="时间段">
                    {fmtTime(jump.location.startSec)} - {fmtTime(jump.location.endSec)}
                  </Descriptions.Item>
                </>
              ) : null}
              {jump.location.type === 'note_anchor' ? (
                <>
                  <Descriptions.Item label="笔记">{jump.location.noteTitle}</Descriptions.Item>
                  <Descriptions.Item label="锚点">{jump.location.anchor}</Descriptions.Item>
                </>
              ) : null}
              {jump.location.type === 'whiteboard_photo' ? (
                <Descriptions.Item label="板书照片">{jump.location.fileName}</Descriptions.Item>
              ) : null}
              {jump.location.type === 'external_url' ? (
                <>
                  <Descriptions.Item label="外部资源">{jump.location.label}</Descriptions.Item>
                  <Descriptions.Item label="URL">
                    <Tag>{jump.location.url}</Tag>
                  </Descriptions.Item>
                </>
              ) : null}
            </Descriptions>

            <Space wrap>
              {jump.location.type === 'ppt_page' ? (
                <Button
                  type="primary"
                  onClick={() => {
                    const loc = jump.location;
                    if (loc.type !== 'ppt_page') return;
                    // 优先：如果导入列表里存在同名 PPT 且有 filePath，则打开真实文件
                    const raw = localStorage.getItem('sla.import.tasks.v1');
                    const tasks = raw ? (JSON.parse(raw) as any[]) : [];
                    const match = (tasks || []).find((t) => t?.kind === 'ppt' && t?.fileName === loc.fileName);
                    if (match?.filePath && window.sla?.openPath) {
                      void window.sla.openPath(match.filePath);
                      return;
                    }
                    setPptViewer({ open: true, fileName: loc.fileName, page: loc.page });
                  }}
                >
                  打开PPT预览（第 {jump.location.page} 页）
                </Button>
              ) : null}
              {jump.location.type === 'external_url' ? (
                <Button
                  type="primary"
                  onClick={() => {
                    const loc = jump.location;
                    if (loc.type !== 'external_url') return;
                    // 录屏演示：外链优先跳到“第三方资源整合”，并选中 B 站视频资源
                    const url = loc.url;
                    const isBili = url.includes('bilibili.com') || jump.title.includes('B站');
                    const created = isBili ? resources.add(url, 'bilibili') : resources.add(url);
                    if (created && isBili) {
                      navigate(`/resources?tab=bilibili&open=${encodeURIComponent(created.id)}`);
                      return;
                    }
                    // fallback：仍记录历史并打开外链
                    resources.recordExternalJump(`跳转：${jump.title}`, url);
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  打开链接
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    // 演示用：非外链也给一个“模拟打开”动作，方便录屏
                    const demoUrl = 'https://www.bilibili.com/video/BV1xx411c7mD/';
                    const created = resources.add(demoUrl, 'bilibili');
                    if (created) {
                      navigate(`/resources?tab=bilibili&open=${encodeURIComponent(created.id)}`);
                      return;
                    }
                    resources.recordExternalJump(`跳转：${jump.title}`, demoUrl);
                    window.open(demoUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  模拟打开
                </Button>
              )}
              <Button onClick={() => setJump(null)}>关闭</Button>
            </Space>

            <Alert
              type="warning"
              showIcon
              message="说明"
              description="这里的“跳转”会展示定位信息，并提供对应来源的打开入口。"
            />
          </Space>
        ) : null}
      </Drawer>

      <PptViewerModal
        open={pptViewer.open}
        fileName={pptViewer.fileName}
        page={pptViewer.page}
        pages={Array.from({ length: Math.max(12, pptViewer.page || 1) }).map((_, idx) => ({
          page: idx + 1,
          text: `第 ${idx + 1} 页：${pptViewer.fileName}（示例内容）`
        }))}
        onClose={() => setPptViewer({ open: false, fileName: '', page: 1 })}
        onPageChange={(p) => setPptViewer((s) => ({ ...s, page: p }))}
      />
    </Page>
  );
}

function sourceLabel(s: SearchHit['source']): string {
  switch (s) {
    case 'ppt':
      return 'PPT / 讲义';
    case 'audio':
      return '课堂录音';
    case 'whiteboard':
      return '板书照片';
    case 'note':
      return '笔记';
    case 'video':
      return '视频（外部）';
    case 'article':
      return '文章（外部）';
    default:
      return s;
  }
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}


