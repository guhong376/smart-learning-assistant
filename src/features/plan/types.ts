export type SubjectPlan = {
  id: string;
  name: string; // 科目名
  weight: number; // 1..5
};

export type PlanGoal = {
  examDate: string; // YYYY-MM-DD
  dailyMinutes: number; // 每天可用分钟数
  subjects: SubjectPlan[];
};

export type PlanTaskType = 'review' | 'practice' | 'feynman' | 'mistakes';
export type PlanTaskStatus = 'todo' | 'done';

export type PlanTask = {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
  type: PlanTaskType;
  title: string;
  minutes: number;
  priority: number; // 1(高) - 5(低)
  status: PlanTaskStatus;
};


