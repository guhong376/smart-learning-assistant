import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  message,
  Input,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  Select,
  TreeSelect
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { Page } from '../ui/Page';
import { useImportQueue } from '../features/import/useImportQueue';
import type { ImportTask } from '../features/import/types';
import { useKnowledgeCatalog } from '../features/catalog/useKnowledgeCatalog';
import { useSearchParams } from 'react-router-dom';
import { PptViewerModal } from '../ui/PptViewerModal';

export function ImportPage() {
  const { Dragger } = Upload;
  const q = useImportQueue();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [kpInput, setKpInput] = useState('');
  const catalog = useKnowledgeCatalog();
  const [msgApi, msgCtx] = message.useMessage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pptViewer, setPptViewer] = useState<{ open: boolean; fileName: string; page: number; pages: any[] }>({
    open: false,
    fileName: '',
    page: 1,
    pages: []
  });

  // Drawer 里必须从队列实时取 task；否则 setActive(row) 会变成“快照”，更新 tags 后界面不刷新
  const active = useMemo(() => {
    if (!activeId) return null;
    return q.tasks.find((t) => t.id === activeId) ?? null;
  }, [activeId, q.tasks]);

  // 支持从 URL 参数打开指定任务：/import?open=<taskId>
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    const exists = q.tasks.some((t) => t.id === openId);
    if (!exists) return;
    setActiveId(openId);
    // 打开后清理参数，避免下次刷新重复触发
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('open');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.tasks, searchParams]);

  const columns: ColumnsType<ImportTask> = useMemo(
    () => [
      {
        title: '文件',
        dataIndex: 'fileName',
        key: 'fileName',
        render: (v: string, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{v}</Typography.Text>
            <Space size={6} wrap>
              <Tag color="blue">{row.kind.toUpperCase()}</Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(row.size / 1024)} KB
              </Typography.Text>
            </Space>
          </Space>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (v: ImportTask['status']) => {
          const color =
            v === 'done' ? 'green' : v === 'failed' ? 'red' : v === 'cancelled' ? 'default' : 'gold';
          const label =
            v === 'queued' ? '排队中' : v === 'parsing' ? '解析中' : v === 'done' ? '完成' : v === 'failed' ? '失败' : '已取消';
          return <Tag color={color}>{label}</Tag>;
        }
      },
      {
        title: '进度',
        dataIndex: 'progress',
        key: 'progress',
        render: (v: number, row) => (
          <Progress
            percent={v}
            size="small"
            status={row.status === 'failed' ? 'exception' : row.status === 'done' ? 'success' : 'active'}
          />
        )
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_, row) => (
          <Space>
            <Button size="small" onClick={() => setActiveId(row.id)}>
              查看
            </Button>
            <Button
              size="small"
              disabled={row.status === 'done' || row.status === 'failed' || row.status === 'cancelled'}
              onClick={() => q.cancel(row.id)}
            >
              取消
            </Button>
            <Button size="small" danger onClick={() => q.remove(row.id)}>
              移除
            </Button>
          </Space>
        )
      }
    ],
    [q]
  );

  return (
    <Page title="资料导入与解析" subtitle="PPT / 录音 / 板书照片 / 笔记 → 文本化与结构化">
      {msgCtx}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="总任务">{q.stats.total}</Descriptions.Item>
          <Descriptions.Item label="解析中">{q.stats.parsing}</Descriptions.Item>
          <Descriptions.Item label="已完成">{q.stats.done}</Descriptions.Item>
        </Descriptions>

        <Dragger
          multiple
          showUploadList={false}
          beforeUpload={() => false}
          accept=".ppt,.pptx,.pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.md"
          onChange={(info) => {
            const files = (info.fileList as UploadFile[])
              .map((f) => f.originFileObj)
              .filter(Boolean) as File[];
            if (files.length) q.addFiles(files);
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            拖拽文件到这里导入
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            支持 PPT/PDF/图片/音频/笔记导出
          </Typography.Paragraph>
        </Dragger>

        <Divider style={{ margin: '8px 0' }} />

        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={q.tasks}
          pagination={{ pageSize: 6 }}
        />
      </Space>

      <Drawer
        title="任务详情"
        open={!!active}
        extra={
          <Button
            type="primary"
            size="small"
            onClick={() => {
              q.persistNow();
              msgApi.success('已保存到本地');
            }}
          >
            保存到本地
          </Button>
        }
        onClose={() => {
          setActiveId(null);
          setKpInput('');
        }}
        width={600}
      >
        {active ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 基本信息 */}
            <Card
              size="small"
              title="基本信息"
              style={{ marginBottom: 16 }}
              extra={
                <Button
                  size="small"
                  type="primary"
                  onClick={async () => {
                    if (!window.sla?.openPath) {
                      msgApi.info('需要桌面端（Electron）才能打开本机文件');
                      return;
                    }
                    let fp = active.filePath;
                    if (!fp && window.sla.pickFile) {
                      const picked = await window.sla.pickFile();
                      if (picked.ok) {
                        fp = picked.filePath;
                        q.updateFilePath(active.id, fp);
                      }
                    }
                    if (!fp) {
                      msgApi.info('未选择文件，无法打开');
                      return;
                    }
                    const res = await window.sla.openPath(fp);
                    if (res.ok) msgApi.success('已打开文件');
                    else msgApi.error(`打开失败：${res.error}`);
                  }}
                >
                  打开原文件
                </Button>
              }
            >
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="文件名">{active.fileName}</Descriptions.Item>
                <Descriptions.Item label="类型">{active.kind}</Descriptions.Item>
                <Descriptions.Item label="MIME">{active.mimeType}</Descriptions.Item>
                <Descriptions.Item label="进度">
                  <Progress 
                    percent={active.progress} 
                    size="small" 
                    status={active.status === 'done' ? 'success' : active.status === 'failed' ? 'exception' : 'active'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={active.status === 'done' ? 'success' : active.status === 'failed' ? 'error' : 'processing'}>
                    {active.status === 'done' ? '已完成' : active.status === 'failed' ? '失败' : '处理中'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 元数据编辑 */}
            <Card size="small" title="元数据（可手动补充）" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    章节
                  </Typography.Text>
                  <TreeSelect
                    allowClear
                    showSearch
                    treeDefaultExpandAll
                    placeholder="选择章节（树形选择，可搜索）"
                    value={active.tags.chapter ?? undefined}
                    onChange={(v) => q.updateTags(active.id, { chapter: (v as string) || '' })}
                    treeData={catalog.chapterTree.map((n) => toAntTree(n))}
                    filterTreeNode={(input, node) => (String(node.title) || '').includes(input)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    知识点
                  </Typography.Text>
                  <Select
                    mode="tags"
                    placeholder="选择或添加知识点（可搜索/可新增）"
                    value={active.tags.knowledgePoints ?? []}
                    onChange={(vals) => q.updateTags(active.id, { knowledgePoints: vals })}
                    options={catalog.flatKnowledge.map((x) => ({
                      label: `${x.title}（${x.path}）`,
                      value: x.title
                    }))}
                    showSearch
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <Input
                    placeholder="快速新增一个知识点：回车添加"
                    value={kpInput}
                    onChange={(e) => setKpInput(e.target.value)}
                    onPressEnter={() => {
                      const v = kpInput.trim();
                      if (!v) return;
                      q.updateTags(active.id, {
                        knowledgePoints: Array.from(new Set([...(active.tags.knowledgePoints ?? []), v]))
                      });
                      setKpInput('');
                    }}
                  />
                </div>

                {(active.tags.knowledgePoints ?? []).length > 0 && (
                  <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                      已选知识点：
                    </Typography.Text>
                    <Space wrap>
                      {(active.tags.knowledgePoints ?? []).map((kp) => (
                        <Tag
                          key={kp}
                          closable
                          onClose={(e) => {
                            e.preventDefault();
                            q.updateTags(active.id, {
                              knowledgePoints: (active.tags.knowledgePoints ?? []).filter((x) => x !== kp)
                            });
                          }}
                        >
                          {kp}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                <div>
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    推荐知识点（点击添加）：
                  </Typography.Text>
                  <Space wrap>
                    {getRecommendations(active).map((kp) => (
                      <Tag
                        key={kp}
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          q.updateTags(active.id, {
                            knowledgePoints: Array.from(new Set([...(active.tags.knowledgePoints ?? []), kp]))
                          })
                        }
                      >
                        + {kp}
                      </Tag>
                    ))}
                    {getRecommendations(active).length === 0 && (
                      <Typography.Text type="secondary">（暂无推荐）</Typography.Text>
                    )}
                  </Space>
                </div>
              </Space>
            </Card>

            {/* 解析预览 */}
            <Card size="small" title="解析预览">
              {active.result?.kind === 'slides_text' ? (
                <div style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    onClick={() =>
                      setPptViewer({
                        open: true,
                        fileName: active.fileName,
                        page: 1,
                        pages: active.result?.kind === 'slides_text' ? active.result.pages : []
                      })
                    }
                  >
                    打开PPT预览
                  </Button>
                </div>
              ) : null}
              {active.kind === 'image' && active.objectUrl ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
                    <img
                      src={active.objectUrl}
                      alt={active.fileName}
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                      OCR 识别结果：
                    </Typography.Text>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.02)', 
                      padding: 12, 
                      borderRadius: 6,
                      maxHeight: 200,
                      overflowY: 'auto'
                    }}>
                      {(active.result?.kind === 'image_ocr' ? active.result.blocks : []).length > 0 ? (
                        (active.result?.kind === 'image_ocr' ? active.result.blocks : []).map((b, idx) => (
                          <div key={idx} style={{ marginBottom: 8, lineHeight: 1.6 }}>
                            <Typography.Text>{b.text}</Typography.Text>
                            <Tag color="blue" style={{ marginLeft: 8, fontSize: '11px' }}>
                              {Math.round(b.confidence * 100)}%
                            </Tag>
                          </div>
                        ))
                      ) : (
                        <Typography.Text type="secondary">等待 OCR 识别完成...</Typography.Text>
                      )}
                    </div>
                  </div>
                </Space>
              ) : active.kind === 'audio' && active.objectUrl ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
                    <audio controls src={active.objectUrl} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                      转写结果：
                    </Typography.Text>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.02)', 
                      padding: 12, 
                      borderRadius: 6,
                      maxHeight: 200,
                      overflowY: 'auto'
                    }}>
                      {(active.result?.kind === 'audio_transcript' ? active.result.segments : []).length > 0 ? (
                        (active.result?.kind === 'audio_transcript' ? active.result.segments : []).map((s, idx) => (
                          <div key={idx} style={{ marginBottom: 8, lineHeight: 1.6 }}>
                            <Tag color="green" style={{ fontSize: '11px', marginRight: 8 }}>
                              {Math.round(s.startMs / 1000)}s - {Math.round(s.endMs / 1000)}s
                            </Tag>
                            <Typography.Text>{s.text}</Typography.Text>
                          </div>
                        ))
                      ) : (
                        <Typography.Text type="secondary">等待音频转写完成...</Typography.Text>
                      )}
                    </div>
                  </div>
                </Space>
              ) : active.kind !== 'image' && active.kind !== 'audio' ? (
                <div>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    文档解析结果：
                  </Typography.Text>
                  <div style={{ 
                    background: 'rgba(0,0,0,0.02)', 
                    padding: 12, 
                    borderRadius: 6,
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}>
                    {(active.result?.kind === 'slides_text' ? active.result.pages : []).length > 0 ? (
                      (active.result?.kind === 'slides_text' ? active.result.pages : []).map((p) => (
                        <div key={p.page} style={{ marginBottom: 8, lineHeight: 1.6 }}>
                          <Tag color="purple" style={{ fontSize: '11px', marginRight: 8 }}>
                            第 {p.page} 页
                          </Tag>
                          <Typography.Text>{p.text}</Typography.Text>
                        </div>
                      ))
                    ) : (
                      <Typography.Text type="secondary">等待文档解析完成...</Typography.Text>
                    )}
                  </div>
                </div>
              ) : (
                <Typography.Text type="secondary">
                  {active.status === 'done' ? '解析完成，但无预览内容' : '等待解析完成...'}
                </Typography.Text>
              )}
            </Card>
          </Space>
        ) : (
          <Typography.Text type="secondary">请选择一个任务查看详情</Typography.Text>
        )}
      </Drawer>

      <PptViewerModal
        open={pptViewer.open}
        fileName={pptViewer.fileName}
        page={pptViewer.page}
        pages={(pptViewer.pages || []).map((p: any) => ({ page: p.page, text: p.text }))}
        filePath={active?.filePath}
        onClose={() => setPptViewer({ open: false, fileName: '', page: 1, pages: [] })}
        onPageChange={(p) => setPptViewer((s) => ({ ...s, page: p }))}
      />
    </Page>
  );
}

