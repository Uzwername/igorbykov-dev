import { expect, test } from '@playwright/test';

const NAV_LABELS = ['Freelance', 'Projects', 'CV', 'Writing', 'Contact'];

test.describe('navigation on desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows every link inline in the header', async ({ page }) => {
    for (const label of NAV_LABELS) {
      await expect(
        page.locator('header').getByRole('link', { name: label }),
      ).toBeVisible();
    }
  });

  test('has no hamburger button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });
});
