import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...compat.config({
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
      node: true,
      browser: true,
    },
    plugins: ['@typescript-eslint', 'unused-imports'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:svelte/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
    ],
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.js', '.cjs', '.mjs', '.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    parserOptions: {
      sourceType: 'module',
      extraFileExtensions: ['.svelte'],
    },
    overrides: [
      {
        files: ['**/*.svelte'],
        parser: 'svelte-eslint-parser',
        parserOptions: {
          parser: '@typescript-eslint/parser',
        },
      },
    ],
    rules: {
      'no-constant-condition': ['error', { checkLoops: false }],
      'import/no-duplicates': 'off',
      'svelte/valid-compile': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-prototype-builtins': 'off',
      'svelte/sort-attributes': 'warn',
      'import/order': [
        'warn',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^obsidian$', '^@testing-library/svelte$'],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase'],
        },
      ],
    },
  }),
  {
    files: ['**/*.svelte'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
];
