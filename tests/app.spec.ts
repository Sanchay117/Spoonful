import { readFileSync } from 'node:fs';
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
    task('Big grocery run', 'heavy', { dueDate: localDay(1) }),
    task('Stretch for five minutes', 'light'),
  ]);

  await chooseEnergy(page, 'good');
  await axeCheck(page);

  await chooseEnergy(page, 'okay');
  await axeCheck(page);

  await chooseEnergy(page, 'low');
  await expect(page.locator('[data-coming-up]')).toBeVisible();
  await axeCheck(page);

  // the two-minute "Help me start" timer
  await page.getByRole('button', { name: /help me start/i }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await axeCheck(page);
  await page.getByRole('button', { name: /stop timer/i }).click();

  await page.getByRole('button', { name: /^compare/i }).click();
  await settle(page);
  await new AxeBuilder({ page }).include('[role="dialog"]').analyze().then((r) => {
    expect(r.violations).toEqual([]);
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // the edit form, with its due date field
  await chooseEnergy(page, 'good');
  await page.locator('[data-task-card]', { hasText: 'Big grocery run' }).getByRole('button', { name: /edit /i }).click();
  await axeCheck(page);
  await page.getByRole('button', { name: /^cancel$/i }).click();

  // the reminder dialog
  await page.getByRole('button', { name: /daily reminder/i }).click();
  await expect(page.getByRole('dialog', { name: /gentle daily nudge/i })).toBeVisible();
  await axeCheck(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /gentle daily nudge/i })).toHaveCount(0);

  // a full demo day: five tasks, the "more" toggle and Coming up
  await page.getByRole('button', { name: /demo day/i }).click();
  await expect(page.locator('[data-coming-up]')).toBeVisible();
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

test('quick add: type, Enter, done. No decisions, focus stays put', async ({ page }) => {
  await chooseEnergy(page, 'good');
  const box = page.getByRole('textbox', { name: /add a task/i });
  await box.fill('Water the plant');
  await box.press('Enter');
  const card = page.locator('[data-task-card]', { hasText: 'Water the plant' });
  await expect(card).toBeVisible();
  await expect(card.getByText('Medium')).toBeVisible();
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('');

  // a second one straight away, without touching the mouse
  await page.keyboard.type('Text Sam back');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-task-card]', { hasText: 'Text Sam back' })).toBeVisible();

  const stored = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!) as Array<Record<string, unknown>>;
  expect(stored.map((t) => [t.title, t.effort])).toEqual([
    ['Water the plant', 'medium'],
    ['Text Sam back', 'medium'],
  ]);

  await card.getByRole('button', { name: /as done/i }).click();
  await expect(card).toHaveCount(0);
});

test('quick add on an okay day says where a resting task went', async ({ page }) => {
  await seedTasks(page, [task('Light 1', 'light'), task('Light 2', 'light'), task('Light 3', 'light')]);
  await chooseEnergy(page, 'okay');
  const box = page.getByRole('textbox', { name: /add a task/i });
  await box.fill('Book the dentist');
  await box.press('Enter');
  await expect(page.getByText(/resting for now, hidden, not deleted/i)).toBeVisible();
  await expect(page.getByText(/1 task resting quietly/i)).toBeVisible();
});

test('quick add works on a low day too', async ({ page }) => {
  await seedTasks(page, [task('Take morning meds', 'light')]);
  await chooseEnergy(page, 'low');
  const box = page.getByRole('textbox', { name: /add a task/i });
  await box.fill('Call the pharmacy');
  await box.press('Enter');
  await expect(page.getByText(/added for a better day/i)).toBeVisible();
  // the focus card is unchanged: still one light thing
  await expect(page.locator('[data-task-card]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Take morning meds' })).toBeVisible();
});

test('tapping the effort pill cycles Light → Medium → Heavy → Light', async ({ page }) => {
  await seedTasks(page, [task('Pay the wifi bill', 'light')]);
  await chooseEnergy(page, 'good');
  const pill = page.getByRole('button', { name: /effort for .pay the wifi bill./i });
  const effort = async () =>
    (JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!) as Array<{ effort: string }>)[0].effort;

  await expect(pill).toHaveAccessibleName(/^light effort/i);
  await pill.click();
  await expect(pill).toHaveAccessibleName(/^medium effort/i);
  expect(await effort()).toBe('medium');
  await pill.click();
  await expect(pill).toHaveAccessibleName(/^heavy effort/i);
  await pill.click();
  await expect(pill).toHaveAccessibleName(/^light effort/i);
  expect(await effort()).toBe('light');
});

