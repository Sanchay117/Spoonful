import type { Effort, Task } from './tasks';
import { todayStr } from './tasks';

const DEMO: [string, Effort][] = [
  ['Take morning meds with breakfast', 'light'],
  ['Reply to Prof. Chen about the extension', 'light'],
  ['Fill the water bottle and keep it close', 'light'],
  ['Stretch for five minutes', 'light'],
  ['Text Mom back', 'light'],
  ['Put the library books by the door', 'light'],
  ['Wipe down the desk', 'light'],
  ['Pay the wifi bill', 'light'],
  ['Read chapter 4 and take rough notes', 'medium'],
  ['Laundry (one load, fold tomorrow)', 'medium'],
  ['Meal-prep the big pot of soup', 'medium'],
  ['Book the dentist check-up', 'medium'],
  ['Submit the housing form', 'medium'],
  ['Write the lab report intro', 'medium'],
  ['Review quiz slides for 20 minutes', 'medium'],
  ['Stats problem set, questions 1–6', 'heavy'],
  ['Draft the essay (1000 words)', 'heavy'],
  ['Big grocery run', 'heavy'],
  ['Group project slides + sync notes', 'heavy'],
  ['Deep-clean the kitchen', 'heavy'],
];

export const makeDemoTasks = (): Task[] =>
  DEMO.map(([title, effort], i) => ({
    id: `demo-${i + 1}`,
    title,
    effort,
    createdAt: Date.now() - (DEMO.length - i) * 60_000,
    scheduledFor: todayStr(),
  }));
