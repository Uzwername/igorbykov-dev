import path from 'node:path';
// Loaded by Node's native type stripping (see the `lint` scripts' `--flag`),
// so erasable TypeScript syntax only.
import fs from 'node:fs/promises';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVitest from '@vitest/eslint-plugin';
import pluginImportX from 'eslint-plugin-import-x';
import eslintPluginAstro from 'eslint-plugin-astro';
import pluginPlaywright from 'eslint-plugin-playwright';
import { globalIgnores, defineConfig } from 'eslint/config';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import type { Linter } from 'eslint';

const rawGitIgnoreContents = await fs.readFile(
  path.join(import.meta.dirname, '.gitignore'),
  { encoding: 'utf8' },
);

const gitIgnoreContents = rawGitIgnoreContents
  .split('\n')
  .reduce<string[]>((accumulator, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      return accumulator;
    }

    return [...accumulator, line];
  }, []);

const customRules: Readonly<Linter.RulesRecord> = {
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

// Every group is keyed off a naming convention (folder name or file
// extension), so new files sort correctly without touching this config.
// Internal paths are anything under the `@/` or `~/` aliases.
const INTERNAL_DIR = '^[@~]/(.+/)?';

const importOrderRules = {
  'perfectionist/sort-imports': [
    'error',
    {
      type: 'line-length',
      order: 'asc',
      fallbackSort: { type: 'alphabetical' },
      internalPattern: ['^[@~]/'],
      newlinesBetween: 0,
      customGroups: [
        {
          groupName: 'framework',
          modifiers: ['value'],
          elementNamePattern: '^(astro|react|react-dom)([/:]|$)|^@astrojs/',
        },
        {
          groupName: 'constants',
          modifiers: ['value'],
          elementNamePattern: `${INTERNAL_DIR}(constants|types)/`,
        },
        {
          groupName: 'utils',
          modifiers: ['value'],
          elementNamePattern: `${INTERNAL_DIR}utils/`,
        },
        {
          groupName: 'abstractions',
          modifiers: ['value'],
          elementNamePattern: `${INTERNAL_DIR}(components|layouts|hooks|classes)/`,
        },
        {
          groupName: 'data',
          modifiers: ['value'],
          elementNamePattern: `${INTERNAL_DIR}data/|\\.json$`,
        },
        {
          groupName: 'assets',
          modifiers: ['value'],
          elementNamePattern: `${INTERNAL_DIR}(assets|styles)/|\\.(css|gif|png|jpe?g|webp|avif|svg|mp4|webm|woff2?)(\\?.*)?$`,
        },
        {
          groupName: 'type-relative',
          modifiers: ['type'],
          elementNamePattern: '^\\.',
        },
      ],
      groups: [
        'value-builtin',
        'framework',
        'value-external',
        'constants',
        'utils',
        'abstractions',
        // Internal imports matching none of the conventions above.
        'value-internal',
        'data',
        'assets',
        ['value-parent', 'value-sibling', 'value-index'],
        // All type imports last, relative ones at the very end.
        'type-import',
        { newlinesBetween: 0 },
        'type-relative',
      ],
    },
  ],
  // `import type { X }` on its own line, never `import Y, { type X }`.
  'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
} satisfies Linter.RulesRecord;

const typeImportRules = {
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { fixStyle: 'separate-type-imports' },
  ],
} satisfies Linter.RulesRecord;

const baseConfig = [
  globalIgnores(gitIgnoreContents),
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      perfectionist: pluginPerfectionist,
      'import-x': pluginImportX,
    },
    rules: { ...customRules, ...importOrderRules },
  },
];

const tsConfigFilesConfig = [
  ...baseConfig,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: typeImportRules,
  },
];

const typeCheckedTsFilesConfig = [
  ...baseConfig,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    rules: typeImportRules,
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
    } satisfies Linter.RulesRecord,
  },
];

const srcTsFilesConfig = [
  ...typeCheckedTsFilesConfig,
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
    } satisfies Linter.RulesRecord,
  },
];

export default [
  // TS configs
  ...defineConfig({
    files: ['*.ts'],
    extends: tsConfigFilesConfig,
  }),
  // Project TS files
  ...defineConfig({
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: srcTsFilesConfig,
  }),
  // Asset generation scripts
  ...defineConfig({
    files: ['scripts/**/*.ts'],
    extends: typeCheckedTsFilesConfig,
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
