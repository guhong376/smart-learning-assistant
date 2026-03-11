import { useMemo, useState } from 'react';
import type { DocumentItem, KnowledgeTag, IndexTask, VectorStatus } from './types';

// Mock 数据：实际应从导入页面或后端获取
function mockDocuments(): DocumentItem[] {
  return [
    {
      id: 'doc1',
      title: '高等数学-导数章节PPT',
      type: 'ppt',
      subject: '数学',
      chapter: '导数',
      knowledgePoints: ['kp-derivative', 'kp-monotone'],
      tags: ['重要', '基础'],
      vectorStatus: 'indexed',
      indexedAt: '2026-01-20T10:00:00Z',
      fileSize: 1024 * 1024 * 5,
      createdAt: '2026-01-19T08:00:00Z'
    },
    {
      id: 'doc2',
      title: '物理-电磁感应录音',
      type: 'audio',
      subject: '物理',
      chapter: '电磁学',
      knowledgePoints: ['kp-common'],
      tags: ['录音'],
      vectorStatus: 'indexed',
      indexedAt: '2026-01-20T11:00:00Z',
      fileSize: 1024 * 1024 * 20,
      createdAt: '2026-01-19T09:00:00Z'
    },
    {
      id: 'doc3',
      title: '函数图像笔记',
      type: 'note',
      subject: '数学',
      chapter: '函数',
      knowledgePoints: ['kp-function'],
      tags: [],
      vectorStatus: 'pending',
      createdAt: '2026-01-21T14:00:00Z'
    },
    {
      id: 'doc4',
      title: '极限练习题',
      type: 'pdf',
      subject: '数学',
      chapter: '极限',
      knowledgePoints: ['kp-limit'],
      tags: ['练习'],
      vectorStatus: 'failed',
      errorMessage: 'OCR识别失败，请检查文件格式',
      createdAt: '2026-01-22T10:00:00Z'
    }
  ];
}

function mockTags(): KnowledgeTag[] {
  return [
    {
      id: 'kp-derivative',
      name: '导数',
      alias: ['微商', '导函数'],
      level: 1,
      documentCount: 5
    },
    {
      id: 'kp-monotone',
      name: '单调性',
      parentId: 'kp-derivative',
      level: 2,
      documentCount: 3
    },
    {
      id: 'kp-function',
      name: '函数',
      level: 1,
      documentCount: 8
    },
    {
      id: 'kp-limit',
      name: '极限',
      level: 1,
      documentCount: 4
    }
  ];
}

export function useKnowledgeBase() {
  const [documents, setDocuments] = useState<DocumentItem[]>(mockDocuments());
  const [tags, setTags] = useState<KnowledgeTag[]>(mockTags());
  const [indexTasks, setIndexTasks] = useState<IndexTask[]>([]);

  const byStatus = useMemo(() => {
    const m: Record<VectorStatus, DocumentItem[]> = {
      indexed: [],
      pending: [],
      failed: [],
      processing: []
    };
    for (const d of documents) m[d.vectorStatus].push(d);
    return m;
  }, [documents]);

  const bySubject = useMemo(() => {
    const m: Record<string, DocumentItem[]> = {};
    for (const d of documents) {
      const subj = d.subject || '未分类';
      (m[subj] ||= []).push(d);
    }
    return m;
  }, [documents]);

  return {
    documents,
    tags,
    indexTasks,
    byStatus,
    bySubject,
    updateDocumentStatus: (id: string, status: VectorStatus, errorMessage?: string) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                vectorStatus: status,
                indexedAt: status === 'indexed' ? new Date().toISOString() : d.indexedAt,
                errorMessage
              }
            : d
        )
      );
    },
    retryIndex: (id: string) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, vectorStatus: 'processing' as VectorStatus } : d))
      );
      // Mock: 模拟处理
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, vectorStatus: 'indexed' as VectorStatus, indexedAt: new Date().toISOString() }
              : d
          )
        );
      }, 2000);
    },
    createTag: (tag: Omit<KnowledgeTag, 'id' | 'documentCount'>) => {
      const newTag: KnowledgeTag = {
        ...tag,
        id: `tag_${Date.now()}`,
        documentCount: 0
      };
      setTags((prev) => [...prev, newTag]);
      return newTag;
    },
    updateTag: (id: string, patch: Partial<KnowledgeTag>) => {
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    mergeTags: (sourceId: string, targetId: string) => {
      const source = tags.find((t) => t.id === sourceId);
      const target = tags.find((t) => t.id === targetId);
      if (!source || !target) return;
      // 合并别名
      const mergedAlias = [...(target.alias || []), source.name, ...(source.alias || [])].filter(
        (v, i, arr) => arr.indexOf(v) === i
      );
      setTags((prev) => prev.filter((t) => t.id !== sourceId));
      setTags((prev) => prev.map((t) => (t.id === targetId ? { ...t, alias: mergedAlias } : t)));
    },
    triggerRebuild: () => {
      const task: IndexTask = {
        id: `task_${Date.now()}`,
        type: 'rebuild',
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString()
      };
      setIndexTasks((prev) => [...prev, task]);
      // Mock: 模拟进度
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setIndexTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress } : t))
        );
        if (progress >= 100) {
          clearInterval(interval);
          setIndexTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
                : t
            )
          );
        }
      }, 500);
    },
    triggerOptimize: () => {
      const task: IndexTask = {
        id: `task_${Date.now()}`,
        type: 'optimize',
        status: 'running',
        startedAt: new Date().toISOString()
      };
      setIndexTasks((prev) => [...prev, task]);
      setTimeout(() => {
        setIndexTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
              : t
          )
        );
      }, 3000);
    }
  };
}

