// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import eslint from '@eslint/js';
import { globalIgnores, defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import pluginVitest from '@vitest/eslint-plugin';
import pluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const rawGitIgnoreContents = await fs.readFile(
  path.join(import.meta.dirname, '.gitignore'),
  { encoding: 'utf8' },
);

/** @type {Array.<string>} */
const _accumulator = [];
const gitIgnoreContents = rawGitIgnoreContents
  .split('\n')
  .reduce((accumulator, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      return accumulator;
    }

    return [...accumulator, line];
  }, _accumulator);

/** @type {Readonly<import('eslint/config').Config['rules']>} */
const customRules = {
  'linebreak-style': ['error', 'unix'],
  quotes: [
    'error',
    'single',
    {
      avoidEscape: true,
    },
  ],
  semi: ['error', 'always'],
  'eol-last': ['error', 'always'],
};

const baseConfig = [
  globalIgnores(gitIgnoreContents),
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: customRules,
  },
];

const tsConfigFilesConfig = [
  ...baseConfig,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
];

const srcTsFilesConfig = [
  ...baseConfig,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...eslintPluginAstro.configs['jsx-a11y-strict'],
];

const srcAstroFilesConfig = [
  ...baseConfig,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-strict'],
];

const tsVitestConfig = [
  ...srcTsFilesConfig,
  pluginVitest.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-strict'],
];

const tsPlaywrightConfig = [
  ...srcTsFilesConfig,
  pluginPlaywright.configs['flat/recommended'],
  {
    rules: {
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectTheme'] },
      ],
    },
  },
];

export default [
  // TS configs
  ...defineConfig({
    files: ['*.ts'],
    extends: tsConfigFilesConfig,
  }),
  // non-TS configs
  ...defineConfig({
    files: ['*.mjs'],
    extends: baseConfig,
  }),
  // Project TS files
  ...defineConfig({
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: srcTsFilesConfig,
  }),
  // Project astro files
  ...defineConfig({
    files: ['src/**/*.astro'],
    extends: srcAstroFilesConfig,
  }),
  // Unit test files
  ...defineConfig({
    files: ['tests/unit/**/*.ts'],
    extends: tsVitestConfig,
  }),
  // E2E test files
  ...defineConfig({
    files: ['tests/e2e/**/*.ts'],
    extends: tsPlaywrightConfig,
  }),
];
