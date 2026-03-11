import { useEffect, useMemo, useState } from 'react';
import type {
  AnyResource,
  BilibiliResource,
  Keyframe,
  ZhihuResource,
  NoteResource,
  ResourceType,
  ResourceHistoryEntry,
  ResourceHistoryAction
} from './types';

const RES_KEY = 'sla.resources.v1';
const HIST_KEY = 'sla.resources.history.v1';

function parseBilibiliUrl(url: string): { videoId: string; title?: string } | null {
  // BV号: https://www.bilibili.com/video/BVxxxxx
  // 短链接: https://b23.tv/xxxxx
  const bvMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  if (bvMatch) return { videoId: bvMatch[1] };
  return null;
}

function parseZhihuUrl(url: string): { articleId: string } | null {
  // https://zhuanlan.zhihu.com/p/xxxxx
  const match = url.match(/zhuanlan\.zhihu\.com\/p\/(\d+)/);
  if (match) return { articleId: match[1] };
  return null;
}

function createResourceFromUrl(url: string, type?: ResourceType): AnyResource | null {
  const now = new Date().toISOString();
  const id = `res_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  if (type === 'bilibili' || (!type && url.includes('bilibili.com'))) {
    const parsed = parseBilibiliUrl(url);
    if (!parsed) return null;
    return {
      id,
      type: 'bilibili',
      title: `B站视频 ${parsed.videoId}`,
      url,
      videoId: parsed.videoId,
      keyframes: [],
      knowledgePoints: [],
      tags: [],
      createdAt: now,
      updatedAt: now
    } as BilibiliResource;
  }

  if (type === 'zhihu' || (!type && url.includes('zhihu.com'))) {
    const parsed = parseZhihuUrl(url);
    if (!parsed) return null;
    return {
      id,
      type: 'zhihu',
      title: `知乎文章 ${parsed.articleId}`,
      url,
      articleId: parsed.articleId,
      summary: '',
      viewpoints: [],
      comments: [],
      knowledgePoints: [],
      tags: [],
      createdAt: now,
      updatedAt: now
    } as ZhihuResource;
  }

  if (type === 'note' || (!type && (url.startsWith('goodnotes://') || url.startsWith('notability://')))) {
    return {
      id,
      type: 'note',
      title: '笔记链接',
      url,
      noteApp: url.includes('goodnotes') ? 'GoodNotes' : 'Notability',
      highlights: [],
      annotations: [],
      knowledgePoints: [],
      tags: [],
      createdAt: now,
      updatedAt: now
    } as NoteResource;
  }

  return {
    id,
    type: 'other',
    title: '外部资源',
    url,
    knowledgePoints: [],
    tags: [],
    createdAt: now,
    updatedAt: now
  };
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mkHist(action: ResourceHistoryAction, title: string, url?: string, resourceId?: string): ResourceHistoryEntry {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    ts: Date.now(),
    action,
    resourceId,
    title,
    url
  };
}

export function useResources() {
  const [resources, setResources] = useState<AnyResource[]>(() => safeJsonParse(localStorage.getItem(RES_KEY), []));
  const [history, setHistory] = useState<ResourceHistoryEntry[]>(() => safeJsonParse(localStorage.getItem(HIST_KEY), []));

  useEffect(() => {
    try {
      localStorage.setItem(RES_KEY, JSON.stringify(resources));
    } catch {
      // ignore
    }
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const byType = useMemo(() => {
    const m: Record<string, AnyResource[]> = {};
    for (const r of resources) (m[r.type] ||= []).push(r);
    return m;
  }, [resources]);

  return {
    resources,
    byType,
    history: useMemo(() => [...history].sort((a, b) => b.ts - a.ts), [history]),
    recordExternalJump: (title: string, url: string) => {
      setHistory((prev) => [mkHist('jump', title, url), ...prev].slice(0, 200));
    },
    add: (url: string, type?: ResourceType) => {
      const res = createResourceFromUrl(url, type);
      if (res) {
        setResources((prev) => [...prev, res]);
        setHistory((prev) => [mkHist('add', `添加资源：${res.title}`, res.url, res.id), ...prev].slice(0, 200));
      }
      return res;
    },
    update: (id: string, patch: Partial<AnyResource>) => {
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
      );
      const r = resources.find((x) => x.id === id);
      if (r) setHistory((prev) => [mkHist('update', `更新资源：${r.title}`, r.url, r.id), ...prev].slice(0, 200));
    },
    remove: (id: string) => {
      const r = resources.find((x) => x.id === id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (r) setHistory((prev) => [mkHist('delete', `删除资源：${r.title}`, r.url, r.id), ...prev].slice(0, 200));
    },
    recordJump: (id: string) => {
      const r = resources.find((x) => x.id === id);
      if (!r) return;
      setHistory((prev) => [mkHist('jump', `跳转：${r.title}`, r.url, r.id), ...prev].slice(0, 200));
    },
    addKeyframe: (id: string, keyframe: Keyframe) => {
      setResources((prev) =>
        prev.map((r) => {
          if (r.id === id && r.type === 'bilibili') {
            const br = r as BilibiliResource;
            return { ...br, keyframes: [...br.keyframes, keyframe], updatedAt: new Date().toISOString() };
          }
          return r;
        })
      );
    },
    removeKeyframe: (id: string, keyframeId: string) => {
      setResources((prev) =>
        prev.map((r) => {
          if (r.id === id && r.type === 'bilibili') {
            const br = r as BilibiliResource;
            return { ...br, keyframes: br.keyframes.filter((k) => k.id !== keyframeId), updatedAt: new Date().toISOString() };
          }
          return r;
        })
      );
    }
  };
}