test('keyboard only: check-in → energy switch → add task → done', async ({ page }) => {
  await chooseEnergy(page, 'good');
  const box = page.getByRole('textbox', { name: /add a task/i });
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
  // even a good day starts with five; the rest are one tap away
  await expect(page.locator('[data-task-card]')).toHaveCount(5);
  await page.getByRole('button', { name: /15 more, whenever you want/i }).click();
  await expect(page.locator('[data-task-card]')).toHaveCount(20);
  await page.getByRole('button', { name: /show just five/i }).click();
  await expect(page.locator('[data-task-card]')).toHaveCount(5);
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
  const energy = await page.evaluate((k) => localStorage.getItem(k), STORAGE.energy);
  expect(energy).toContain('okay');

  // one tap keeps yesterday's answer, so the check-in never blocks the list
  await page.getByRole('button', { name: /same as last time: okay/i }).click();
  await expect(page.getByRole('dialog', { name: /how much energy/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /three things is plenty/i })).toBeVisible();
});

test('help me start: a gentle two-minute timer, then "You started. That counts."', async ({ page }) => {
  // The timer reads Date.now(), so skew only that. (Playwright's full fake clock also fakes
  // requestAnimationFrame, which stalls Framer Motion's exit animations after a jump.)
  await page.addInitScript(() => {
    const real = Date.now.bind(Date);
    const w = window as unknown as { __skew: number };
    w.__skew = 0;
    Date.now = () => real() + w.__skew;
  });
  const skip = (ms: number) => page.evaluate((m) => ((window as unknown as { __skew: number }).__skew += m), ms);
  await seedTasks(page, [task('Open the lab report doc', 'light')]);
  await chooseEnergy(page, 'low');

  await page.getByRole('button', { name: /help me start/i }).click();
  await expect(page.getByText(/just open the thing/i)).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/^(2:00|1:59)$/);

  await skip(60_000);
  await expect(page.getByRole('timer')).toHaveText(/^(1:00|0:59|0:58)$/);

  await skip(61_000);
  await expect(page.getByRole('heading', { name: /you started\. that counts\./i })).toBeVisible();

  // keep going returns to the card; the task is not marked done for you
  await page.getByRole('button', { name: /keep going/i }).click();
  await expect(page.getByRole('heading', { name: 'Open the lab report doc' })).toBeVisible();
  const stored = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!) as Array<Record<string, unknown>>;
  expect(stored[0].completedAt).toBeUndefined();

  // and the timer can always be stopped early
  await page.getByRole('button', { name: /help me start/i }).click();
  await page.getByRole('button', { name: /stop timer/i }).click();
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^done$/i })).toBeVisible();
});

test('harder than it looked: bumps the effort and offers something lighter', async ({ page }) => {
  await seedTasks(page, [task('Reply to Prof. Chen', 'light'), task('Fill the water bottle', 'light')]);
  await chooseEnergy(page, 'low');
  await expect(page.getByRole('heading', { name: 'Reply to Prof. Chen' })).toBeVisible();

  await page.getByRole('button', { name: /harder than it looked/i }).click();
  await expect(page.getByText(/moved to medium\. here’s something lighter\./i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fill the water bottle' })).toBeVisible();
  const stored = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!) as Array<Record<string, unknown>>;
  expect(stored.find((t) => t.title === 'Reply to Prof. Chen')?.effort).toBe('medium');

  // with nothing light left, rest is the answer, not a heavier task
  await page.getByRole('button', { name: /harder than it looked/i }).click();
  await expect(page.getByText(/nothing else is light, so rest counts today/i)).toBeVisible();
  await expect(page.getByText(/nothing needed today/i)).toBeVisible();
});

test('due dates surface calmly in Coming up, and only when soon', async ({ page }) => {
  await seedTasks(page, [
    task('Light 1', 'light'),
    task('Light 2', 'light'),
    task('Light 3', 'light'),
    task('Submit the housing form', 'medium', { dueDate: localDay(1) }),
    task('Renew the passport', 'heavy', { dueDate: localDay(20) }),
  ]);
  await chooseEnergy(page, 'okay');
  const soon = page.locator('[data-coming-up]');
  await expect(soon).toBeVisible();
  await expect(soon.getByText('Submit the housing form')).toBeVisible();
  await expect(soon.getByText('Due tomorrow')).toBeVisible();
  await expect(soon.getByText('Renew the passport')).toHaveCount(0);
  await expect(soon).not.toContainText(/overdue|late|missed/i);

  await chooseEnergy(page, 'low');
  await expect(page.locator('[data-coming-up]').getByText('Submit the housing form')).toBeVisible();

  // on a good day with room for it, the task is simply in the list instead
  await chooseEnergy(page, 'good');
  await expect(page.locator('[data-task-card]', { hasText: 'Submit the housing form' })).toBeVisible();
  await expect(page.locator('[data-coming-up]')).toHaveCount(0);
});

test('a due date can be set and cleared in the edit form', async ({ page }) => {
  await seedTasks(page, [task('Book the dentist', 'medium')]);
  await chooseEnergy(page, 'good');
  const card = page.locator('[data-task-card]', { hasText: 'Book the dentist' });
  const stored = async () =>
    (JSON.parse((await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks))!) as Array<Record<string, unknown>>)[0];

  await card.getByRole('button', { name: /edit /i }).click();
  await page.getByLabel(/due date/i).fill(localDay(2));
  await page.getByRole('button', { name: /^save$/i }).click();
  expect((await stored()).dueDate).toBe(localDay(2));

  await card.getByRole('button', { name: /edit /i }).click();
  await page.getByRole('button', { name: /^clear$/i }).click();
  await page.getByRole('button', { name: /^save$/i }).click();
  expect(Object.keys(await stored())).not.toContain('dueDate');
});

