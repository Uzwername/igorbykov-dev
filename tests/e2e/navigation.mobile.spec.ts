import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { MOBILE_NAV_BACKDROP_ID, MOBILE_NAV_PANEL_ID } from '@/constants/html';

const NAV_LABELS = ['Freelance', 'Projects', 'CV', 'Writing', 'Contact'];

const getOpenButton = (page: Page) =>
  page.getByRole('button', { name: 'Open menu' });
const getCloseButton = (page: Page) =>
  page.getByRole('button', { name: 'Close menu' });
const getPanel = (page: Page) => page.locator(`#${MOBILE_NAV_PANEL_ID}`);
const getBackdrop = (page: Page) => page.locator(`#${MOBILE_NAV_BACKDROP_ID}`);
const getViewportWidth = (page: Page) => page.evaluate(() => window.innerWidth);

test.describe('navigation on mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('keeps the menu closed by default', async ({ page }) => {
    await expect(getOpenButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(getPanel(page)).not.toBeInViewport();
  });

  test('opens from the hamburger and focuses the close button', async ({
    page,
  }) => {
    await getOpenButton(page).tap();

    await expect(getOpenButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(getPanel(page)).toBeInViewport();
    await expect(getCloseButton(page)).toBeFocused();
  });

  test('lists every link inside the open menu', async ({ page }) => {
    await getOpenButton(page).tap();

    for (const label of NAV_LABELS) {
      await expect(
        getPanel(page).getByRole('link', { name: label }),
      ).toBeVisible();
    }
  });

  test('closes with the close button and returns focus to the hamburger', async ({
    page,
  }) => {
    await getOpenButton(page).tap();
    await getCloseButton(page).tap();

    await expect(getOpenButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(getPanel(page)).not.toBeInViewport();
    await expect(getOpenButton(page)).toBeFocused();
  });

  test('closes when the backdrop is tapped', async ({ page }) => {
    await getOpenButton(page).tap();
    await expect(getPanel(page)).toBeInViewport();

    await getBackdrop(page).tap({ position: { x: 10, y: 300 } });

    await expect(getOpenButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(getPanel(page)).not.toBeInViewport();
  });

  test('opens as a bordered side panel narrower than the screen', async ({
    page,
  }) => {
    await getOpenButton(page).tap();

    await expect(getPanel(page)).toBeInViewport();
    await expect(getPanel(page)).toHaveCSS('border-left-width', '1px');
    expect((await getPanel(page).boundingBox())?.width).toBeLessThan(
      await getViewportWidth(page),
    );
  });

  test.describe('on very small screens', () => {
    test.use({ viewport: { width: 300, height: 600 } });

    test('opens full width without a left border', async ({ page }) => {
      await getOpenButton(page).tap();

      await expect(getPanel(page)).toBeInViewport();
      await expect(getPanel(page)).toHaveCSS('border-left-width', '0px');
      await expect
        .poll(async () => (await getPanel(page).boundingBox())?.width)
        .toBe(await getViewportWidth(page));
    });
  });
});
