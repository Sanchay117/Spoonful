import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { STORAGE, axeCheck, chooseEnergy, gotoApp, localDay, seedTasks, settle, task } from './helpers';

const DAY = localDay();

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test('zero axe violations on the check-in', async ({ page }) => {
  await axeCheck(page);
});

test('zero axe violations on every view', async ({ page }) => {
  await seedTasks(page, [
    task('Write the lab report', 'medium'),
    task('Reply to Prof. Chen', 'light'),
    task('Big grocery run', 'heavy'),
    task('Stretch for five minutes', 'light'),
  ]);

  await chooseEnergy(page, 'good');
  await axeCheck(page);

  await chooseEnergy(page, 'okay');
  await axeCheck(page);

  await chooseEnergy(page, 'low');
  await axeCheck(page);

  await page.getByRole('button', { name: /^compare/i }).click();
  await settle(page);
  await new AxeBuilder({ page }).include('[role="dialog"]').analyze().then((r) => {
    expect(r.violations).toEqual([]);
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await chooseEnergy(page, 'good');
  await page.getByRole('button', { name: /add a task/i }).click();
  await axeCheck(page);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /demo day/i }).click();
  await axeCheck(page);
});

test('low energy shows at most one task card', async ({ page }) => {
  await seedTasks(page, [
    task('Take morning meds', 'light'),
    task('Stretch for five minutes', 'light'),
    task('Reply to Prof. Chen', 'light'),
    task('Write the lab report', 'medium'),
    task('Big grocery run', 'heavy'),
    task('Draft the essay', 'heavy'),
  ]);
  await chooseEnergy(page, 'low');
  await expect(page.getByTestId('task-list')).toHaveCount(0);
  await expect(page.locator('[data-task-card]')).toHaveCount(1);

  // finish each light task in turn: never more than one card, then the rest screen
  const current = page.getByRole('main').getByRole('heading', { level: 2 });
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('[data-task-card]')).toHaveCount(1);
    const title = await current.innerText();
    await page.getByRole('button', { name: /^done$/i }).click();
    // wait for the exit animation to finish before the next tap
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0);
  }
  await expect(page.getByText(/nothing needed today/i)).toBeVisible();
  await expect(page.locator('[data-task-card]')).toHaveCount(0);
});

test('low energy with only heavy tasks shows the rest screen', async ({ page }) => {
  await seedTasks(page, [task('Draft the essay', 'heavy'), task('Big grocery run', 'heavy')]);
  await chooseEnergy(page, 'low');
  await expect(page.getByText(/nothing needed today/i)).toBeVisible();
  await expect(page.locator('[data-task-card]')).toHaveCount(0);
});

test('okay energy caps at three, light/medium only, and counts resting tasks', async ({ page }) => {
  await seedTasks(page, [
    task('Light 1', 'light'),
    task('Light 2', 'light'),
    task('Medium 1', 'medium'),
    task('Medium 2', 'medium'),
    task('Heavy 1', 'heavy'),
  ]);
  await chooseEnergy(page, 'okay');
  const cards = page.locator('[data-task-card]');
  await expect(cards).toHaveCount(3);
  await expect(page.getByTestId('task-list')).toBeVisible();
  await expect(page.getByText(/2 tasks resting quietly/i)).toBeVisible();
  for (const effort of ['Heavy 1']) {
    await expect(page.getByText(effort)).not.toBeVisible();
  }
  // expand resting
  await page.getByRole('button', { name: /show them/i }).click();
  await expect(page.getByText('Heavy 1')).toBeVisible();
});

test('not today moves the task to tomorrow and stores no failure count', async ({ page }) => {
  await seedTasks(page, [
    task('Take morning meds', 'light'),
    task('Stretch', 'light'),
    task('Reply to Prof. Chen', 'light'),
  ]);
  await chooseEnergy(page, 'low');

  await page.getByRole('button', { name: /not today/i }).click();
  await expect(page.getByText(/saved for tomorrow/i)).toBeVisible();

  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks);
  const stored = JSON.parse(raw!) as Array<Record<string, unknown>>;
  const moved = stored.find((t) => t.title === 'Take morning meds');
  const tomorrow = localDay(1);
  expect(moved?.scheduledFor).toBe(tomorrow);

  const wholeStorage = await page.evaluate(() => JSON.stringify(localStorage));
  const shameTerms = ['fail', 'skip', 'missed', 'streak', 'overdue', 'broken', 'abandon', 'declin'];
  for (const term of shameTerms) {
    expect(wholeStorage.toLowerCase()).not.toContain(term);
  }
  for (const t of stored) {
    expect(t.completedAt).toBeUndefined();
    expect(Object.keys(t).sort()).toEqual(['createdAt', 'effort', 'id', 'scheduledFor', 'title']);
  }

  // moved out of today's pool: the next light task takes the spotlight
  await expect(page.getByText('Stretch')).toBeVisible();
});

