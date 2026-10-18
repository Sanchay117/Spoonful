export type Effort = 'light' | 'medium' | 'heavy';
export type Energy = 'good' | 'okay' | 'low';

export interface Task {
  id: string;
  title: string;
  effort: Effort;
  createdAt: number;
  scheduledFor: string;
  completedAt?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => dateStr(new Date());

export const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateStr(d);
};

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const effortRank: Record<Effort, number> = { light: 0, medium: 1, heavy: 2 };

export const sortTasks = (tasks: Task[]) =>
  [...tasks].sort((a, b) => effortRank[a.effort] - effortRank[b.effort] || a.createdAt - b.createdAt);

export const visibleToday = (tasks: Task[]) =>
  tasks.filter((t) => !t.completedAt && t.scheduledFor <= todayStr());

export const sortedToday = (tasks: Task[]) => sortTasks(visibleToday(tasks));

export const pickForLow = (tasks: Task[]) =>
  sortedToday(tasks).find((t) => t.effort === 'light') ?? null;

export const okaySplit = (tasks: Task[]) => {
  const sorted = sortedToday(tasks);
  const shown = sorted.filter((t) => t.effort !== 'heavy').slice(0, 3);
  const resting = sorted.filter((t) => !shown.includes(t));
  return { shown, resting };
};

export const effortLabel: Record<Effort, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};
