import { useMemo, useState } from 'react';
import type { LearningMetrics, TrendData, Milestone, WeakPointDistribution, Recommendation } from './types';

function mockTrendData(): TrendData[] {
  const days = 30;
  const data: TrendData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      relevance: 60 + Math.random() * 30 + (days - i) * 0.5,
      feynmanAccuracy: 50 + Math.random() * 40 + (days - i) * 0.3,
      mistakeRate: 30 - Math.random() * 15 - (days - i) * 0.2,
      reviewIntensity: 40 + Math.random() * 40
    });
  }
  return data;
}

function mockMilestones(): Milestone[] {
  return [
    {
      id: 'm1',
      date: '2026-01-15',
      title: '连续7天完成复习计划',
      description: '保持良好学习节奏',
      type: 'achievement'
    },
    {
      id: 'm2',
      date: '2026-01-20',
      title: '费曼问答准确率提升至80%',
      description: '导数相关知识点掌握度显著提升',
      type: 'improvement'
    },
    {
      id: 'm3',
      date: '2026-01-25',
      title: '薄弱点强化次数达到50次',
      description: '持续巩固薄弱环节',
      type: 'achievement'
    }
  ];
}

function mockWeakPointDistribution(): WeakPointDistribution {
  return {
    byChapter: [
      { chapter: '导数', count: 12 },
      { chapter: '函数', count: 8 },
      { chapter: '极限', count: 5 },
      { chapter: '电磁学', count: 3 }
    ],
    byKnowledgePoint: [
      { knowledgePoint: '导数定义', count: 8 },
      { knowledgePoint: '单调性判断', count: 6 },
      { knowledgePoint: '函数图像', count: 4 },
      { knowledgePoint: '极限计算', count: 3 }
    ],
    byType: [
      { type: '缺失知识点', count: 15 },
      { type: '逻辑断层', count: 8 },
      { type: '易错点', count: 5 }
    ]
  };
}

function mockRecommendations(): Recommendation[] {
  return [
    {
      id: 'r1',
      type: 'material',
      title: '导数章节PPT',
      description: '建议复习导数定义与几何意义',
      targetKnowledgePoint: '导数定义',
      actionUrl: '/import'
    },
    {
      id: 'r2',
      type: 'question',
      title: '同类题目练习',
      description: '单调性判断相关题目',
      targetKnowledgePoint: '单调性判断',
      actionUrl: '/photo-search'
    },
    {
      id: 'r3',
      type: 'review',
      title: '费曼问答练习',
      description: '针对函数图像知识点进行问答',
      targetKnowledgePoint: '函数图像',
      actionUrl: '/feynman'
    }
  ];
}

export function useReports() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [metrics] = useState<LearningMetrics>({
    relevance: 75,
    reinforcementCount: 52,
    feynmanAccuracy: 82,
    reviewIntensity: 68,
    mistakeRate: 18
  });

  const trendData = useMemo(() => {
    const data = mockTrendData();
    if (period === 'week') {
      return data.slice(-7);
    }
    return data;
  }, [period]);

  const milestones = useMemo(() => mockMilestones(), []);
  const weakPointDistribution = useMemo(() => mockWeakPointDistribution(), []);
  const recommendations = useMemo(() => mockRecommendations(), []);

  return {
    period,
    setPeriod,
    metrics,
    trendData,
    milestones,
    weakPointDistribution,
    recommendations
  };
}

