import type { SearchHit, VisionExtraction } from './types';

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export async function mockSearchByExtraction(ex: VisionExtraction): Promise<SearchHit[]> {
  await new Promise((r) => setTimeout(r, 550));

  const has = (k: string) => ex.keywords.some((x) => x.includes(k) || k.includes(x));

  const hits: SearchHit[] = [];

  // PPT 命中
  hits.push({
    id: id(),
    source: 'ppt',
    title: has('导数') ? '高数-导数应用（讲义）' : '章节讲义（PPT）',
    snippet: has('导数') ? '单调性判定、极值与最值的典型例题与易错点。' : '与题目关键词高度相关的章节页面。',
    score: clamp01(0.86 + (has('导数') ? 0.08 : 0)),
    location: { type: 'ppt_page', fileName: '高数-导数应用.pptx', page: has('单调') ? 12 : 8 }
  });

  // 录音命中
  hits.push({
    id: id(),
    source: 'audio',
    title: '课堂录音-第 7 讲',
    snippet: has('单调') ? '老师强调“先求导再讨论符号”的流程与常见陷阱。' : '关键词对应的讲解片段。',
    score: clamp01(0.78 + (has('单调') ? 0.1 : 0)),
    location: { type: 'audio_ts', fileName: '第7讲.m4a', startSec: 18 * 60 + 12, endSec: 21 * 60 + 5 }
  });

  // 板书照片命中
  hits.push({
    id: id(),
    source: 'whiteboard',
    title: '板书照片（节选）',
    snippet: '板书推导步骤与关键结论（可用于回看原始思路）。',
    score: 0.71,
    location: { type: 'whiteboard_photo', fileName: '板书-2026-01-12-导数.jpg' }
  });

  // 笔记命中
  hits.push({
    id: id(),
    source: 'note',
    title: 'GoodNotes 笔记：导数应用',
    snippet: '你的批注：极值点判定要注意端点与不可导点。',
    score: 0.74,
    location: { type: 'note_anchor', noteTitle: '导数应用笔记', anchor: 'p.3#极值判定' }
  });

  // 第三方资源（示例）
  if (has('导数') || has('概率')) {
    hits.push({
      id: id(),
      source: 'video',
      title: 'B站：专题讲解（示例）',
      snippet: '把同类题的通用套路讲清楚（关键帧已标注）。',
      score: 0.62,
      // 使用可解析的 BV 链接，便于在“第三方资源整合”里自动创建/定位对应资源
      location: { type: 'external_url', label: '打开视频', url: 'https://www.bilibili.com/video/BV1xx411c7mD/' }
    });
  }

  return hits.sort((a, b) => b.score - a.score);
}


