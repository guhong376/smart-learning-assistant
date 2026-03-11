export type VisionExtraction = {
  promptText: string; // 题干/说明（mock）
  keywords: string[];
  formulas?: string[]; // mock LaTeX strings
};

export type HitSource = 'ppt' | 'audio' | 'whiteboard' | 'note' | 'video' | 'article';

export type SearchHit = {
  id: string;
  source: HitSource;
  title: string;
  snippet: string;
  score: number; // 0..1
  // 定位信息（根据来源不同）
  location:
    | { type: 'ppt_page'; fileName: string; page: number }
    | { type: 'audio_ts'; fileName: string; startSec: number; endSec: number }
    | { type: 'note_anchor'; noteTitle: string; anchor: string }
    | { type: 'whiteboard_photo'; fileName: string }
    | { type: 'external_url'; label: string; url: string };
};

export type AiSolutionRef = {
  hitId: string;
  title: string;
  source: HitSource;
  score: number; // 0..1
};

export type AiSolution = {
  answer: string; // 最终答案（简洁）
  steps: string[]; // 分步解析
  keyPoints: string[]; // 核心知识点/易错点
  confidence: number; // 0..1
  refs: AiSolutionRef[]; // 引用的命中来源
};


