import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const STORAGE = {
  tasks: 'spoonful.v1.tasks',
  energy: 'spoonful.v1.energy',
  settings: 'spoonful.v1.settings',
};

export async function gotoApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

export async function seedTasks(page: Page, tasks: unknown[]) {
  await page.evaluate((payload) => {
    localStorage.setItem('spoonful.v1.tasks', payload);
  }, JSON.stringify(tasks));
  await page.reload();
}

export async function chooseEnergy(page: Page, energy: 'good' | 'okay' | 'low') {
  const name = new RegExp(`^${energy} energy`, 'i');
  // Check-in tiles are buttons; once it closes, the header switch is a radio group.
  const tile = page.getByRole('button', { name });
  if (await tile.count()) await tile.click();
  // The radio is visually hidden inside its label, so skip the hit-target wait.
  else await page.getByRole('radio', { name }).check({ force: true });
}

// Wait until entrance fades finish, so axe measures settled colours, not mid-animation ones.
export async function settle(page: Page) {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __snap?: string };
      const snap = [...document.querySelectorAll('[style]')]
        .filter((el) => !el.closest('[data-aura]'))
        .map((el) => el.getAttribute('style'))
        .join('|');
      const same = w.__snap === snap;
      w.__snap = snap;
      const moving = document.getAnimations().some((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target;
        const looping = a.effect?.getTiming().iterations === Infinity;
        return a.playState === 'running' && !looping && !target?.closest('[data-aura]');
      });
      return same && !moving;
    },
    null,
    { polling: 300, timeout: 5000 }
  );
}

export async function axeCheck(page: Page) {
  await settle(page);
  const results = await new AxeBuilder({ page }).analyze();
  const notable = results.violations.filter((v) => v.id !== 'duplicate-id');
  expect(notable).toEqual([]);
  return results;
}

const pad = (n: number) => String(n).padStart(2, '0');
// Local calendar date, matching the app (UTC would drift around midnight).
export const localDay = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

let seq = 0;
export const task = (title: string, effort: 'light' | 'medium' | 'heavy', overrides: Record<string, unknown> = {}) => ({
  id: `t${++seq}`,
  title,
  effort,
  createdAt: Date.now() + seq,
  scheduledFor: localDay(),
  ...overrides,
});