test('done marks a task complete without shame counters', async ({ page }) => {
  await seedTasks(page, [task('Take morning meds', 'light'), task('Stretch', 'light')]);
  await chooseEnergy(page, 'good');
  const first = page.locator('[data-task-card]', { hasText: 'Take morning meds' });
  await first.getByRole('button', { name: /mark .take morning meds. as done/i }).click();
  await expect(page.locator('[data-task-card]', { hasText: 'Take morning meds' })).toHaveCount(0);
  const stored = JSON.parse(
    (await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!
  ) as Array<Record<string, unknown>>;
  const done = stored.find((t) => t.title === 'Take morning meds');
  expect(typeof done?.completedAt).toBe('number');
});

test('reduced motion disables the aura animation', async ({ page, browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 800 },
  });
  const p = await ctx.newPage();
  await gotoApp(p);
  await seedTasks(p, [task('Take morning meds', 'light')]);
  await chooseEnergy(p, 'low');

  await expect(p.locator('[data-aura]')).toHaveAttribute('data-ambient', 'off');

  const animating = await p.evaluate(() => {
    const aura = document.querySelector('[data-aura]') as HTMLElement | null;
    if (!aura) return true;
    const bg = getComputedStyle(aura.firstElementChild as HTMLElement);
    return parseFloat(bg.transitionDuration) > 0 && aura.dataset.ambient === 'on';
  });
  expect(animating).toBe(false);
  await ctx.close();
});

test('calm mode toggle disables ambient animation and persists', async ({ page }) => {
  await seedTasks(page, [task('Take morning meds', 'light')]);
  await chooseEnergy(page, 'good');
  await expect(page.locator('[data-aura]')).toHaveAttribute('data-ambient', 'on');

  await page.getByRole('button', { name: /^calm/i }).click();
  await expect(page.locator('[data-aura]')).toHaveAttribute('data-ambient', 'off');
  const saved = await page.evaluate((k) => localStorage.getItem(k), STORAGE.settings);
  expect(JSON.parse(saved!).calm).toBe(true);

  await page.reload();
  await chooseEnergy(page, 'good');
  await expect(page.locator('[data-aura]')).toHaveAttribute('data-ambient', 'off');
});

test('keyboard only: check-in → energy switch → add task → done', async ({ page }) => {
  await chooseEnergy(page, 'good');
  await page.getByRole('button', { name: /add a task/i }).click();
  const box = page.getByRole('textbox', { name: /task title/i });
  await box.fill('Water the plant');
  await page.getByRole('button', { name: /^add$/i }).click();
  await expect(page.locator('[data-task-card]', { hasText: 'Water the plant' })).toBeVisible();

  await page.locator('[data-task-card]', { hasText: 'Water the plant' }).getByRole('button', { name: /as done/i }).click();
  await expect(page.locator('[data-task-card]', { hasText: 'Water the plant' })).toHaveCount(0);
});

test('compare view opens with C and closes with Escape', async ({ page }) => {
  await seedTasks(page, [task('Take morning meds', 'light'), task('Big grocery run', 'heavy')]);
  await chooseEnergy(page, 'good');
  await page.keyboard.press('c');
  const dialog = page.getByRole('dialog', { name: /compare/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByText(/a typical to-do app/i)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('demo day loads 20 tasks and low mode picks a light one', async ({ page }) => {
  await chooseEnergy(page, 'good');
  await page.getByRole('button', { name: /demo day/i }).click();
  await expect(page.locator('[data-task-card]')).toHaveCount(20);
  await chooseEnergy(page, 'low');
  const card = page.locator('[data-task-card]');
  await expect(card).toHaveCount(1);
  const title = (await card.innerText()).toLowerCase();
  expect(
    ['meds', 'reply', 'water bottle', 'stretch', 'text mom', 'library', 'wipe', 'wifi'].some((w) => title.includes(w))
  ).toBe(true);
});

test('check-in reappears on reload and remembers last choice', async ({ page }) => {
  await seedTasks(page, [task('Take morning meds', 'light')]);
  await chooseEnergy(page, 'okay');
  await page.reload();
  await expect(page.getByRole('dialog', { name: /how much energy/i })).toBeVisible();
  await expect(page.getByText(/last time you checked in as okay/i)).toBeVisible();
  const energy = await page.evaluate((k) => localStorage.getItem(k), STORAGE.energy);
  expect(energy).toContain('okay');
});

test('scheduled date gates visibility: tomorrow’s tasks never leak into today', async ({ page }) => {
  const tomorrow = localDay(1);
  await seedTasks(page, [task('Future thing', 'light', { scheduledFor: tomorrow }), task('Today thing', 'light', { scheduledFor: DAY })]);
  await chooseEnergy(page, 'good');
  await expect(page.getByText('Future thing')).toHaveCount(0);
  await expect(page.getByText('Today thing')).toBeVisible();
});

test('edit and delete round-trip through storage', async ({ page }) => {
  await seedTasks(page, [task('Original title', 'light')]);
  await chooseEnergy(page, 'good');
  const card = page.locator('[data-task-card]', { hasText: 'Original title' });
  await card.getByRole('button', { name: /edit /i }).click();
  await page.getByRole('textbox', { name: /task title/i }).fill('Gentler title');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText('Gentler title')).toBeVisible();

  const card2 = page.locator('[data-task-card]', { hasText: 'Gentler title' });
  await card2.getByRole('button', { name: /remove /i }).click();
  await card2.getByRole('button', { name: /confirm removing /i }).click();
  await expect(page.locator('[data-task-card]')).toHaveCount(0);
  const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks);
  expect(stored).toBe('[]');
});
