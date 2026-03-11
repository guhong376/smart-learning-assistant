import { useMemo, useState } from 'react';
import type { PlanGoal, PlanTask, SubjectPlan } from './types';
import { generateMockPlan } from './mockPlanner';
import { toYmd } from './date';

function defaultSubjects(): SubjectPlan[] {
  return [
    { id: 'math', name: '数学', weight: 5 },
    { id: 'english', name: '英语', weight: 3 },
    { id: 'physics', name: '物理', weight: 3 }
  ];
}

export function usePlan() {
  const [goal, setGoal] = useState<PlanGoal>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return {
      examDate: toYmd(d),
      dailyMinutes: 120,
      subjects: defaultSubjects()
    };
  });

  const [tasks, setTasks] = useState<PlanTask[]>([]);

  const tasksByDate = useMemo(() => {
    const m: Record<string, PlanTask[]> = {};
    for (const t of tasks) (m[t.date] ||= []).push(t);
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.priority - b.priority));
    return m;
  }, [tasks]);

  return {
    goal,
    setGoal,
    tasks,
    tasksByDate,
    generate: () => setTasks(generateMockPlan(goal)),
    toggleDone: (id: string) =>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t))),
    updateTask: (id: string, patch: Partial<PlanTask>) =>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  };
}


