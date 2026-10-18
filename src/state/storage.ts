import type { Energy, Task } from './tasks';

const KEY_TASKS = 'spoonful.v1.tasks';
const KEY_ENERGY = 'spoonful.v1.energy';
const KEY_SETTINGS = 'spoonful.v1.settings';

export interface Settings {
  calm: boolean;
}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (e.g. private mode) — the app still works in-session
  }
};

const isTask = (t: unknown): t is Task =>
  !!t &&
  typeof t === 'object' &&
  typeof (t as Task).id === 'string' &&
  typeof (t as Task).title === 'string' &&
  typeof (t as Task).createdAt === 'number' &&
  typeof (t as Task).scheduledFor === 'string' &&
  ((t as Task).effort === 'light' || (t as Task).effort === 'medium' || (t as Task).effort === 'heavy');

export const loadTasks = (): Task[] => {
  const tasks = read<Task[]>(KEY_TASKS, []);
  return Array.isArray(tasks) ? tasks.filter(isTask) : [];
};

export const saveTasks = (tasks: Task[]) => write(KEY_TASKS, tasks);

export const loadEnergy = (): Energy | null => {
  const e = read<Energy | null>(KEY_ENERGY, null);
  return e === 'good' || e === 'okay' || e === 'low' ? e : null;
};

export const saveEnergy = (e: Energy) => write(KEY_ENERGY, e);

export const loadSettings = (): Settings => ({
  calm: read<Settings>(KEY_SETTINGS, { calm: false }).calm === true,
});

export const saveSettings = (s: Settings) => write(KEY_SETTINGS, s);
