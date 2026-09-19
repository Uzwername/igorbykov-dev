import { expect, test } from '@playwright/test';

const DEFAULT_EMOJI = '🧑‍💻';
const UNICORN = '🦄';
const ROCKET = '🚀';

const ROLLS = [
  { roll: 0.5, emoji: DEFAULT_EMOJI },
  { roll: 0, emoji: UNICORN },
  { roll: 0.004999, emoji: UNICORN },
  { roll: 0.005, emoji: ROCKET },
  { roll: 0.014999, emoji: ROCKET },
  { roll: 0.015, emoji: DEFAULT_EMOJI },
];

test.describe('top nav logo', () => {
  test('links home', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  for (const { roll, emoji } of ROLLS) {
    test(`shows ${emoji} when the roll is ${String(roll)}`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        Math.random = () => value;
      }, roll);

      await page.goto('/');

      await expect(page.getByRole('link', { name: 'Home' })).toHaveText(emoji);
    });
  }
});
