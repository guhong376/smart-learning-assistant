import type { PlanGoal, PlanTask, PlanTaskType } from './types';
import { addDays, daysBetweenInclusive, parseYmd, toYmd } from './date';

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const typeTitles: Record<PlanTaskType, string> = {
  review: '复习讲义/笔记',
  practice: '练习同类题',
  feynman: '费曼自测',
  mistakes: '错题回顾'
};

export function generateMockPlan(goal: PlanGoal): PlanTask[] {
  const today = new Date();
  const exam = parseYmd(goal.examDate);
  const days = daysBetweenInclusive(today, exam);
  if (!days) return [];

  const subjects = goal.subjects.filter((s) => s.name.trim().length > 0 && s.weight > 0);
  if (!subjects.length) return [];

  const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0);

  const tasks: PlanTask[] = [];

  for (let i = 0; i < days; i++) {
    const date = toYmd(addDays(today, i));
    const daily = goal.dailyMinutes;

    // 每天固定留出 10% 给错题回顾（至少 10 分钟）
    const mistakesMin = Math.max(10, Math.round(daily * 0.1));
    const remaining = Math.max(0, daily - mistakesMin);

    tasks.push({
      id: id(),
      date,
      subject: '全科',
      type: 'mistakes',
      title: `${typeTitles.mistakes}（今日重点）`,
      minutes: mistakesMin,
      priority: 1,
      status: 'todo'
    });

    for (const s of subjects) {
      const share = Math.round((remaining * s.weight) / totalWeight);
      if (share < 15) continue;

      // 临近考试：更多 practice；前期 review；每天都有少量 feynman
      const near = i > Math.floor(days * 0.65);
      const reviewMin = near ? Math.round(share * 0.35) : Math.round(share * 0.55);
      const practiceMin = near ? Math.round(share * 0.5) : Math.round(share * 0.3);
      const feynmanMin = Math.max(10, share - reviewMin - practiceMin);

      const make = (type: PlanTaskType, minutes: number, priority: number) => {
        if (minutes < 10) return;
        tasks.push({
          id: id(),
          date,
          subject: s.name,
          type,
          title: `${s.name}：${typeTitles[type]}`,
          minutes,
          priority,
          status: 'todo'
        });
      };

      make('review', reviewMin, 2);
      make('practice', practiceMin, 2);
      make('feynman', feynmanMin, 3);
    }
  }

  return tasks;
}


