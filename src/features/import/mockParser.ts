import type { ImportSourceKind, ParsedResult } from './types';

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function guessKind(fileName: string, mimeType: string): ImportSourceKind {
  const lower = fileName.toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'ppt';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.includes('goodnotes') || lower.endsWith('.note') || lower.endsWith('.md')) return 'note';
  return 'other';
}

export function buildMockResult(fileName: string, kind: ImportSourceKind): ParsedResult {
  const seed = hashString(fileName);
  const pick = (n: number) => (seed % n) + 1;

  if (kind === 'image') {
    return {
      kind: 'image_ocr',
      blocks: [
        { text: `识别到题干：${fileName.replace(/\.[^.]+$/, '')}`, confidence: 0.86 },
        { text: '关键字：函数、导数、单调性', confidence: 0.73 },
        { text: '建议：回看“导数应用-单调性与极值”', confidence: 0.62 }
      ]
    };
  }

  if (kind === 'audio') {
    const base = pick(6);
    const seg = (i: number) => ({
      startMs: i * 23_000,
      endMs: i * 23_000 + 21_000,
      text: `第 ${base + i} 段：老师讲解“${['定义', '例题', '易错点', '总结'][i % 4]}”…`
    });
    return { kind: 'audio_transcript', segments: [seg(0), seg(1), seg(2), seg(3)] };
  }

  if (kind === 'ppt' || kind === 'pdf' || kind === 'note') {
    const pages = Array.from({ length: Math.min(6, 3 + pick(5)) }).map((_, idx) => ({
      page: idx + 1,
      text: `第 ${idx + 1} 页：${['概念', '公式', '例题', '推导', '应用', '练习'][idx % 6]} - ${fileName}`
    }));
    return { kind: 'slides_text', pages };
  }

  return { kind: 'generic_text', text: `已提取文本：${fileName}` };
}