function toAntTree(n: { key: string; title: string; children?: any[] }): any {
  return {
    title: n.title,
    value: n.title,
    key: n.key,
    children: n.children?.map((c) => toAntTree(c))
  };
}

function getRecommendations(task: ImportTask): string[] {
  const rec = new Set<string>();
  const addIf = (s: string) => {
    const v = s.trim();
    if (v) rec.add(v);
  };

  // 从 mock 结果里提一些关键词（后续可替换为后端返回的 structured keywords）
  if (task.result?.kind === 'image_ocr') {
    const all = task.result.blocks.map((b) => b.text).join(' ');
    if (all.includes('导数')) addIf('导数');
    if (all.includes('单调')) addIf('单调性');
    if (all.includes('极值')) addIf('极值');
    if (all.includes('函数')) addIf('函数');
  }

  if (task.result?.kind === 'audio_transcript') {
    const all = task.result.segments.map((s) => s.text).join(' ');
    if (all.includes('定义')) addIf('导数定义与几何意义');
    if (all.includes('易错')) addIf('易错点');
    if (all.includes('总结')) addIf('总结');
    if (all.includes('例题')) addIf('例题');
  }

  if (task.result?.kind === 'slides_text') {
    const all = task.result.pages.map((p) => p.text).join(' ');
    if (all.includes('公式')) addIf('导数');
    if (all.includes('应用')) addIf('导数应用');
    if (all.includes('练习')) addIf('例题');
  }

  return Array.from(rec).slice(0, 8);
}


