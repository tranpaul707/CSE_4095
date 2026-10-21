import { test, expect } from '@playwright/test';

test('production scaffold loads its modules and accessible navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Math Meadow/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little practice.');
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link'),
  ).toHaveCount(3);
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  expect(errors).toEqual([]);
});
