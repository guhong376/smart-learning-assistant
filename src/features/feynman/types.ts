export type AnswerMode = 'text' | 'voice';

export interface FeynmanQuestion {
  id: string;
  knowledgePoint: string;
  question: string;
  hints?: string[];
}

export interface FeynmanAnswer {
  id: string;
  questionId: string;
  mode: AnswerMode;
  content: string; // 文字回答或转写后的文字
  audioUrl?: string; // 语音回答的音频URL
  createdAt: string;
}

export interface AnalysisResult {
  coverage: {
    covered: string[]; // 已覆盖的知识点
    missing: string[]; // 缺失的知识点
  };
  logicGaps: string[]; // 逻辑断层
  commonMistakes: string[]; // 易错点
  score: number; // 0-100
  feedback: string; // 总体反馈
}

export interface WeakPoint {
  id: string;
  knowledgePoint: string;
  questionId: string;
  answerId: string;
  type: 'missing' | 'logic_gap' | 'common_mistake';
  description: string;
  createdAt: string;
}