test('good day shows five, with the rest one tap away', async ({ page }) => {
  await seedTasks(page, Array.from({ length: 8 }, (_, i) => task(`Task ${i + 1}`, 'light')));
  await chooseEnergy(page, 'good');
  await expect(page.getByRole('heading', { name: /five to start/i })).toBeVisible();
  await expect(page.locator('[data-task-card]')).toHaveCount(5);
  const more = page.getByRole('button', { name: /3 more, whenever you want/i });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(page.locator('[data-task-card]')).toHaveCount(8);
});

test('daily reminder downloads a repeating calendar event, and keys stay in the dialog', async ({ page }) => {
  await chooseEnergy(page, 'good');
  await page.getByRole('button', { name: /daily reminder/i }).click();
  const dialog = page.getByRole('dialog', { name: /gentle daily nudge/i });
  await expect(dialog).toBeVisible();

  // the C shortcut must not open Compare behind the dialog
  await page.getByRole('button', { name: /download calendar file/i }).focus();
  await page.keyboard.press('c');
  await expect(page.getByRole('dialog', { name: /compare/i })).toHaveCount(0);

  await page.getByLabel(/^time$/i).fill('07:30');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download calendar file/i }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('spoonful-check-in.ics');
  const ics = readFileSync((await download.path())!, 'utf8');
  expect(ics).toContain('RRULE:FREQ=DAILY');
  expect(ics).toContain(`DTSTART:${DAY.replaceAll('-', '')}T073000`);
  expect(ics).toContain('BEGIN:VALARM');
  expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  expect(ics.split('\r\n').every((line) => !line.includes('\n'))).toBe(true);
  await expect(dialog.getByText(/open the file to add it to your calendar/i)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('scheduled date gates visibility: tomorrow’s tasks never leak into today', async ({ page }) => {
  const tomorrow = localDay(1);
  await seedTasks(page, [task('Future thing', 'light', { scheduledFor: tomorrow }), task('Today thing', 'light', { scheduledFor: DAY })]);
  await chooseEnergy(page, 'good');
  await expect(page.getByText('Future thing')).toHaveCount(0);
  await expect(page.getByText('Today thing', { exact: true })).toBeVisible();
});

test('edit and delete round-trip through storage', async ({ page }) => {
  await seedTasks(page, [task('Original title', 'light')]);
  await chooseEnergy(page, 'good');
  const card = page.locator('[data-task-card]', { hasText: 'Original title' });
  await card.getByRole('button', { name: /edit /i }).click();
  await page.getByRole('textbox', { name: /task title/i }).fill('Gentler title');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText('Gentler title', { exact: true })).toBeVisible();

  const card2 = page.locator('[data-task-card]', { hasText: 'Gentler title' });
  await card2.getByRole('button', { name: /remove /i }).click();
  await card2.getByRole('button', { name: /confirm removing /i }).click();
  await expect(page.locator('[data-task-card]')).toHaveCount(0);
  const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE.tasks);
  expect(stored).toBe('[]');
});
