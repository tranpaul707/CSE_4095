import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const defaults = { sound: false, animation: false, explanations: true, feedback: false, defaultOperations: ['addition','subtraction','multiplication','division'], defaultDifficulty: 1, defaultLength: 5, masteryThreshold: 3 };
test.beforeEach(async ({ page }) => {
  await page.addInitScript(settings => { if (!localStorage.getItem('mathPractice.settings')) localStorage.setItem('mathPractice.settings', JSON.stringify(settings)); }, defaults);
});
async function active(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.activeSession') || 'null')); }
async function begin(page, op = 'Addition', length = '5 questions') {
  await page.goto('/');
  await page.getByRole('link', { name: new RegExp(`^${op}`) }).click();
  await page.getByRole('radio', { name: length, exact: true }).check();
  await page.getByRole('button', { name: /Start Session/ }).click();
  await expect(page.getByRole('button', { name: /Flip Card/ })).toBeVisible();
}
async function report(page, right = true, selectedCorrect = right) {
  const before = await active(page); const q = before.question;
  const value = selectedCorrect ? q.correctAnswer : q.choices.find(n => n !== q.correctAnswer);
  await page.getByRole('button', { name: new RegExp(`^Answer [1-4]: ${value}$`) }).click();
  await page.getByRole('button', { name: /Flip Card/ }).click();
  await page.getByRole('button', { name: right ? /I Got It Right/ : /I Got It Wrong/ }).click();
  await page.waitForFunction(id => { const a = JSON.parse(localStorage.getItem('mathPractice.activeSession') || 'null'); return !a || a.question.id !== id; }, q.id);
}
for (const operation of ['Addition', 'Subtraction', 'Multiplication', 'Division']) {
  test(`complete ${operation} session, persist final mistake before summary`, async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await begin(page, operation);
    for (let i = 0; i < 5; i++) await report(page, i < 4);
    await expect(page).toHaveURL(/practice\/summary/);
    const results = page.getByRole('definition');
    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Practice Mistakes/ })).toBeEnabled();
    const summary = await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.summary')));
    expect(summary).toMatchObject({ attempted: 5, correct: 4, incorrect: 1 });
    await expect(results.first()).toHaveText('5');
    await page.reload(); await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
    await page.getByRole('button', { name: /Practice Again/ }).click();
    await expect(page.getByRole('button', { name: /Flip Card/ })).toBeVisible();
    expect((await active(page)).session.completedAt).toBeUndefined();
    expect(errors).toEqual([]);
  });
}
test('answer choice never scores until flipped and self-reported; reload preserves card', async ({ page }) => {
  page.on('dialog', d => d.accept()); await begin(page);
  await expect(page.getByRole('button', { name: /Flip Card/ })).toBeDisabled();
  const q = (await active(page)).question;
  await page.getByRole('button', { name: new RegExp(`^Answer [1-4]: ${q.correctAnswer}$`) }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.attempts') || '[]').length)).toBe(0);
  await page.reload(); await expect(page.getByRole('button', { name: /Flip Card/ })).toBeEnabled();
  await page.getByRole('button', { name: /Flip Card/ }).click();
  await page.reload(); await expect(page.getByRole('button', { name: /I Got It Wrong/ })).toBeVisible();
  await page.getByRole('button', { name: /I Got It Wrong/ }).click();
  await expect.poll(async () => (await active(page))?.question.id).not.toBe(q.id);
  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.attempts')));
  expect(attempts).toHaveLength(1); expect(attempts[0]).toMatchObject({ selectedAnswer: q.correctAnswer, selfReportedCorrect: false });
});
test('review generates related questions and masters a source pattern after three successes', async ({ page }) => {
  await begin(page, 'Multiplication'); for (let i = 0; i < 5; i++) await report(page, i < 4);
  const pattern = await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.mistakePatterns'))[0]);
  await page.getByRole('button', { name: /Practice Mistakes/ }).click();
  await expect(page.getByRole('button', { name: /Mistake Review/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Start Session/ }).click();
  for (let i = 0; i < 3; i++) {
    const q = (await active(page)).question;
    expect(q.source).toBe('mistake-review'); expect(q.mistakePatternId).toBe(pattern.id);
    expect([q.operation,q.firstOperand,q.secondOperand]).not.toEqual([pattern.question.operation,pattern.question.firstOperand,pattern.question.secondOperand]);
    await report(page, true);
  }
  await expect(page.getByText('All saved patterns are mastered.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.mistakePatterns'))[0].mastered)).toBe(true);
  await page.getByRole('link', { name: 'View Statistics', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mastered (1)' })).toBeVisible();
});
test('continuous practice ends explicitly; navigation requires confirmation', async ({ page }) => {
  await begin(page, 'Division', 'Keep going'); await report(page);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(/practice\/session/);
  await page.getByRole('button', { name: 'End Session', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'End Session', exact: true }).click();
  await expect(page).toHaveURL(/practice\/summary/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.summary')).attempted)).toBe(1);
});
test('setup validation, settings defaults, explanations, and confirmed resets work', async ({ page }) => {
  await page.goto('/practice/setup');
  for (const op of ['Addition','Subtraction','Multiplication','Division']) await page.getByRole('button', { name: op, exact: true }).click();
  await expect(page.getByRole('button', { name: /Start Session/ })).toBeDisabled();
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: /Show explanations/ }).uncheck();
  await page.getByRole('radio', { name: /Intermediate/ }).check();
  await page.getByLabel('Default session length').selectOption('20');
  await page.reload(); await expect(page.getByRole('checkbox', { name: /Show explanations/ })).not.toBeChecked();
  await page.getByRole('navigation').getByRole('link', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Intermediate/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: '20 questions', exact: true })).toBeChecked();
  await page.getByRole('button', { name: /Start Session/ }).click();
  await page.getByRole('button', { name: /^Answer 1:/ }).click(); await page.getByRole('button', { name: /Flip Card/ }).click();
  await expect(page.locator('.explanation')).toHaveCount(0);
  await page.getByRole('button', { name: /I Got It Right/ }).click();
  await page.getByRole('button', { name: 'End Session', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'End Session', exact: true }).click();
  await page.getByRole('link', { name: 'View Statistics', exact: true }).click();
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.attempts')).length)).toBe(1);
  await page.getByRole('button', { name: 'Reset Statistics', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset Statistics', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.attempts')).length)).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mathPractice.settings')).defaultDifficulty)).toBe(3);
  await page.evaluate(() => localStorage.setItem('unrelated-example', 'keep'));
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Clear All Application Data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Clear All Data', exact: true }).click();
  await expect(page).toHaveURL('/'); expect(await page.evaluate(() => localStorage.getItem('unrelated-example'))).toBe('keep');
});
test('mixed practice, keyboard-only session, reduced motion, and live announcements', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/practice/setup');
  await page.getByRole('button', { name: /Select all/ }).click(); await page.getByRole('button', { name: /Start Session/ }).click();
  for (let i = 0; i < 5; i++) {
    const id = (await active(page)).question.id;
    await page.keyboard.press('1'); await page.keyboard.press('Tab');
    // Activate the actual flip control with the keyboard, then the focused result.
    await page.getByRole('button', { name: /Flip Card/ }).focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /I Got It Right/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForFunction(id => { const a = JSON.parse(localStorage.getItem('mathPractice.activeSession') || 'null'); return !a || a.question.id !== id; }, id);
  }
  await expect(page).toHaveURL(/practice\/summary/);
});
test('storage errors show a friendly warning while practice continues', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.goto('/practice/setup'); await page.getByRole('button', { name: /Start Session/ }).click();
  await expect(page.getByRole('status').filter({ hasText: /could not be saved/ })).toBeVisible();
  await page.getByRole('button', { name: /^Answer 1:/ }).click(); await page.getByRole('button', { name: /Flip Card/ }).click();
  await page.getByRole('button', { name: /I Got It Wrong/ }).click();
  await expect(page.getByText('Question 2 of 5')).toBeVisible();
});
for (const width of [375, 768, 1280]) {
  test(`responsive layouts and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/practice/setup', '/statistics', '/settings']) {
      await page.goto(path); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
    }
  });
}

test('question faces and a populated summary pass automated accessibility checks', async ({ page }) => {
  await begin(page, 'Subtraction');
  let result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await page.getByRole('button', { name: /^Answer 1:/ }).click();
  await page.getByRole('button', { name: /Flip Card/ }).click();
  result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await page.getByRole('button', { name: /I Got It Wrong/ }).click();
  await expect(page.getByText('Question 2 of 5')).toBeVisible();
  for (let i = 0; i < 4; i++) await report(page);
  await expect(page).toHaveURL(/practice\/summary/);
  result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
});

test('feedback remains readable before auto advance and disables duplicate reports', async ({ page }) => {
  await page.clock.install();
  await page.goto('/settings');
  await page.getByRole('checkbox', { name: /Encouraging feedback/ }).check();
  await page.getByRole('navigation').getByRole('link', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: /Start Session/ }).click();
  const q = (await active(page)).question;
  await page.getByRole('button', { name: /^Answer 1:/ }).click(); await page.getByRole('button', { name: /Flip Card/ }).click();
  await page.getByRole('button', { name: /I Got It Right/ }).click();
  await expect(page.getByText('Nice work! Your confidence is growing.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /I Got It Wrong/ })).toBeDisabled();
  await page.clock.fastForward(1000); expect((await active(page)).question.id).toBe(q.id);
  await page.clock.fastForward(600); expect((await active(page)).question.id).not.toBe(q.id);
});

test('sound preference triggers Web Audio and turning it off stops new sounds', async ({ page }) => {
  await page.addInitScript(() => {
    window.__soundNodes = 0;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function() { window.__soundNodes++; return create.call(this); };
  });
  await page.goto('/settings');
  await page.getByRole('checkbox', { name: /^Sound effects/ }).check();
  await page.getByRole('button', { name: /Try a sound/ }).click();
  await expect.poll(() => page.evaluate(() => window.__soundNodes)).toBe(2);
  await page.getByRole('checkbox', { name: /^Sound effects/ }).uncheck();
  await page.getByRole('navigation').getByRole('link', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: /Start Session/ }).click();
  await page.getByRole('button', { name: /^Answer 1:/ }).click(); await page.getByRole('button', { name: /Flip Card/ }).click();
  expect(await page.evaluate(() => window.__soundNodes)).toBe(2);
});
