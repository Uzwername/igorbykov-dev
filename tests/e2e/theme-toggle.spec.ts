import { expect, test } from '@playwright/test';
import { THEME_DARK, THEME_LIGHT, THEME_STORAGE_KEY } from '@/constants/theme';
import type { Theme } from '@/types/theme';
import type { Page } from '@playwright/test';

const getToggle = (page: Page) =>
  page.getByRole('button', { name: 'Toggle theme' });

const getStoredTheme = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), THEME_STORAGE_KEY);

const DARK_CLASS = new RegExp(`(^|\\s)${THEME_DARK}(\\s|$)`);

const expectTheme = async (page: Page, theme: Theme) => {
  const html = page.locator('html');

  if (theme === THEME_DARK) {
    await expect(html).toHaveClass(DARK_CLASS);
  } else {
    await expect(html).not.toHaveClass(DARK_CLASS);
  }

  expect(await getStoredTheme(page)).toBe(theme);
};

test.describe('theme toggle', () => {
  test.describe('with a dark system preference', () => {
    test.use({ colorScheme: 'dark' });

    test('starts in dark mode and remembers it', async ({ page }) => {
      await page.goto('/');

      await expectTheme(page, THEME_DARK);
    });
  });

  test.describe('with a light system preference', () => {
    test.use({ colorScheme: 'light' });

    test('starts in light mode and remembers it', async ({ page }) => {
      await page.goto('/');

      await expectTheme(page, THEME_LIGHT);
    });

    test('switches to dark and back on click', async ({ page }) => {
      await page.goto('/');

      await getToggle(page).click();
      await expectTheme(page, THEME_DARK);

      await getToggle(page).click();
      await expectTheme(page, THEME_LIGHT);
    });

    test('keeps the chosen theme after a reload', async ({ page }) => {
      await page.goto('/');
      await getToggle(page).click();
      await expectTheme(page, THEME_DARK);

      await page.reload();

      await expectTheme(page, THEME_DARK);
    });

    test('prefers a stored theme over the system preference', async ({
      page,
    }) => {
      await page.addInitScript(
        ({ key, value }) => {
          window.localStorage.setItem(key, value);
        },
        { key: THEME_STORAGE_KEY, value: THEME_DARK },
      );

      await page.goto('/');

      await expectTheme(page, THEME_DARK);
    });

    test('shows exactly one icon at a time', async ({ page }) => {
      await page.goto('/');
      const visibleIcons = getToggle(page).locator('svg:visible');

      await expect(visibleIcons).toHaveCount(1);

      await getToggle(page).click();

      await expect(visibleIcons).toHaveCount(1);
    });
  });
});
