import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env['CI']);

const MOBILE_ONLY_SPECS = /.*\.mobile\.spec\.ts/;
const DESKTOP_ONLY_SPECS = /.*\.desktop\.spec\.ts/;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Pin every emulated context setting explicitly so tests never depend on
    // a Playwright-owned default that could change. Specs that care about a
    // specific value override it locally with `test.use(...)`.
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testIgnore: DESKTOP_ONLY_SPECS,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 15'] },
      testIgnore: DESKTOP_ONLY_SPECS,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: MOBILE_ONLY_SPECS,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: MOBILE_ONLY_SPECS,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: MOBILE_ONLY_SPECS,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
