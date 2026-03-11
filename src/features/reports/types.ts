export interface LearningMetrics {
  relevance: number; // 课堂片段与作业知识点相关度 (0-100)
  reinforcementCount: number; // 薄弱点强化次数
  feynmanAccuracy: number; // 费曼问答准确率 (0-100)
  reviewIntensity: number; // 复习强度 (0-100)
  mistakeRate: number; // 错误率 (0-100)
}

export interface TrendData {
  date: string; // YYYY-MM-DD
  relevance: number;
  feynmanAccuracy: number;
  mistakeRate: number;
  reviewIntensity: number;
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'achievement' | 'improvement' | 'warning';
}

export interface WeakPointDistribution {
  byChapter: Array<{ chapter: string; count: number }>;
  byKnowledgePoint: Array<{ knowledgePoint: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
}

export interface Recommendation {
  id: string;
  type: 'material' | 'question' | 'review';
  title: string;
  description: string;
  targetKnowledgePoint: string;
  actionUrl?: string;
}

