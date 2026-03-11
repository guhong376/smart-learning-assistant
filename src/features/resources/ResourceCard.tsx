import React from 'react';
import { Card, Space, Tag, Typography, Button, Popover } from 'antd';
import { PlayCircleOutlined, FileTextOutlined, LinkOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AnyResource, BilibiliResource, ZhihuResource, NoteResource } from './types';

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onJump
}: {
  resource: AnyResource;
  onEdit?: () => void;
  onDelete?: () => void;
  onJump?: () => void;
}) {
  const icon =
    resource.type === 'bilibili' ? (
      <PlayCircleOutlined style={{ fontSize: 20, color: '#fb7299' }} />
    ) : resource.type === 'zhihu' ? (
      <FileTextOutlined style={{ fontSize: 20, color: '#0084ff' }} />
    ) : (
      <LinkOutlined style={{ fontSize: 20 }} />
    );

  const typeLabel = resource.type === 'bilibili' ? 'B站' : resource.type === 'zhihu' ? '知乎' : resource.type === 'note' ? '笔记' : '其他';

  const extra = (
    <Space>
      {onJump && (
        <Button type="link" size="small" onClick={onJump}>
          跳转
        </Button>
      )}
      {onEdit && (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={onEdit}>
          编辑
        </Button>
      )}
      {onDelete && (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={onDelete}>
          删除
        </Button>
      )}
    </Space>
  );

  const keyframesInfo =
    resource.type === 'bilibili' && (resource as BilibiliResource).keyframes.length > 0 ? (
      <Tag color="blue">{(resource as BilibiliResource).keyframes.length} 个关键帧</Tag>
    ) : null;

  const summaryInfo = resource.type === 'zhihu' && (resource as ZhihuResource).summary ? (
    <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
      {(resource as ZhihuResource).summary}
    </Typography.Text>
  ) : null;

  return (
    <Card
      size="small"
      style={{ marginBottom: 12 }}
      title={
        <Space>
          {icon}
          <Typography.Text strong>{resource.title}</Typography.Text>
          <Tag>{typeLabel}</Tag>
        </Space>
      }
      extra={extra}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {resource.description && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {resource.description}
          </Typography.Text>
        )}
        {summaryInfo}
        {keyframesInfo}
        {resource.knowledgePoints.length > 0 && (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              关联知识点：
            </Typography.Text>
            <Space wrap size={4}>
              {resource.knowledgePoints.map((kp) => (
                <Tag key={kp} color="purple" style={{ margin: 0, fontSize: 11 }}>
                  {kp}
                </Tag>
              ))}
            </Space>
          </div>
        )}
        {resource.tags.length > 0 && (
          <div>
            <Space wrap size={4}>
              {resource.tags.map((tag) => (
                <Tag key={tag} style={{ margin: 0, fontSize: 11 }}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}
        <Typography.Link
          href={resource.url}
          target="_blank"
          style={{ fontSize: 12 }}
          onClick={(e) => {
            if (onJump) {
              e.preventDefault();
              onJump();
            }
          }}
        >
          {resource.url}
        </Typography.Link>
      </Space>
    </Card>
  );
}

