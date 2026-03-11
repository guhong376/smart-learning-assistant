import React, { useMemo } from 'react';
import { Button, Card, Modal, Space, Tag, Typography, message } from 'antd';

export type PptViewerPage = { page: number; text: string };

export function PptViewerModal({
  open,
  fileName,
  page,
  pages,
  filePath,
  onClose,
  onPageChange
}: {
  open: boolean;
  fileName: string;
  page: number;
  pages: PptViewerPage[];
  filePath?: string;
  onClose: () => void;
  onPageChange: (page: number) => void;
}) {
  const total = pages.length || 1;
  const current = Math.min(Math.max(1, page), total);
  const pageText = useMemo(() => pages.find((p) => p.page === current)?.text ?? '', [pages, current]);
  const [msgApi, msgCtx] = message.useMessage();

  return (
    <Modal
      title="PPT 预览"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="prev" disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
          上一页
        </Button>,
        <Button key="next" type="primary" disabled={current >= total} onClick={() => onPageChange(current + 1)}>
          下一页
        </Button>
      ]}
      width={860}
    >
      {msgCtx}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Tag color="blue">{fileName}</Tag>
          <Tag>
            第 {current} / {total} 页
          </Tag>
          <Button
            type="primary"
            size="small"
            disabled={!filePath}
            onClick={async () => {
              if (!filePath) {
                msgApi.info('没有本地路径，无法打开原文件');
                return;
              }
              if (!window.sla?.openPath) {
                msgApi.info('需要桌面端（Electron）才能打开本机文件');
                return;
              }
              const res = await window.sla.openPath(filePath);
              if (res.ok) msgApi.success('已打开原文件');
              else msgApi.error(`打开失败：${res.error}`);
            }}
          >
            打开原文件
          </Button>
        </Space>

        <Card
          style={{
            minHeight: 420,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(15,23,42,0.10)'
          }}
        >
          <div
            style={{
              height: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
              borderRadius: 12
            }}
          >
            <div style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                第 {current} 页内容
              </Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0, lineHeight: 1.7 }}>
                {pageText || '（本页无可显示文本）'}
              </Typography.Paragraph>
            </div>
          </div>
        </Card>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          提示：如需查看真实 PPT 页面，请点击上方“打开原文件”（将使用系统默认程序打开）。
        </Typography.Text>
      </Space>
    </Modal>
  );
}


