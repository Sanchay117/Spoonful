export type Effort = 'light' | 'medium' | 'heavy';
export type Energy = 'good' | 'okay' | 'low';

export interface Task {
  id: string;
  title: string;
  effort: Effort;
  createdAt: number;
  scheduledFor: string;
  completedAt?: number;
  /** Optional, YYYY-MM-DD. Never makes anything red; it only lets a task surface calmly. */
  dueDate?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => dateStr(new Date());

export const dayStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateStr(d);
};

export const tomorrowStr = () => dayStr(1);

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

/** Good days are the risky ones, so even a full tank starts with five. */
export const GOOD_LIMIT = 5;

export const goodSplit = (tasks: Task[]) => {
  const sorted = sortedToday(tasks);
  return { shown: sorted.slice(0, GOOD_LIMIT), more: sorted.slice(GOOD_LIMIT) };
};

/** Tasks due within this many days surface in "Coming up" when they are not on screen. */
export const SOON_DAYS = 3;

export const dueSoon = (tasks: Task[], onScreen: Task[]) => {
  const limit = dayStr(SOON_DAYS);
  return visibleToday(tasks)
    .filter((t) => t.dueDate && t.dueDate <= limit && !onScreen.some((s) => s.id === t.id))
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : effortRank[a.effort] - effortRank[b.effort]));
};

/** Plain words for a due date: "Due today", "Due tomorrow", "Due Thu", "Due Oct 12". Never "overdue". */
export const dueLabel = (due: string) => {
  if (due === todayStr()) return 'Due today';
  if (due === tomorrowStr()) return 'Due tomorrow';
  const [y, m, d] = due.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const inWeek = due > todayStr() && due <= dayStr(6);
  return `Due ${date.toLocaleDateString(undefined, inWeek ? { weekday: 'short' } : { month: 'short', day: 'numeric' })}`;
};

const EFFORTS: Effort[] = ['light', 'medium', 'heavy'];

/** Tapping a pill walks Light → Medium → Heavy → Light. */
export const nextEffort = (e: Effort): Effort => EFFORTS[(EFFORTS.indexOf(e) + 1) % EFFORTS.length];

/** "Harder than it looked" moves a task up one step, stopping at Heavy. */
export const heavierEffort = (e: Effort): Effort => EFFORTS[Math.min(EFFORTS.indexOf(e) + 1, EFFORTS.length - 1)];

export const effortLabel: Record<Effort, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};
